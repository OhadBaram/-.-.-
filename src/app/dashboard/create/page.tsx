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

  let workspace = user?.workspaces[0]?.workspace;
  
  if (!workspace && user) {
    workspace = await prisma.workspace.create({
      data: { name: `המרחב של ${user.name || 'המשתמש'}` }
    });
    await prisma.workspaceUser.create({
      data: { userId: user.id, workspaceId: workspace.id, role: 'owner' }
    });
  }

  return (
    <main className="min-h-screen bg-[#0c0f14]" dir="rtl">
      <CarouselCreator
        userName={user?.name || session.user.name || ''}
        initialWebsiteUrl={workspace?.websiteUrl || ''}
        initialReferenceLink1={workspace?.referenceLink1 || ''}
        initialReferenceLink2={workspace?.referenceLink2 || ''}
        initialReferenceLink3={workspace?.referenceLink3 || ''}
        brandColor={workspace?.brandColor || '#6366f1'}
      />
    </main>
  );
}
