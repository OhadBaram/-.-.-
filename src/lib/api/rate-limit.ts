import { NextResponse } from 'next/server';

export type RateLimitBucket =
  | 'generate'
  | 'wizard'
  | 'remix'
  | 'copilot'
  | 'transcribe'
  | 'suggest'
  | 'analyze';

interface BucketConfig {
  /** מקסימום בקשות בחלון */
  limit: number;
  /** אורך חלון במילישניות */
  windowMs: number;
}

const BUCKET_CONFIG: Record<RateLimitBucket, BucketConfig> = {
  generate: { limit: 10, windowMs: 60_000 },
  wizard: { limit: 30, windowMs: 60_000 },
  remix: { limit: 20, windowMs: 60_000 },
  copilot: { limit: 30, windowMs: 60_000 },
  transcribe: { limit: 15, windowMs: 60_000 },
  suggest: { limit: 20, windowMs: 60_000 },
  analyze: { limit: 10, windowMs: 60_000 },
};

interface MemoryEntry {
  count: number;
  resetAt: number;
}

/** מאגר זיכרון לתהליך אחד (serverless instance) — גיבוי כשאין Upstash */
const memoryStore = new Map<string, MemoryEntry>();

function memoryConsume(key: string, config: BucketConfig): {
  success: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { success: true, remaining: config.limit - 1, resetAt };
  }

  if (existing.count >= config.limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  memoryStore.set(key, existing);
  return {
    success: true,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * אוכף מגבלת קצב לפי משתמש (או IP כגיבוי).
 * משתמש ב־Upstash כשמוגדר; אחרת במאגר זיכרון מקומי.
 */
export async function enforceRateLimit(options: {
  bucket: RateLimitBucket;
  subject: string;
}): Promise<NextResponse | null> {
  const config = BUCKET_CONFIG[options.bucket];
  const key = `rl:${options.bucket}:${options.subject}`;

  if (upstashConfigured()) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit');
      const { Redis } = await import('@upstash/redis');
      const redis = Redis.fromEnv();
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          config.limit,
          `${Math.ceil(config.windowMs / 1000)} s`
        ),
        prefix: 'caruselai',
      });
      const result = await limiter.limit(key);
      if (!result.success) {
        return rateLimitResponse(result.reset);
      }
      return null;
    } catch (err) {
      console.error('[rate-limit] Upstash failed, falling back to memory', err);
    }
  }

  const result = memoryConsume(key, config);
  if (!result.success) {
    return rateLimitResponse(result.resetAt);
  }
  return null;
}

function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfterSec = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: 'יותר מדי בקשות. נסו שוב בעוד רגע.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
      },
    }
  );
}

/** מזהה נושא ל־rate limit: אימייל משתמש או כותרת IP */
export function rateLimitSubjectFromRequest(
  email: string | undefined,
  req: Request
): string {
  if (email) return email.toLowerCase();
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'anonymous';
  return 'anonymous';
}
