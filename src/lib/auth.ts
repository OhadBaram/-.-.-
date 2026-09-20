import { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';

function getEmailFrom() {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    throw new Error('EMAIL_FROM is missing. Set it in Vercel env (e.g. "קרוסל.איי.אי <noreply@yourdomain.com>").');
  }
  return from;
}

function smtpErrorSummary(error: unknown): { code: string; responseCode: number | null; message: string } {
  const err = error as {
    code?: string;
    responseCode?: number;
    message?: string;
  };
  const code = typeof err?.code === 'string' ? err.code : 'SMTP_ERROR';
  const responseCode = typeof err?.responseCode === 'number' ? err.responseCode : null;
  // הודעה קצרה בלי סיסמאות / כתובות חיבור
  const raw = typeof err?.message === 'string' ? err.message : 'SMTP send failed';
  const message = raw
    .replace(/pass(?:word)?[=:]\S+/gi, 'pass=***')
    .replace(/\/\/[^@\s]+@/g, '//***@')
    .slice(0, 180);
  return { code, responseCode, message };
}

function getSmtpTransport() {
  const server = process.env.EMAIL_SERVER?.trim();
  if (server) {
    // מחרוזת חיבור מלאה בלבד (smtp://...); אחרת ננסה את משתני הפיצול אם קיימים
    if (/^smtps?:\/\//i.test(server)) {
      try {
        return nodemailer.createTransport(server);
      } catch (error) {
        const summary = smtpErrorSummary(error);
        console.error('[auth] invalid EMAIL_SERVER URL', summary);
        throw new Error(
          `EMAIL_SERVER URL is invalid (${summary.code}). Prefer EMAIL_SERVER_HOST/USER/PASSWORD.`
        );
      }
    }
    console.error(
      '[auth] EMAIL_SERVER is set but is not a smtp:// URL; falling back to EMAIL_SERVER_HOST/USER/PASSWORD if present'
    );
  }

  const host = process.env.EMAIL_SERVER_HOST?.trim();
  const port = Number(process.env.EMAIL_SERVER_PORT || 587);
  const user = process.env.EMAIL_SERVER_USER?.trim();
  const pass = process.env.EMAIL_SERVER_PASSWORD?.trim();

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  if (server) {
    throw new Error(
      'EMAIL_SERVER must be a full SMTP URL (smtp://user:pass@host:587), or set EMAIL_SERVER_HOST/USER/PASSWORD.'
    );
  }

  return null;
}

async function sendVerificationRequest({
  identifier,
  url,
}: {
  identifier: string;
  url: string;
  provider: unknown;
}) {
  // Ensure verification token storage works before attempting to send mail.
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('[auth] database unreachable before email send', error);
    throw new Error('DATABASE_URL is missing or unreachable from Vercel.');
  }

  const from = getEmailFrom();
  const resendKey = process.env.RESEND_API_KEY?.trim();

  const subject = 'התחברות לקרוסל.איי.אי';
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>התחברות לקרוסל.איי.אי</h2>
      <p>לחצו על הכפתור כדי להתחבר (הקישור חד־פעמי ותקף לזמן מוגבל):</p>
      <p>
        <a href="${url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
          התחברות מאובטחת
        </a>
      </p>
      <p style="color:#666;font-size:12px;">אם לא ביקשתם להתחבר, אפשר להתעלם מהמייל.</p>
    </div>
  `;
  const text = `התחברות לקרוסל.איי.אי\n\n${url}\n`;

  try {
    if (resendKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: identifier,
          subject,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        console.error('[auth] Resend error', response.status, body);
        throw new Error(`Resend failed (${response.status}): ${body}`);
      }
      return;
    }

    const transport = getSmtpTransport();
    if (!transport) {
      console.error('[auth] No email transport configured');
      throw new Error(
        'Email is not configured. Set RESEND_API_KEY + EMAIL_FROM, or EMAIL_SERVER + EMAIL_FROM in Vercel.'
      );
    }

    try {
      await transport.sendMail({
        to: identifier,
        from,
        subject,
        text,
        html,
      });
    } catch (smtpError) {
      const summary = smtpErrorSummary(smtpError);
      console.error('[auth] SMTP sendMail failed', summary);
      // שגיאה נקייה — בלי אובייקט nodemailer ובלי סודות — כדי ש-NextAuth יחזיר EmailSignin ולא 500 ריק
      throw new Error(
        `SMTP send failed (${summary.code}${summary.responseCode ? `/${summary.responseCode}` : ''}). Check Gmail App Password / EMAIL_SERVER.`
      );
    }
  } catch (error) {
    const summary = smtpErrorSummary(error);
    console.error('[auth] sendVerificationRequest failed', summary);
    // תמיד לזרוק Error רגיל (לא אובייקט ספק) כדי למנוע 500 עם גוף ריק ב-App Router
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(summary.message || 'Email send failed');
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM,
      maxAge: 24 * 60 * 60,
      sendVerificationRequest,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
};
