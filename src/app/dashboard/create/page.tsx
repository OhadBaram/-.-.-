import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import CarouselCreator from '@/components/CarouselCreator';

export default async function CreateCarouselPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen p-8 text-center bg-gray-50 flex items-center justify-center">
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
    <main className="min-h-screen p-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50" dir="rtl">
      <header className="mb-10 text-center relative">
        <div className="absolute top-0 right-0">
          <Link href="/dashboard" className="text-sm underline text-indigo-600 hover:text-indigo-800">
            חזרה ללוח הבקרה
          </Link>
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">יצירת קרוסלה חדשה</h1>
        <p className="text-gray-600 text-lg md:text-xl font-medium">הזן פרטים וקבל קרוסלה מוכנה תוך שניות</p>
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
