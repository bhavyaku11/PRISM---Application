/**
 * Resolves the effective backend URL for server-side Next.js route handlers.
 * Supports FASTAPI_BACKEND_URL or BACKEND_URL, stripping any trailing slashes.
 */
export function getBackendUrl(): string {
  const url =
    process.env.FASTAPI_BACKEND_URL ||
    process.env.BACKEND_URL ||
    'http://127.0.0.1:8000';
  return url.replace(/\/+$/, '');
}
