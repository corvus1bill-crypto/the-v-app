const url = 'http://localhost:5173/api/v1/auth/register';
const ts = Date.now();
const payload = {
  email: `cli-test-${ts}@example.com`,
  password: 'TestPass123!',
  username: `cliuser${ts}`,
};

console.log('POST', url, JSON.stringify(payload));

try {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
  if (!res.ok) process.exitCode = 2;
} catch (err) {
  console.error('Request failed:', err);
  process.exitCode = 3;
}
