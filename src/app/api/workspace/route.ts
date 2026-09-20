import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getTenantDB } from '@/lib/tenant-db';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { brandIdentity, brandColor, websiteUrl, referenceLink1, referenceLink2, referenceLink3, aiProvider, aiModel, workspaceId } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    try {
      // Tenant Isolation: Get tenant-specific DB client (Requires 'owner' or 'admin' to modify workspace settings)
      const tenantDb = await getTenantDB(workspaceId, user.id, ['owner', 'admin']);

      const updatedWorkspace = await tenantDb.workspace.update({
        where: { id: workspaceId },
        data: {
          brandIdentity,
          brandColor,
          websiteUrl,
          referenceLink1,
          referenceLink2,
          referenceLink3,
          aiProvider,
          aiModel
        }
      });

      return NextResponse.json({ workspace: updatedWorkspace });
    } catch (error: any) {
      console.error('Tenant DB Error:', error);
      return NextResponse.json({ error: error.message || 'Forbidden' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error updating workspace:', error);
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
  }
}
