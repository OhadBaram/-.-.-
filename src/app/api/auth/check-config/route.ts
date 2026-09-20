import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * Public auth config probe for production debugging.
 * Returns only booleans — never secret values.
 */
export async function GET() {
  const hasEmailFrom = Boolean(process.env.EMAIL_FROM?.trim());
  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
  const hasEmailServer = Boolean(process.env.EMAIL_SERVER?.trim());
  const hasSmtpParts = Boolean(
    process.env.EMAIL_SERVER_HOST?.trim() &&
      process.env.EMAIL_SERVER_USER?.trim() &&
      process.env.EMAIL_SERVER_PASSWORD?.trim()
  );
  const hasSecret = Boolean(process.env.NEXTAUTH_SECRET?.trim());
  const hasNextAuthUrl = Boolean(process.env.NEXTAUTH_URL?.trim());
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

  let databaseOk = false;
  let databaseError: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseOk = true;
  } catch (error) {
    databaseError = error instanceof Error ? error.message : 'database_unreachable';
  }

  const emailTransportConfigured = hasResend || hasEmailServer || hasSmtpParts;
  const ready = hasEmailFrom && emailTransportConfigured && hasSecret && hasNextAuthUrl && databaseOk;

  return NextResponse.json({
    ready,
    checks: {
      EMAIL_FROM: hasEmailFrom,
      RESEND_API_KEY: hasResend,
      EMAIL_SERVER: hasEmailServer,
      EMAIL_SERVER_HOST_USER_PASS: hasSmtpParts,
      NEXTAUTH_SECRET: hasSecret,
      NEXTAUTH_URL: hasNextAuthUrl,
      NEXTAUTH_URL_VALUE: process.env.NEXTAUTH_URL?.trim() || null,
      DATABASE_URL: hasDatabaseUrl,
      databaseOk,
      databaseError,
    },
    hint: ready
      ? 'Auth email config looks complete.'
      : 'Missing email and/or database config in Vercel Production env. Set EMAIL_FROM + RESEND_API_KEY (recommended), NEXTAUTH_SECRET, NEXTAUTH_URL, DATABASE_URL, then Redeploy.',
  });
}
