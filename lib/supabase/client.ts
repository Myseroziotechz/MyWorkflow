/**
 * Browser-safe Supabase REST client using the anon (public) key.
 * Subject to Row Level Security policies.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface SupabaseClientRequestOptions {
  method?: HttpMethod;
  table: string;
  query?: string;
  body?: unknown;
  /** JWT access token from better-auth session */
  accessToken?: string;
}

export async function supabaseClient<T = unknown>(
  options: SupabaseClientRequestOptions
): Promise<T> {
  const { method = "GET", table, query = "", body, accessToken } = options;

  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken ?? ANON_KEY}`,
      Prefer: "return=representation",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Supabase REST error [${res.status}]: ${error}`);
  }

  if (res.status === 204) return [] as T;
  return res.json() as Promise<T>;
}
