import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

type DatabaseUrlIssue =
  | 'missing'
  | 'prisma_accelerate'
  | 'mysql'
  | 'missing_protocol'
  | 'invalid_protocol';

function diagnoseDatabaseUrl(raw: string | undefined): {
  present: boolean;
  protocolOk: boolean;
  issue: DatabaseUrlIssue | null;
} {
  const value = raw?.trim() ?? '';
  if (!value) {
    return { present: false, protocolOk: false, issue: 'missing' };
  }

  const lower = value.toLowerCase();

  if (lower.startsWith('postgresql://') || lower.startsWith('postgres://')) {
    return { present: true, protocolOk: true, issue: null };
  }

  if (lower.startsWith('prisma://') || lower.startsWith('prisma+postgres://')) {
    return { present: true, protocolOk: false, issue: 'prisma_accelerate' };
  }

  if (lower.startsWith('mysql://') || lower.startsWith('mysql2://')) {
    return { present: true, protocolOk: false, issue: 'mysql' };
  }

  if (!lower.includes('://')) {
    return { present: true, protocolOk: false, issue: 'missing_protocol' };
  }

  return { present: true, protocolOk: false, issue: 'invalid_protocol' };
}

function databaseUrlHint(issue: DatabaseUrlIssue | null): string | null {
  if (!issue) return null;

  const en =
    'DATABASE_URL must start with postgresql:// or postgres:// (Neon / Supabase / Vercel Postgres pooled URL is fine). Do not use prisma:// or prisma+postgres:// unless Prisma Accelerate is configured separately. Fix in Vercel Production env, then Redeploy, then re-check until databaseOk:true.';

  const heByIssue: Record<DatabaseUrlIssue, string> = {
    missing:
      'חסר\nDATABASE_URL\nבסביבת\nVercel.\nהגדירו כתובת שמתחילה ב־\npostgresql://\nאו\npostgres://\nואז\nRedeploy.',
    prisma_accelerate:
      'זוהה קידומת של\nPrisma Accelerate\n(prisma://).\nלאפליקציה הזו יש להשתמש ב־\npostgresql://\nאו\npostgres://\nרגיל (לא\nprisma://).\nתקנו ב־\nVercel\nואז\nRedeploy.',
    mysql:
      'זוהתה קידומת\nmysql://.\nנדרש\nPostgreSQL\nעם\npostgresql://\nאו\npostgres://.\nתקנו ב־\nVercel\nואז\nRedeploy.',
    missing_protocol:
      'ל־\nDATABASE_URL\nחסר פרוטוקול.\nחייבים להתחיל ב־\npostgresql://\nאו\npostgres://.\nתקנו ב־\nVercel\nואז\nRedeploy.',
    invalid_protocol:
      'פרוטוקול\nDATABASE_URL\nלא תקין עבור\nPrisma.\nחייבים להתחיל ב־\npostgresql://\nאו\npostgres://.\nתקנו ב־\nVercel\nואז\nRedeploy.',
  };

  return `${heByIssue[issue]}\n\n${en}`;
}

/**
 * Public auth config probe for production debugging.
 * Returns only booleans and safe diagnostics — never secret values.
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

  const dbUrlDiag = diagnoseDatabaseUrl(process.env.DATABASE_URL);
  const hasDatabaseUrl = dbUrlDiag.present;

  let databaseOk = false;
  let databaseError: string | null = null;

  if (dbUrlDiag.protocolOk) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseOk = true;
    } catch (error) {
      databaseError = error instanceof Error ? error.message : 'database_unreachable';
    }
  } else if (dbUrlDiag.issue === 'missing') {
    databaseError = 'DATABASE_URL is missing';
  } else {
    databaseError =
      'the URL must start with the protocol postgresql:// or postgres://';
  }

  const emailTransportConfigured = hasResend || hasEmailServer || hasSmtpParts;
  const ready = hasEmailFrom && emailTransportConfigured && hasSecret && hasNextAuthUrl && databaseOk;

  // בדיקת נוכחות בלבד — לא מתחברים ל-SMTP / Gmail כאן
  const emailServerLooksLikeUrl = Boolean(
    process.env.EMAIL_SERVER?.trim() && /^smtps?:\/\//i.test(process.env.EMAIL_SERVER.trim())
  );

  const protocolHint = databaseUrlHint(dbUrlDiag.issue);
  const hint = ready
    ? hasResend
      ? 'Auth email config looks complete (Resend).'
      : 'Env present, but SMTP connectivity is NOT tested here. If /api/auth/signin/email returns 500, fix Gmail App Password (prefer EMAIL_SERVER_HOST/USER/PASSWORD) and check Vercel function logs for [auth] SMTP sendMail failed.'
    : protocolHint ??
      'Missing email and/or database config in Vercel Production env. Set EMAIL_FROM + RESEND_API_KEY (recommended), NEXTAUTH_SECRET, NEXTAUTH_URL, DATABASE_URL, then Redeploy.';

  return NextResponse.json({
    ready,
    checks: {
      EMAIL_FROM: hasEmailFrom,
      RESEND_API_KEY: hasResend,
      EMAIL_SERVER: hasEmailServer,
      EMAIL_SERVER_LOOKS_LIKE_URL: hasEmailServer ? emailServerLooksLikeUrl : null,
      EMAIL_SERVER_HOST_USER_PASS: hasSmtpParts,
      smtpConnectivityChecked: false,
      NEXTAUTH_SECRET: hasSecret,
      NEXTAUTH_URL: hasNextAuthUrl,
      NEXTAUTH_URL_VALUE: process.env.NEXTAUTH_URL?.trim() || null,
      DATABASE_URL: hasDatabaseUrl,
      databaseUrlProtocolOk: dbUrlDiag.protocolOk,
      databaseUrlIssue: dbUrlDiag.issue,
      databaseOk,
      databaseError,
    },
    hint,
  });
}
