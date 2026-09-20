import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import CarouselCreator from '@/components/CarouselCreator';

export default async function CreateCarouselPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen p-8 text-center bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <h1 className="text-2xl font-bold">אנא התחבר</h1>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { workspaces: { include: { workspace: true } } }
  });

  const workspace = user?.workspaces[0]?.workspace;

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-indigo-50 dark:from-gray-900 via-white dark:via-gray-800 to-purple-50 dark:to-gray-900" dir="rtl">
      <header className="mb-10 text-center relative">
        <div className="absolute top-0 right-0">
          <Link href="/dashboard" className="text-sm underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
            חזרה ללוח הבקרה
          </Link>
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 dark:from-indigo-400 to-purple-600 dark:to-purple-400">יצירת קרוסלה חדשה</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl font-medium">הזן פרטים וקבל קרוסלה מוכנה תוך שניות</p>
      </header>
      
      <CarouselCreator 
        initialWebsiteUrl={workspace?.websiteUrl || ''}
        initialReferenceLink1={workspace?.referenceLink1 || ''}
        initialReferenceLink2={workspace?.referenceLink2 || ''}
        initialReferenceLink3={workspace?.referenceLink3 || ''}
        brandColor={workspace?.brandColor || '#6366f1'}
      />
    </main>
  );
}
