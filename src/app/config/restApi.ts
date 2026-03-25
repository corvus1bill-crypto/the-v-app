/** Self-hosted API (Express + Prisma). When unset, the app uses Supabase + legacy Edge Function. */
export function isRestApi(): boolean {
  const u = import.meta.env.VITE_API_URL;
  return typeof u === 'string' && u.trim().length > 0;
}

export function restApiBase(): string {
  const u = import.meta.env.VITE_API_URL;
  if (!u?.trim()) throw new Error('VITE_API_URL is not configured');
  return u.replace(/\/$/, '');
}
