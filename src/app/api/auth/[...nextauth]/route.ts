import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

const authHandler = NextAuth(authOptions);

/**
 * עטיפה שמונעת 500 עם גוף ריק כששליחת מייל / SMTP נכשלת בצורה לא צפויה.
 * NextAuth אמור להחזיר EmailSignin — אם משהו בורח, מפנים לדף השגיאה.
 */
async function handler(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    return await (
      authHandler as (
        req: Request,
        ctx: { params: Promise<{ nextauth: string[] }> }
      ) => Promise<Response>
    )(req, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    console.error('[auth] NextAuth handler crashed', { message: message.slice(0, 200) });

    const url = new URL(req.url);
    const isEmailSignIn =
      req.method === 'POST' &&
      (url.pathname.endsWith('/signin/email') || url.pathname.includes('/signin/email'));

    if (isEmailSignIn) {
      const origin = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || url.origin;
      return Response.redirect(`${origin}/auth/signin?error=EmailSignin`, 302);
    }

    return new Response(JSON.stringify({ error: 'AuthError' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export { handler as GET, handler as POST };
