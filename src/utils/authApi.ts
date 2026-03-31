import type { UserRole } from "../types";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role?: UserRole | string;
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export async function fetchAuthUser() {
  const data = await requestJson<{ user: AuthUser | null }>("/api/auth/me", {
    method: "GET",
    headers: {},
  });
  return data.user;
}

export async function loginWithEmail(email: string) {
  const data = await requestJson<{ ok: boolean; user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return data.user;
}

export async function logoutUser() {
  await requestJson<{ ok: boolean }>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
