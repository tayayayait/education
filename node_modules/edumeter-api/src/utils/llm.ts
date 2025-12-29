export type LlmGenerationItem = {
  stem: string;
  options?: string[];
  answer: string;
  explanation?: string;
};

export type LlmValidationIssue = {
  rule: string;
  message: string;
};

type ChatCompletionRequestMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type LlmConfig = {
  baseUrl: string;
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  timeoutMs: number;
  validationEnabled: boolean;
};

type LlmCallResult = {
  content: string;
  raw: unknown;
};

const parseNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export const resolveLlmConfig = (overrides?: {
  modelName?: string;
  parameters?: Record<string, unknown>;
}) => {
  const baseUrl = process.env.LLM_BASE_URL ?? process.env.LLM_API_BASE_URL ?? '';
  const apiKey = process.env.LLM_API_KEY ?? undefined;
  const model = overrides?.modelName ?? process.env.LLM_MODEL ?? '';
  const temperature = parseNumber(overrides?.parameters?.temperature) ?? parseNumber(process.env.LLM_TEMPERATURE) ?? 0.2;
  const maxTokens = parseNumber(overrides?.parameters?.max_tokens) ?? parseNumber(process.env.LLM_MAX_TOKENS);
  const timeoutMs = parseNumber(process.env.LLM_TIMEOUT_MS) ?? 30000;
  const validationEnabled = (process.env.LLM_VALIDATION ?? 'true').toLowerCase() !== 'false';

  if (!baseUrl || !model) {
    throw new Error('LLM configuration missing (LLM_BASE_URL/LLM_MODEL)');
  }

  return {
    baseUrl,
    apiKey,
    model,
    temperature,
    maxTokens,
    timeoutMs,
    validationEnabled
  } satisfies LlmConfig;
};

const buildChatUrl = (baseUrl: string) => {
  if (/\/v1\/chat\/completions$/.test(baseUrl)) return baseUrl;
  const path = process.env.LLM_CHAT_PATH ?? '/v1/chat/completions';
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl.replace(/\/$/, '')}${suffix}`;
};

const extractJson = (content: string) => {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : content;
  const trimmed = raw.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return JSON.parse(trimmed);
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return JSON.parse(trimmed);
  }

  throw new Error('Unable to parse JSON from LLM response');
};

export const renderPromptTemplate = (template: {
  template: string;
  subject?: string | null;
  grade?: string | null;
  difficulty?: string | null;
  intent?: string | null;
  core_concept?: string | null;
}) => {
  const replacements: Record<string, string> = {
    '{{subject}}': template.subject ?? '',
    '{{grade}}': template.grade ?? '',
    '{{difficulty}}': template.difficulty ?? '',
    '{{intent}}': template.intent ?? '',
    '{{coreConcept}}': template.core_concept ?? ''
  };

  let text = template.template ?? '';
  Object.entries(replacements).forEach(([key, value]) => {
    text = text.replaceAll(key, value);
  });

  return text.trim();
};

const callChatCompletion = async (config: LlmConfig, messages: ChatCompletionRequestMessage[], parameters?: Record<string, unknown>): Promise<LlmCallResult> => {
  const url = buildChatUrl(config.baseUrl);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  const body: Record<string, unknown> = {
    model: config.model,
    temperature: config.temperature,
    messages
  };

  if (config.maxTokens) {
    body.max_tokens = config.maxTokens;
  }

  if (parameters) {
    Object.entries(parameters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      body[key] = value;
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = (payload as any)?.error?.message ?? response.statusText;
      throw new Error(`LLM request failed: ${message}`);
    }

    const content = (payload as any)?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('LLM response missing content');
    }

    return { content, raw: payload };
  } finally {
    clearTimeout(timeout);
  }
};

export const generateItemsWithLlm = async (params: {
  template: {
    template: string;
    name: string;
    subject?: string | null;
    grade?: string | null;
    difficulty?: string | null;
    intent?: string | null;
    core_concept?: string | null;
  };
  count: number;
  modelName?: string;
  parameters?: Record<string, unknown>;
}) => {
  const config = resolveLlmConfig({ modelName: params.modelName, parameters: params.parameters });
  const renderedTemplate = renderPromptTemplate(params.template);

  const systemPrompt = 'You are an educational assessment item generator. Output only JSON and nothing else.';

  const userPrompt = `
다음 템플릿과 메타데이터에 맞춰 문항을 생성하세요.

[템플릿]
${renderedTemplate}

[메타데이터]
- 과목: ${params.template.subject ?? '미정'}
- 학년: ${params.template.grade ?? '미정'}
- 난이도: ${params.template.difficulty ?? '미정'}
- 출제 의도: ${params.template.intent ?? '미정'}
- 핵심 개념: ${params.template.core_concept ?? '미정'}

요구사항:
1) ${params.count}개의 문항을 생성합니다.
2) 각 문항은 stem(지문), options(보기 배열), answer(정답), explanation(해설)을 포함합니다.
3) answer는 options 중 하나와 정확히 일치해야 합니다.
4) JSON 형식만 반환합니다.

반환 형식 예시:
{
  "items": [
    {
      "stem": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "explanation": "..."
    }
  ]
}
`;

  const messages: ChatCompletionRequestMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const response = await callChatCompletion(config, messages, params.parameters);
  const parsed = extractJson(response.content);
  const items = Array.isArray((parsed as any)?.items) ? (parsed as any).items : parsed;

  if (!Array.isArray(items)) {
    throw new Error('LLM did not return item list');
  }

  const normalized: LlmGenerationItem[] = items.map((item: any) => {
    const stem = String(item?.stem ?? '').trim();
    const answerRaw = item?.answer ?? '';
    const answer = typeof answerRaw === 'number' && Array.isArray(item?.options)
      ? String(item.options[answerRaw] ?? '')
      : String(answerRaw ?? '').trim();

    const options = Array.isArray(item?.options)
      ? item.options.map((opt: any) => String(opt).trim()).filter(Boolean)
      : undefined;

    const explanation = item?.explanation ? String(item.explanation).trim() : undefined;

    return {
      stem,
      options: options && options.length > 0 ? options : undefined,
      answer,
      explanation
    };
  }).filter(item => item.stem && item.answer);

  return normalized.slice(0, params.count);
};

export const validateItemWithLlm = async (params: {
  item: LlmGenerationItem;
  template: {
    subject?: string | null;
    grade?: string | null;
    difficulty?: string | null;
    intent?: string | null;
    core_concept?: string | null;
  };
  modelName?: string;
  parameters?: Record<string, unknown>;
}) => {
  const config = resolveLlmConfig({ modelName: params.modelName, parameters: params.parameters });
  if (!config.validationEnabled) return [] as LlmValidationIssue[];

  const systemPrompt = 'You are an assessment QA reviewer. Output only JSON.';
  const userPrompt = `
다음 문항을 검증하고 문제점을 JSON으로 보고하세요.

[문항]
- stem: ${params.item.stem}
- options: ${(params.item.options ?? []).join(' | ')}
- answer: ${params.item.answer}
- explanation: ${params.item.explanation ?? ''}

[목표 메타]
- 난이도: ${params.template.difficulty ?? '미정'}
- 출제 의도: ${params.template.intent ?? '미정'}
- 핵심 개념: ${params.template.core_concept ?? '미정'}

검증 항목:
1) 문법/표현 오류
2) 정답-보기 일관성
3) 난이도 적합성

JSON 형식:
{
  "issues": [
    { "rule": "GRAMMAR", "message": "..." },
    { "rule": "ANSWER_CONSISTENCY", "message": "..." },
    { "rule": "DIFFICULTY", "message": "..." }
  ]
}

문제가 없으면 issues는 빈 배열로 반환하세요.
`;

  const messages: ChatCompletionRequestMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const response = await callChatCompletion(config, messages, params.parameters);
  const parsed = extractJson(response.content) as { issues?: Array<{ rule?: string; message?: string }> };
  const issues = Array.isArray(parsed.issues) ? parsed.issues : [];

  return issues
    .filter(issue => issue && issue.message)
    .map(issue => ({
      rule: issue.rule ?? 'OTHER',
      message: issue.message ?? ''
    }));
};
