import { createClient } from '@supabase/supabase-js';

const projectId = "drmzzuuzftrtstmefnze";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybXp6dXV6ZnRydHN0bWVmbnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzcwMjMsImV4cCI6MjA4NjE1MzAyM30.vh8UVIZGqXcRcL-k4bxxcZEsufj-ltruV2NdYqVvuG4";

const funcUrl = `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/demo-login`;

console.log('Calling demo function:', funcUrl);

try {
  const resp = await fetch(funcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
  });

  console.log('HTTP status:', resp.status);
  const bodyText = await resp.text();
  console.log('Response body (truncated):', bodyText.slice(0, 2000));

  if (!resp.ok) process.exitCode = 2;

  let parsed;
  try {
    parsed = JSON.parse(bodyText);
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    process.exitCode = 3;
  }

  if (parsed?.email && parsed?.password) {
    console.log('Got demo credentials:', parsed.email, parsed.password);
    const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
    const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.email, password: parsed.password });
    console.log('signIn error:', error);
    console.log('signIn data:', JSON.stringify(data, null, 2));
    if (error) process.exitCode = 4;
  } else {
    console.error('No credentials returned from demo function');
    process.exitCode = 5;
  }
} catch (err) {
  console.error('Request failed:', err);
  process.exitCode = 6;
}
