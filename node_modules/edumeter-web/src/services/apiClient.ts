export type ApiErrorPayload = {
  code?: string;
  message?: string;
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const TOKEN_KEY = 'edumeter_token';
const TENANT_KEY = 'edumeter_tenant';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string | null) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },
  getTenantId(): string | null {
    return localStorage.getItem(TENANT_KEY);
  },
  setTenantId(tenantId: string | null) {
    if (tenantId) localStorage.setItem(TENANT_KEY, tenantId);
    else localStorage.removeItem(TENANT_KEY);
  }
};

export type ApiClientOptions = {
  baseUrl?: string;
};

export class ApiClient {
  private baseUrl: string;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? '';
  }

  private buildUrl(path: string) {
    if (!this.baseUrl) return path;
    return `${this.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }

  private async parseResponse<T>(res: Response): Promise<T> {
    const contentType = res.headers.get('content-type') ?? '';
    if (res.status === 204) return undefined as T;

    if (contentType.includes('application/json')) {
      return (await res.json()) as T;
    }

    const text = await res.text();
    return text as unknown as T;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = authStorage.getToken();
    const tenantId = authStorage.getTenantId();

    const headers = new Headers(init?.headers ?? {});
    headers.set('Accept', 'application/json');

    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (tenantId) headers.set('X-Tenant-Id', tenantId);

    if (init?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(this.buildUrl(path), {
      ...init,
      headers
    });

    if (response.ok) {
      return await this.parseResponse<T>(response);
    }

    let payload: ApiErrorPayload | undefined;
    try {
      payload = await this.parseResponse<ApiErrorPayload>(response);
    } catch {
      payload = undefined;
    }

    const message = payload?.message || response.statusText || 'Request failed';
    throw new ApiError(response.status, message, payload?.code, payload?.details);
  }

  get<T>(path: string, init?: RequestInit) {
    return this.request<T>(path, { ...init, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>(path, {
      ...init,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  put<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>(path, {
      ...init,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  patch<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>(path, {
      ...init,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  delete<T>(path: string, init?: RequestInit) {
    return this.request<T>(path, { ...init, method: 'DELETE' });
  }
}

export const createApiClient = (options: ApiClientOptions = {}) => new ApiClient(options);
