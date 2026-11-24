export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

const ACCESS_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "auth_user";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setAccessToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Token refresh ──────────────────────────────────────────────────────────
// A single in-flight refresh is shared by every request that 401s at the same
// time, so an expired access token triggers exactly one /auth/refresh call.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) return null;
        const data = await res.json().catch(() => null);
        if (data?.access_token) {
          setAccessToken(data.access_token);
          return data.access_token as string;
        }
        return null;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

// ── Session-expired handling ────────────────────────────────────────────────
let isRedirectingToLogin = false;

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  // Don't loop if we're already on an auth page.
  if (/\/login$/.test(path) || path === "/reset-password-required") return;
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  const loginPath = path.startsWith("/admin")
    ? "/admin/login"
    : path.startsWith("/company")
      ? "/company/login"
      : "/student/login";
  window.location.href = loginPath;
}

function handleSessionExpired() {
  clearSession();
  redirectToLogin();
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "omit",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "API Request Failed");
  }

  return response.json();
}

export async function fetchApiWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const doFetch = (token: string | null) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as any) || {}),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers, credentials: "include" });
  };

  let response = await doFetch(getAccessToken());

  // 401 = missing/expired access token. Try a one-time refresh, then retry the
  // original request. Only give up (and bounce to login) if that also fails.
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doFetch(newToken);
    }
    if (response.status === 401) {
      handleSessionExpired();
      throw new Error("Your session has expired. Please sign in again.");
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "API Request Failed");
  }

  return response.json();
}
