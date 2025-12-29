export type PromptTemplate = {
  id: string;
  code: string;
  name: string;
  subject?: string;
  grade?: string;
  difficulty?: string;
  intent?: string;
  core_concept?: string;
  template: string;
  version: number;
  is_active: boolean;
};

export type GenerationItem = {
  id: string;
  sequence: number;
  status: string;
  stem: string;
  answer: string;
  created_at: string;
};

export type GenerationRun = {
  id: string;
  prompt_template_id: string;
  status: string;
  model_name?: string | null;
  model_version?: string | null;
  parameters?: Record<string, unknown> | null;
  created_at: string;
};

export type RunResponse = {
  run: { id: string };
  items: GenerationItem[];
};
