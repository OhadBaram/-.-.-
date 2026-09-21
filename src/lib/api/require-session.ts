import { getServerSession, type Session } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export type SessionUser = NonNullable<Session['user']> & {
  email: string;
};

export type RequireSessionResult =
  | { ok: true; session: Session; user: SessionUser }
  | { ok: false; response: NextResponse };

/**
 * דורש session מאומת עם אימייל — מקור אמת יחיד לנתיבי AI יקרים.
 * תמיד מעביר `authOptions` (מתקן קריאות חסרות ב־copilot/transcribe).
 */
export async function requireSession(): Promise<RequireSessionResult> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!session?.user || !email) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return {
    ok: true,
    session,
    user: { ...session.user, email },
  };
}
