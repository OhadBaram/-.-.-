import { describe, expect, it } from 'vitest';
import {
  enforceRateLimit,
  rateLimitSubjectFromRequest,
} from '@/lib/api/rate-limit';

describe('rate-limit', () => {
  it('builds subject from email preferentially', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    expect(rateLimitSubjectFromRequest('User@Example.com', req)).toBe(
      'user@example.com'
    );
    expect(rateLimitSubjectFromRequest(undefined, req)).toBe('1.2.3.4');
  });

  it('allows requests under the memory limit and blocks when exceeded', async () => {
    const subject = `test-${Date.now()}-${Math.random()}`;
    const results: Array<Response | null> = [];
    for (let i = 0; i < 12; i += 1) {
      results.push(
        await enforceRateLimit({ bucket: 'generate', subject })
      );
    }
    const blocked = results.filter((r) => r && r.status === 429);
    const allowed = results.filter((r) => r === null);
    expect(allowed.length).toBe(10);
    expect(blocked.length).toBe(2);
  });
});
