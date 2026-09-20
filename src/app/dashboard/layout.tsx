import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';

    if (user && (!user.name || !user.phone)) {
      if (!pathname.startsWith('/dashboard/onboarding')) {
        redirect('/dashboard/onboarding');
      }
    }
  }

  return <>{children}</>;
}
