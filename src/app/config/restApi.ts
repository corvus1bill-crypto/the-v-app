/** Self-hosted API (Express + Prisma). When unset, the app uses Supabase + legacy Edge Function. */
export function isRestApi(): boolean {
  const u = import.meta.env.VITE_API_URL;
  const result = typeof u === 'string' && u.trim().length > 0;
  if (!result) {
    console.warn('⚠️ VITE_API_URL not configured - falling back to Supabase. Set it to: https://the-v-app-production.up.railway.app');
  }
  return result;
}

export function restApiBase(): string {
  const u = import.meta.env.VITE_API_URL;
  if (!u?.trim()) throw new Error('VITE_API_URL is not configured. Must be set to backend URL like https://the-v-app-production.up.railway.app');
  console.log('✅ Using REST API at:', u.replace(/\/$/, ''));
  return u.replace(/\/$/, '');
}
