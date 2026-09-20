import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function DashboardPage({ searchParams }: { searchParams?: { workspaceId?: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen p-8 text-center bg-gray-50 flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">אנא התחבר כדי לצפות בלוח הבקרה</h1>
        <Link href="/" className="text-indigo-600 underline">חזרה לדף הבית</Link>
      </div>
    );
  }

  const workspaceId = searchParams?.workspaceId;

  let user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return (
      <div className="min-h-screen p-8 text-center bg-gray-50 flex flex-col items-center justify-center gap-4">
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
        <div className="min-h-screen p-8 text-center bg-gray-50 flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">אין לך גישה למרחב עבודה זה</h1>
          <Link href="/dashboard" className="text-indigo-600 underline">חזרה ללוח הבקרה</Link>
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

  return (
    <main className="min-h-screen p-8 bg-gray-50" dir="rtl">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">לוח בקרה - {userWorkspace?.name}</h1>
        <div className="flex gap-4">
          <Link href="/dashboard/settings" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
            הגדרות מותג
          </Link>
          <Link href="/dashboard/create" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            צור קרוסלה חדשה +
          </Link>
        </div>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-4">היסטוריית קרוסלות</h2>
        {carousels.length === 0 ? (
          <div className="p-6 bg-white rounded shadow-sm text-gray-500">
            עדיין לא יצרת קרוסלות במרחב העבודה הזה.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {carousels.map((carousel) => (
              <div key={carousel.id} className="border p-4 rounded bg-white shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg">{carousel.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">נושא: {carousel.topic}</p>
                </div>
                <div className="text-xs text-gray-400 mt-4">
                  נוצר ב: {new Date(carousel.createdAt).toLocaleDateString('he-IL')}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
