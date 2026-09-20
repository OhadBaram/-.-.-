import prisma from '@/lib/prisma';
import { getTenantDB } from '@/lib/tenant-db';

export async function getWorkspaceUsage(workspaceId: string, userId: string) {
  // Use tenant DB to ensure isolation
  const tenantDb = await getTenantDB(workspaceId, userId, ['owner', 'admin', 'member']);
  
  const workspace = await tenantDb.workspace.findUnique({
    where: { id: workspaceId }
  });

  if (!workspace) throw new Error('Workspace not found');

  // Count carousels generated this calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usageCount = await tenantDb.carousel.count({
    where: {
      workspaceId,
      createdAt: { gte: startOfMonth }
    }
  });

  let limit = 0;
  let isWelcomeWeek = false;

  const msInDay = 1000 * 60 * 60 * 24;
  const daysSinceCreation = (Date.now() - workspace.createdAt.getTime()) / msInDay;

  if (workspace.plan === 'freemium' || workspace.plan === 'free') {
    limit = 2; // Base free limit
    
    // Welcome credit of +5 for the first 7 days
    if (daysSinceCreation <= 7) {
      limit += 5; // 7 total limit in the first week
      isWelcomeWeek = true;
    }
  } else if (workspace.plan === 'pro') {
    limit = 25;
  } else if (workspace.plan === 'premium') {
    limit = 60;
  } else if (workspace.plan === 'unlimited') {
    limit = 999999;
  } else {
    limit = 2; // fallback
  }

  return {
    usageCount,
    limit,
    plan: workspace.plan,
    isWelcomeWeek,
    canGenerate: usageCount < limit,
    daysSinceCreation
  };
}
