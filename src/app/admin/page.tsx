import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminDashboardClient, { CustomerData } from '@/components/admin/AdminDashboardClient';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/api/auth/signin');
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, isAdmin: true }
  });

  if (!currentUser?.isAdmin) {
    redirect('/dashboard');
  }

  // Fetch all users with their workspaces and carousels
  const allUsers = await prisma.user.findMany({
    include: {
      workspaces: {
        include: {
          workspace: {
            include: {
              carousels: {
                select: { id: true, createdAt: true }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalCarousels = await prisma.carousel.count();

  const now = Date.now();
  const msInDay = 1000 * 60 * 60 * 24;

  const customers: CustomerData[] = allUsers.map((u) => {
    const primaryWsUser = u.workspaces[0];
    const ws = primaryWsUser?.workspace;
    const plan = ws?.plan || 'freemium';
    const carouselsCount = ws?.carousels?.length || 0;
    const daysSinceReg = Math.floor((now - new Date(u.createdAt).getTime()) / msInDay);

    const isTrialActive = (plan === 'freemium' || plan === 'free') && daysSinceReg <= 7;
    const trialExpiredNoUpgrade = (plan === 'freemium' || plan === 'free') && daysSinceReg > 7;

    // Check last carousel date
    const carousels = ws?.carousels || [];
    const lastCarouselDate = carousels.length > 0 
      ? new Date(carousels[0].createdAt).getTime()
      : 0;
    
    const isInactive30Days = daysSinceReg > 30 && (now - lastCarouselDate) > (30 * msInDay);

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      createdAt: u.createdAt.toISOString(),
      daysSinceRegistration: daysSinceReg,
      workspaceId: ws?.id || '',
      workspaceName: ws?.name || 'מרחב אישי',
      plan,
      carouselsCount,
      isTrialActive,
      trialExpiredNoUpgrade,
      isInactive30Days,
    };
  });

  return (
    <AdminDashboardClient 
      adminEmail={currentUser.email || ''} 
      customers={customers} 
      totalCarousels={totalCarousels} 
    />
  );
}
