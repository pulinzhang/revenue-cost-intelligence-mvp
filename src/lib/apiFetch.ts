export type ApiErrorIssue = {
  path: (string | number)[];
  message: string;
  code?: string;
};

export type ApiErrorDetails = {
  issues?: ApiErrorIssue[];
  [k: string]: unknown;
};

export type ApiErrorPayload = {
  error: string;
  code?: string;
  details?: ApiErrorDetails;
};

export class ApiFetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: ApiErrorDetails,
  ) {
    super(message);
    this.name = "ApiFetchError";
  }
}

async function tryReadJson(res: Response): Promise<unknown | undefined> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return undefined;
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (res.ok) return (await res.json()) as T;

  const json = (await tryReadJson(res)) as Partial<ApiErrorPayload> | undefined;
  const message = json?.error || res.statusText || "Request failed";
  throw new ApiFetchError(message, res.status, json?.code, json?.details);
}

/**
 * Convert backend Zod issues into a simple { "field.path": ["msg1", ...] } map.
 * e.g. ["email"] => { "email": ["Invalid email"] }
 */
export function issuesToFieldErrors(details?: ApiErrorDetails): Record<string, string[]> {
  const issues = details?.issues;
  if (!Array.isArray(issues)) return {};
  const out: Record<string, string[]> = {};
  for (const i of issues) {
    const key = Array.isArray(i?.path) && i.path.length ? i.path.join(".") : "_";
    const msg = typeof i?.message === "string" && i.message ? i.message : "Invalid value";
    (out[key] ||= []).push(msg);
  }
  return out;
}
