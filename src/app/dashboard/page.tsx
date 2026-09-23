import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import BrandLearnedSummary from '@/components/BrandLearnedSummary';
import { buildBrandLearnedFacts } from '@/lib/brand-learned-summary';

export default async function DashboardPage({ searchParams }: { searchParams?: { workspaceId?: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen p-8 text-center bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">אנא התחבר כדי לצפות בלוח הבקרה</h1>
        <Link href="/" className="text-indigo-600 dark:text-indigo-400 underline">חזרה לדף הבית</Link>
      </div>
    );
  }

  const workspaceId = searchParams?.workspaceId;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return (
      <div className="min-h-screen p-8 text-center bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">משתמש לא נמצא</h1>
      </div>
    );
  }

  let workspaceUser;

  if (workspaceId) {
    // Strictly enforce IDOR protection by ensuring the user is explicitly linked
    workspaceUser = await prisma.workspaceUser.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspaceId
        }
      },
      include: {
        workspace: {
          include: {
            carousels: { orderBy: { createdAt: 'desc' } }
          }
        }
      }
    });

    if (!workspaceUser) {
      return (
        <div className="min-h-screen p-8 text-center bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">אין לך גישה למרחב עבודה זה</h1>
          <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 underline">חזרה ללוח הבקרה</Link>
        </div>
      );
    }
  } else {
    // Default to the first workspace they are linked to
    workspaceUser = await prisma.workspaceUser.findFirst({
      where: { userId: user.id },
      include: {
        workspace: {
          include: {
            carousels: { orderBy: { createdAt: 'desc' } }
          }
        }
      }
    });
  }

  if (!workspaceUser) {
    const newWorkspace = await prisma.workspace.create({
      data: { name: 'המרחב שלי' }
    });
    workspaceUser = await prisma.workspaceUser.create({
      data: {
        userId: user.id,
        workspaceId: newWorkspace.id,
        role: 'owner'
      },
      include: {
        workspace: {
          include: { carousels: { orderBy: { createdAt: 'desc' } } }
        }
      }
    });
  }

  const userWorkspace = workspaceUser.workspace;
  const carousels = userWorkspace.carousels || [];

  const { getWorkspaceUsage } = await import('@/lib/usage');
  const usage = await getWorkspaceUsage(userWorkspace.id, user.id);
  const usagePercent = Math.min((usage.usageCount / usage.limit) * 100, 100);

  const learnedBrand = buildBrandLearnedFacts({
    brandIdentity: userWorkspace.brandIdentity,
    brandColor: userWorkspace.brandColor,
    websiteUrl: userWorkspace.websiteUrl,
    referenceLink1: userWorkspace.referenceLink1,
    referenceLink2: userWorkspace.referenceLink2,
    referenceLink3: userWorkspace.referenceLink3,
    pastCarousels: carousels,
  });

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">לוח בקרה - {userWorkspace?.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            חבילה: <strong>{usage.plan === 'freemium' ? 'חינמית' : usage.plan === 'pro' ? 'Pro' : 'Premium'}</strong>
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {user?.isAdmin && (
            <Link href="/admin" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-md hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-1.5 text-sm">
              <span>👑</span>
              <span>דאשבורד מנהל</span>
            </Link>
          )}
          <Link href="/dashboard/settings" className="px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:bg-gray-900 font-bold">
            הגדרות מותג
          </Link>
          {usage.canGenerate ? (
            <Link href="/dashboard/create" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 shadow-md">
              צור קרוסלה חדשה +
            </Link>
          ) : (
            <Link href="/dashboard/billing" className="px-4 py-2 bg-amber-500 text-white font-bold rounded hover:bg-amber-600 shadow-md">
              שדרג כדי ליצור
            </Link>
          )}
        </div>
      </header>

      <section className="mb-8 max-w-2xl">
        <BrandLearnedSummary facts={learnedBrand} variant="dashboard" />
      </section>

      {/* Usage Bar */}
      <section className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700 border-gray-100 dark:border-gray-700 flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">ניצול קרדיטים (חודשי)</h2>
            {usage.isWelcomeWeek && (
              <p className="text-sm text-green-600 font-bold mt-1">🎁 כולל 5 קרדיטים במתנה לשבוע הראשון!</p>
            )}
          </div>
          <div className="text-gray-600 dark:text-gray-300 font-medium">
            {usage.usageCount} / {usage.limit}
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 75 ? 'bg-amber-500' : 'bg-indigo-600'}`}
            style={{ width: `${usagePercent}%` }}
          ></div>
        </div>
        {!usage.canGenerate && (
          <div className="text-red-500 text-sm font-bold mt-2">
            הגעת למגבלת היצירה החודשית שלך. <Link href="/dashboard/billing" className="underline">לחץ כאן לשדרוג החבילה.</Link>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">היסטוריית קרוסלות</h2>
        {carousels.length === 0 ? (
          <div className="p-6 bg-white dark:bg-gray-800 rounded shadow-sm text-gray-500 dark:text-gray-400 text-center py-12">
            עדיין לא יצרת קרוסלות במרחב העבודה הזה. <br/><br/>
            <Link href="/dashboard/create" className="text-indigo-600 dark:text-indigo-400 font-bold underline">צור את הקרוסלה הראשונה שלך!</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {carousels.map((carousel) => (
              <div key={carousel.id} className="border dark:border-gray-700 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{carousel.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 mt-1 line-clamp-2">נושא: {carousel.topic}</p>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-4 flex justify-between items-center border-t pt-3">
                  <span>נוצר ב: {new Date(carousel.createdAt).toLocaleDateString('he-IL')}</span>
                  <span className="bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 px-2 py-1 rounded">מוכן</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
