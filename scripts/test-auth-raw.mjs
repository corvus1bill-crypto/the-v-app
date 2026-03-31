const projectId = "drmzzuuzftrtstmefnze";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybXp6dXV6ZnRydHN0bWVmbnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzcwMjMsImV4cCI6MjA4NjE1MzAyM30.vh8UVIZGqXcRcL-k4bxxcZEsufj-ltruV2NdYqVvuG4";

const authUrl = `https://${projectId}.supabase.co/auth/v1/token`;
const demoEmail = 'demo@vibe.app';
const demoPassword = 'demo123456';

console.log('POSTing to', authUrl);
try {
  const resp = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      'apikey': `${publicAnonKey}`,
    },
    body: JSON.stringify({ grant_type: 'password', email: demoEmail, password: demoPassword }),
  });

  console.log('Status:', resp.status);
  console.log('Content-Type:', resp.headers.get('content-type'));
  const txt = await resp.text();
  console.log('Body (truncated):', txt.slice(0, 2000));
} catch (err) {
  console.error('Request failed:', err);
}
