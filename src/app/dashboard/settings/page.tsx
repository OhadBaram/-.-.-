import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import SettingsForm from './SettingsForm';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen p-8 text-center bg-gray-50 flex items-center justify-center">
        <h1 className="text-2xl font-bold">אנא התחבר כדי לצפות בהגדרות</h1>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { workspaces: { include: { workspace: true } } }
  });

  const workspace = user?.workspaces[0]?.workspace;

  if (!workspace) {
    return (
      <div className="min-h-screen p-8 text-center bg-gray-50 flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">לא נמצא מרחב עבודה</h1>
        <Link href="/dashboard" className="text-indigo-600 underline">חזרה ללוח הבקרה</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50" dir="rtl">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">הגדרות מרחב עבודה - {workspace.name}</h1>
        <Link href="/dashboard" className="text-indigo-600 underline">
          חזרה ללוח הבקרה
        </Link>
      </header>

      <section className="max-w-xl bg-white p-6 rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-4">ספריית מותג</h2>
        <p className="text-gray-600 mb-6">
          הגדר את ערכי המותג שלך כאן כדי שהקרוסלות שיווצרו יתאימו באופן אוטומטי לשפה העיצובית שלך.
        </p>

        <SettingsForm 
          workspaceId={workspace.id} 
          initialBrandIdentity={workspace.brandIdentity || ''} 
          initialBrandColor={workspace.brandColor || '#3730a3'} 
          initialAiProvider={workspace.aiProvider || 'gemini'}
          initialAiModel={workspace.aiModel || 'gemini-1.5-flash'}
        />
      </section>
    </main>
  );
}
