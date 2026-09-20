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

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { workspaceId, plan } = body;

    if (!workspaceId || !plan) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { plan }
    });

    return NextResponse.json({ success: true, workspace: updatedWorkspace });
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
