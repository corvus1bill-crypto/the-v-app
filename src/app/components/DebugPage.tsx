export function DebugPage() {
  const apiUrl = import.meta.env.VITE_API_URL || 'NOT SET';
  const supabaseId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'NOT SET';
  
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-black">🔧 Debug Information</h1>
        
        <div className="space-y-4 border-2 border-foreground p-6 bg-card">
          <div>
            <h2 className="font-black text-lg mb-2">Backend API URL</h2>
            <div className="bg-background p-3 border-2 border-foreground font-mono break-all">
              {apiUrl}
            </div>
            <p className="text-sm mt-2">
              {apiUrl === 'NOT SET' ? (
                <span className="text-red-500">❌ VITE_API_URL is not configured in Vercel environment variables</span>
              ) : (
                <span className="text-green-500">✅ API URL is configured</span>
              )}
            </p>
          </div>

          <div>
            <h2 className="font-black text-lg mb-2">Supabase Project ID</h2>
            <div className="bg-background p-3 border-2 border-foreground font-mono break-all">
              {supabaseId}
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-100 border-2 border-yellow-600">
            <h3 className="font-black text-yellow-900 mb-2">⚠️ To Fix Login Issues:</h3>
            <ol className="list-decimal list-inside space-y-2 text-yellow-900 text-sm">
              <li>Go to: <a href="https://vercel.com/dashboard" target="_blank" className="underline">https://vercel.com/dashboard</a></li>
              <li>Click on "the-v-app" project</li>
              <li>Go to Settings → Environment Variables</li>
              <li>Add:
                <div className="bg-white p-2 mt-1 border border-yellow-600 rounded font-mono text-xs">
                  Name: VITE_API_URL<br/>
                  Value: https://the-v-app-production.up.railway.app
                </div>
              </li>
              <li>Save and go to Deployments</li>
              <li>Click the latest deployment → Redeploy</li>
              <li>After redeploy completes, refresh this page</li>
            </ol>
          </div>
        </div>

        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-foreground text-background font-black border-2 border-foreground hover:bg-background hover:text-foreground transition-all"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
