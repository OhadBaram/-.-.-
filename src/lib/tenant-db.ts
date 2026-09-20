import prisma from './prisma';

export async function getTenantDB(workspaceId: string, userId: string, requiredRoles: string[] = ['owner', 'admin', 'member']) {
  // 1. Verify user membership and role
  const membership = await prisma.workspaceUser.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } }
  });

  if (!membership || !requiredRoles.includes(membership.role)) {
    throw new Error('Forbidden: Insufficient permissions for this workspace');
  }

  // 2. Return an extended Prisma client that enforces workspaceId
  return prisma.$extends({
    query: {
      carousel: {
        async $allOperations({ operation, args, query }) {
          if (operation === 'create' || operation === 'createMany') {
            if (args.data) {
              if (Array.isArray(args.data)) {
                args.data = args.data.map(d => ({ ...d, workspaceId }));
              } else {
                (args.data as any).workspaceId = workspaceId;
              }
            }
          } else if (['findUnique', 'findFirst', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
            if (!args.where) args.where = {};
            (args.where as any).workspaceId = workspaceId;
          }
          return query(args);
        }
      },
      workspace: {
        async $allOperations({ operation, args, query }) {
          if (['update', 'delete'].includes(operation)) {
             if (!['owner', 'admin'].includes(membership.role)) {
                throw new Error('Forbidden: Only admins can modify the workspace');
             }
             if (!args.where) args.where = {};
             (args.where as any).id = workspaceId;
          }
          return query(args);
        }
      }
    }
  });
}
