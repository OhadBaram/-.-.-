import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getTenantDB } from '@/lib/tenant-db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, websiteUrl, referenceLink1, referenceLink2, referenceLink3, brandIdentity } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    let updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { name, phone },
      include: { workspaces: true }
    });

    if (updatedUser.workspaces.length === 0) {
      // Create a default workspace for the user
      const newWorkspace = await prisma.workspace.create({
        data: {
          name: `המרחב של ${name}`,
        }
      });
      await prisma.workspaceUser.create({
        data: {
          userId: updatedUser.id,
          workspaceId: newWorkspace.id,
          role: 'owner'
        }
      });
      // Refresh user with workspaces
      updatedUser = await prisma.user.findUnique({
        where: { id: updatedUser.id },
        include: { workspaces: true }
      }) as any;
    }

    if (updatedUser && updatedUser.workspaces.length > 0) {
      const workspaceId = updatedUser.workspaces[0].workspaceId;
      try {
        const tenantDb = await getTenantDB(workspaceId, updatedUser.id, ['owner', 'admin']);
        await tenantDb.workspace.update({
          where: { id: workspaceId },
          data: {
            websiteUrl: websiteUrl || null,
            referenceLink1: referenceLink1 || null,
            referenceLink2: referenceLink2 || null,
            referenceLink3: referenceLink3 || null,
            brandIdentity: brandIdentity || null
          }
        });
      } catch (wsError) {
        console.error('Could not update workspace during onboarding:', wsError);
        // We don't fail the onboarding if workspace update fails
      }
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Onboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
