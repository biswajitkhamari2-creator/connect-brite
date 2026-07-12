// PHP backend client — all endpoints map to http://localhost:8000
// Routes match exactly what the PHP backend exposes.

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.hostname) {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.");
    if (!isLocal) {
      return window.location.origin;
    }
    return `http://${host}:8000`;
  }
  return "http://localhost:8000";
};
const BASE = getApiBaseUrl();
const TOKEN_KEY = "cfs_token";

export type AuthUser = {
  id: string | number;
  uuid?: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role?: string;
  is_active?: number | boolean;
  email_verified?: number | boolean;
};

export function getToken(): string | null {
  return typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(t: string | null): void {
  if (typeof localStorage === "undefined") return;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const t = getToken();
  if (t) headers.set("Authorization", `Bearer ${t}`);

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch (e) {
    throw new Error(
      `Cannot reach backend at ${BASE}. Make sure the PHP server is running. Error: ${(e as Error).message}`,
    );
  }
  const text = await res.text();
  let data: any = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { error: text }; }
  }
  if (!res.ok || (data && data.success === false) || (data && data.error)) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    const err = new Error(msg) as Error & { status?: number; data?: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export const api = {
  getToken,
  setToken,
  isLoggedIn,

  auth: {
    /** POST /api/auth/register */
    signup: (b: { email: string; password: string; full_name: string; phone: string }) =>
      request<{ status: string; message: string; data: { token: string; user: AuthUser } }>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify(b) },
      ),

    /** POST /api/auth/login → stores token automatically */
    login: (email: string, password: string) =>
      request<{ status: string; message: string; data: { token: string; user: AuthUser } }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }).then((r: any) => {
        const token = r?.data?.token ?? r?.token;
        const user = r?.data?.user ?? r?.user;
        if (token) {
          setToken(token);
          localStorage.setItem("cfs_user", JSON.stringify(user));
        }
        return r;
      }),

    /** POST /api/auth/logout */
    logout: async () => {
      try {
        await request("/api/auth/logout", { method: "POST" });
      } catch { /* token may be invalid; clear locally */ }
      finally {
        setToken(null);
        localStorage.removeItem("cfs_user");
      }
    },

    /** GET /api/auth/me */
    me: () =>
      request<{ status: string; data: { user: AuthUser } }>("/api/auth/me"),

    /** POST /api/auth/forgot-password */
    forgot: (email: string) =>
      request<{ status: string; message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    /** POST /api/auth/reset-password */
    reset: (resetToken: string, password: string) =>
      request<{ status: string; message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: resetToken, password }),
      }),
  },

  claims: {
    /** GET /api/claims */
    list: () =>
      request<{ status: string; data: ClaimSummary[] }>("/api/claims"),

    /** POST /api/claims */
    create: (body: ClaimCreateInput) =>
      request<{ status: string; message: string; data: { id: number; claim_number: string } }>("/api/claims", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    /** GET /api/claims/{id} */
    get: (id: string | number) =>
      request<{ status: string; data: ClaimDetail }>(`/api/claims/${id}`),

    /** POST /api/claims/{id}/documents */
    upload: (claimId: string | number, file: File, docType: "policy" | "hospital" | "other") => {
      const fd = new FormData();
      fd.append("doc_type", docType);
      fd.append("file", file);
      return request<{ status: string; data: { id: number } }>(`/api/claims/${claimId}/documents`, {
        method: "POST",
        body: fd,
      });
    },

    /** GET /api/claims/{id}/documents */
    documents: (claimId: string | number) =>
      request<{ status: string; data: ClaimDocument[] }>(`/api/claims/${claimId}/documents`),
  },

  admin: {
    /** GET /api/admin/dashboard */
    dashboard: () =>
      request<{ status: string; data: AdminDashboard }>("/api/admin/dashboard"),

    /** GET /api/admin/users */
    users: (page = 1, search?: string) =>
      request<{ status: string; data: AuthUser[] }>(
        `/api/admin/users?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
      ),

    /** GET /api/admin/claims */
    claims: (page = 1, status?: string) =>
      request<{ status: string; data: ClaimDetail[] }>(
        `/api/admin/claims?page=${page}${status ? `&status=${encodeURIComponent(status)}` : ""}`,
      ),
  },

  ollama: {
    /** POST /api/chat - Non-streaming chat endpoint */
    chat: (messages: { role: string; content: string }[], model?: string) =>
      request<any>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages, model, stream: false }),
      }),

    /** POST /api/chat - Streaming chat helper */
    chatStream: async (
      messages: { role: string; content: string }[],
      onChunk: (text: string) => void,
      model?: string
    ): Promise<void> => {
      const headers = new Headers();
      headers.set("Content-Type", "application/json");
      const t = getToken();
      if (t) headers.set("Authorization", `Bearer ${t}`);

      const res = await fetch(`${BASE}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages, model, stream: true }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            const chunkText = parsed?.message?.content || "";
            if (chunkText) {
              onChunk(chunkText);
            }
          } catch (e) {
            // Ignored, might be incomplete JSON
          }
        }
      }
    },
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClaimSummary = {
  id: number;
  claim_number: string;
  title: string;
  category: string;
  insurer_name: string | null;
  policy_number: string | null;
  claim_amount: number | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
};

export type ClaimDocument = {
  id: number;
  original_name: string;
  stored_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
};

export type ClaimDetail = ClaimSummary & {
  description: string;
  user_id: number;
  documents?: ClaimDocument[];
};

export type ClaimCreateInput = {
  title: string;
  description: string;
  category: string;
  insurer_name?: string;
  policy_number?: string;
  claim_amount?: number;
};

export type AdminDashboard = {
  total_users: number;
  total_claims: number;
  open_claims: number;
  resolved_claims: number;
  claims_by_status: { status: string; total: number }[];
};