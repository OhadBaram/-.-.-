import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch User Data (Export)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: true,
        sessions: true,
        workspaces: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Deep copy or extract data to avoid mutation issues during deletion
    const exportData = JSON.parse(JSON.stringify(user));

    // 2. Identify orphaned workspaces (where this user is the only member)
    const workspacesToDelete: string[] = [];
    for (const wu of user.workspaces) {
      const count = await prisma.workspaceUser.count({
        where: { workspaceId: wu.workspaceId }
      });
      if (count <= 1) {
        workspacesToDelete.push(wu.workspaceId);
      }
    }

    // 3. Perform deletions safely in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete orphaned workspaces first
      if (workspacesToDelete.length > 0) {
        await tx.workspace.deleteMany({
          where: { id: { in: workspacesToDelete } }
        });
      }

      // Delete the user (this cascades to remaining WorkspaceUser, Account, Session records)
      await tx.user.delete({
        where: { id: user.id }
      });
    });

    // 4. Return the exported data
    return NextResponse.json({
      message: 'Account successfully deleted and data exported.',
      export: exportData
    }, { status: 200 });

  } catch (error) {
    console.error('Error offboarding user:', error);
    return NextResponse.json({ error: 'Failed to offboard user' }, { status: 500 });
  }
}
