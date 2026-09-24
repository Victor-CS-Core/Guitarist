export interface Identity {
  role: "teacher" | "student";
  username: string;
  displayName: string;
  studentId?: string;
}

export interface StudentAccount {
  studentId: string;
  username: string;
  disabled: boolean;
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<{ status: number; data: T }> {
  const response = await fetch(path, {
    credentials: "same-origin", cache: "no-store", ...options,
    headers: { ...(options?.body ? { "Content-Type": "application/json" } : {}), ...options?.headers },
  });
  let data: T;
  try { data = await response.json() as T; }
  catch { throw new Error("Guitarist is temporarily unavailable. Please try again."); }
  return { status: response.status, data };
}
