/** Self-hosted API (Express + Prisma). When unset, the app uses Supabase + legacy Edge Function. */
export function isRestApi(): boolean {
  // Only use REST API if explicitly configured - don't auto-use Railway in production
  let u = import.meta.env.VITE_API_URL;
  
  const result = typeof u === 'string' && u.trim().length > 0;
  if (result) {
    console.log('✅ Using REST API mode');
  } else {
    console.log('🔐 Using Supabase authentication');
  }
  return result;
}

export function restApiBase(): string {
  // During local development we proxy API requests through the Vite dev server
  // (see vite.config.ts) so return an empty base which allows using
  // absolute paths like `/api/v1/...` that will be proxied. In production
  // return the configured backend URL.
  if (import.meta.env.DEV) {
    console.log('✅ Using REST API in DEV via Vite proxy (relative /api paths)');
    return '';
  }

  // Try environment variable first, then fallback to production URL
  let u = import.meta.env.VITE_API_URL;

  // If not set and in production, use the Railway backend
  if (!u && import.meta.env.PROD) {
    u = 'https://the-v-app-production.up.railway.app';
  }

  if (!u?.trim()) throw new Error('VITE_API_URL is not configured. Must be set to backend URL like https://the-v-app-production.up.railway.app');
  console.log('✅ Using REST API at:', u.replace(/\/$/, ''));
  return u.replace(/\/$/, '');
}
