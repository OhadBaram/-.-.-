'use client';

import { FormEvent, useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const ERROR_MESSAGES: Record<string, string> = {
  EmailSignin: 'שליחת המייל נכשלה. בדקו ב-Vercel את RESEND_API_KEY או EMAIL_SERVER, וגם EMAIL_FROM.',
  Configuration: 'הגדרות האימות בשרת לא הושלמו. בדקו NEXTAUTH_SECRET, DATABASE_URL ומשתני המייל.',
};

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const errorCode = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    errorCode ? ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.Default : ''
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('email', {
      email: email.trim(),
      callbackUrl,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(ERROR_MESSAGES[result.error] || ERROR_MESSAGES.Default);
      return;
    }

    window.location.href = `/auth/verify-request?email=${encodeURIComponent(email.trim())}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 font-sans transition-colors" dir="rtl">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 text-center">
          התחברות
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
          הזינו אימייל ונשלח אליכם קישור קסם להתחברות — בלי סיסמה.
        </p>

        {error ? (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200" htmlFor="email">
            אימייל
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            dir="ltr"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl transition"
          >
            {loading ? 'שולח...' : 'שלחו לי קישור התחברות'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            חזרה לדף הבית
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl" />}>
      <SignInForm />
    </Suspense>
  );
}
