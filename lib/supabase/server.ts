import "server-only";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface SupabaseRequestOptions {
  method?: HttpMethod;
  table: string;
  query?: string;
  body?: unknown;
  /** Pass custom headers e.g. { Prefer: "return=representation" } */
  headers?: Record<string, string>;
}

/**
 * Server-side Supabase REST API client using the service role key.
 * Bypasses Row Level Security – use only in server actions / API routes.
 */
export async function supabaseServer<T = unknown>(
  options: SupabaseRequestOptions
): Promise<T> {
  const { method = "GET", table, query = "", body, headers = {} } = options;

  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: "return=representation",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Supabase REST error [${res.status}]: ${error}`);
  }

  // DELETE with no body returns 204
  if (res.status === 204) return [] as T;

  return res.json() as Promise<T>;
}

/**
 * Convenience helpers
 */
export const supabaseSelect = <T = unknown>(
  table: string,
  query = "select=*"
) => supabaseServer<T>({ table, query });

export const supabaseInsert = <T = unknown>(table: string, body: unknown) =>
  supabaseServer<T>({ method: "POST", table, body });

export const supabaseUpdate = <T = unknown>(
  table: string,
  query: string,
  body: unknown
) => supabaseServer<T>({ method: "PATCH", table, query, body });

export const supabaseDelete = <T = unknown>(table: string, query: string) =>
  supabaseServer<T>({ method: "DELETE", table, query });
