/** Self-hosted API (Express + Prisma). When unset, the app uses Supabase + legacy Edge Function. */
export function isRestApi(): boolean {
  // Try environment variable first, then fallback to production URL
  let u = import.meta.env.VITE_API_URL;
  
  // If not set and in production, use the Railway backend
  if (!u && import.meta.env.PROD) {
    u = 'https://the-v-app-production.up.railway.app';
    console.log('📍 Production detected - using Railway backend automatically');
  }
  
  const result = typeof u === 'string' && u.trim().length > 0;
  if (!result) {
    console.warn('⚠️ VITE_API_URL not configured - falling back to Supabase. Set it to: https://the-v-app-production.up.railway.app');
  } else {
    console.log('✅ Using REST API mode');
  }
  return result;
}

export function restApiBase(): string {
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
