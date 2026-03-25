import { describe, it, expect } from 'vitest';

describe('jwt', () => {
  it('signs and verifies payload', async () => {
    const { signToken, verifyToken } = await import('./jwt.js');
    const t = signToken({ sub: 'user-1', role: 'USER' });
    const p = verifyToken(t);
    expect(p.sub).toBe('user-1');
    expect(p.role).toBe('USER');
  });
});
