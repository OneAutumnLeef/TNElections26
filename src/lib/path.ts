// Centralised basePath helper. In dev BASE_PATH is unset so this is a no-op.
// In production BASE_PATH=/tnelections26 (set in vercel.json) and api() prefixes
// every absolute path so SWR keys and fetch URLs hit the right deployment.

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix an absolute app path (e.g. "/api/results") with the basePath. */
export function api(path: string): string {
  if (!path.startsWith("/")) return path;
  return BASE + path;
}
