import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/api/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { 
      workspaces: { 
        include: { workspace: true }
      }
    }
  });

  if (!user || user.workspaces.length === 0) {
    redirect('/');
  }

  // For simplicity, using the first workspace. 
  // In a full multi-tenant app, the workspaceId would be in the URL.
  const workspace = user.workspaces[0].workspace;

  let planName = 'חינמי';
  let usageLimit = 2;
  
  if (workspace.plan === 'pro') {
    planName = 'פרו';
    usageLimit = 25;
  } else if (workspace.plan === 'premium') {
    planName = 'פרימיום';
    usageLimit = 60;
  }

  const usagePercent = Math.min(Math.round((workspace.usageCount / usageLimit) * 100), 100);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ניהול מנוי וחיובים</h1>
          <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
            &larr; חזור ללוח הבקרה
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">התכנית הנוכחית שלך: <span className="text-indigo-600 dark:text-indigo-400">{planName}</span></h2>
            
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-gray-700 dark:text-gray-200 font-medium">ניצול מכסת קרוסלות חודשית</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {workspace.plan === 'agency' ? 'ללא הגבלה' : `${workspace.usageCount} מתוך ${usageLimit} נוצלו`}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full ${usagePercent > 90 ? 'bg-red-500' : 'bg-indigo-600'}`}
                  style={{ width: `${usagePercent}%` }}
                ></div>
              </div>
              {usagePercent >= 100 && workspace.plan !== 'agency' && (
                <p className="mt-2 text-sm text-red-600 font-medium">הגעת למגבלת היצירה החודשית שלך. שדרג את המנוי כדי להמשיך ליצור.</p>
              )}
            </div>

            <div className="border-t pt-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">שדרוג וניהול תשלומים</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                התשלומים מתבצעים בצורה מאובטחת באמצעות מערכת סליקה. לשינוי אמצעי תשלום, שדרוג מסלול או הורדת חשבוניות, היכנס לאזור האישי.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-indigo-600 text-white px-6 py-2 rounded font-bold hover:bg-indigo-700 transition-colors">
                  שדרג מסלול
                </button>
                <button className="bg-white dark:bg-gray-800 border dark:border-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded font-medium hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                  עדכון אמצעי תשלום
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
