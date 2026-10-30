import {
  RequestOtpResponse,
  VerifyOtpResponse,
  ResendOtpResponse,
  SessionResponse,
  HealthResponse,
  SmsJobStatusResponse,
  ApiTrace,
} from '../types/auth';

class ApiService {
  private baseUrl: string;
  private apiKey: string;
  private traces: ApiTrace[] = [];
  private onTraceUpdate?: (traces: ApiTrace[]) => void;

  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
    this.apiKey = import.meta.env.VITE_API_KEY || 'dmy_live_secret_dev_key_arrout_2026';
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  getApiKey() {
    return this.apiKey;
  }

  setTraceCallback(cb: (traces: ApiTrace[]) => void) {
    this.onTraceUpdate = cb;
  }

  getTraces() {
    return [...this.traces];
  }

  private async fetchWithTrace<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: unknown,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey,
      ...customHeaders,
    };

    let responseStatus = 0;
    let responseData: any = null;

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      responseStatus = res.status;
      responseData = await res.json().catch(() => ({}));

      const durationMs = Math.round(performance.now() - start);

      const trace: ApiTrace = {
        timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        endpoint,
        method,
        status: responseStatus,
        requestBody: body,
        responseBody: responseData,
        durationMs,
      };

      this.traces.unshift(trace);
      if (this.traces.length > 20) this.traces.pop();
      this.onTraceUpdate?.(this.getTraces());

      if (!res.ok) {
        const errorMsg = responseData?.error?.message || `HTTP ${res.status}: Request failed`;
        const err = new Error(errorMsg) as Error & { code?: string; status?: number; data?: any };
        err.code = responseData?.error?.code;
        err.status = res.status;
        err.data = responseData;
        throw err;
      }

      return responseData as T;
    } catch (err: any) {
      if (responseStatus === 0) {
        // Network or connection refused
        const durationMs = Math.round(performance.now() - start);
        const trace: ApiTrace = {
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          endpoint,
          method,
          status: 0,
          requestBody: body,
          responseBody: { error: 'NetworkError: Connection refused or server offline' },
          durationMs,
        };
        this.traces.unshift(trace);
        if (this.traces.length > 20) this.traces.pop();
        this.onTraceUpdate?.(this.getTraces());
      }
      throw err;
    }
  }

  async getHealth(): Promise<HealthResponse> {
    return this.fetchWithTrace<HealthResponse>('/api/v1/health', 'GET');
  }

  async requestOtp(phoneNumber: string): Promise<RequestOtpResponse> {
    return this.fetchWithTrace<RequestOtpResponse>('/api/v1/auth/request-otp', 'POST', {
      phoneNumber,
    });
  }

  async verifyOtp(correlationId: string, code: string): Promise<VerifyOtpResponse> {
    return this.fetchWithTrace<VerifyOtpResponse>('/api/v1/auth/verify-otp', 'POST', {
      correlationId,
      code,
    });
  }

  async resendOtp(correlationId: string): Promise<ResendOtpResponse> {
    return this.fetchWithTrace<ResendOtpResponse>('/api/v1/auth/resend-otp', 'POST', {
      correlationId,
    });
  }

  async logout(sessionToken: string): Promise<{ success: boolean; message: string }> {
    return this.fetchWithTrace<{ success: boolean; message: string }>(
      '/api/v1/auth/logout',
      'POST',
      { sessionToken },
      { Authorization: `Bearer ${sessionToken}` }
    );
  }

  async getSession(sessionToken: string): Promise<SessionResponse> {
    return this.fetchWithTrace<SessionResponse>(
      '/api/v1/auth/session',
      'GET',
      undefined,
      { Authorization: `Bearer ${sessionToken}` }
    );
  }

  async getSmsStatus(correlationId: string): Promise<SmsJobStatusResponse> {
    return this.fetchWithTrace<SmsJobStatusResponse>(
      `/api/v1/sms/status?correlationId=${encodeURIComponent(correlationId)}`,
      'GET'
    );
  }
}

export const api = new ApiService();
