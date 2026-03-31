import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// If VITE_API_URL is set, the app is running in REST API mode.
// In that case we must avoid Supabase auth auto-refresh/persist which
// triggers background requests (causing CORS/timeouts). Disable those options
// so the Supabase client remains available for non-auth operations but
// does not attempt token refreshes.
const usingRestApi = typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL.trim().length > 0;

export const supabase = createClient(supabaseUrl, publicAnonKey, {
	auth: {
		autoRefreshToken: !usingRestApi,
		persistSession: !usingRestApi,
		detectSessionInUrl: false,
	},
});

export { projectId, publicAnonKey };
