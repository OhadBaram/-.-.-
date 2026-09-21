import prisma from './prisma';

/**
 * מחזיר Prisma מורחב שמכריח workspaceId על פעולות Carousel,
 * אחרי אימות membership+role.
 */
export async function getTenantDB(
  workspaceId: string,
  userId: string,
  requiredRoles: string[] = ['owner', 'admin', 'member']
) {
  const membership = await prisma.workspaceUser.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || !requiredRoles.includes(membership.role)) {
    throw new Error('Forbidden: Insufficient permissions for this workspace');
  }

  return prisma.$extends({
    query: {
      carousel: {
        async $allOperations({
          operation,
          args,
          query,
        }: {
          operation: string;
          args: Record<string, unknown>;
          query: (args: Record<string, unknown>) => Promise<unknown>;
        }) {
          if (operation === 'create' || operation === 'createMany') {
            const data = args.data as Record<string, unknown> | Record<string, unknown>[] | undefined;
            if (data) {
              if (Array.isArray(data)) {
                args.data = data.map((d) => ({ ...d, workspaceId }));
              } else {
                args.data = { ...data, workspaceId };
              }
            }
          } else if (
            [
              'findUnique',
              'findFirst',
              'findMany',
              'update',
              'updateMany',
              'delete',
              'deleteMany',
              'count',
              'aggregate',
            ].includes(operation)
          ) {
            const where = (args.where as Record<string, unknown> | undefined) ?? {};
            args.where = { ...where, workspaceId };
          }
          return query(args);
        },
      },
      workspace: {
        async $allOperations({
          operation,
          args,
          query,
        }: {
          operation: string;
          args: Record<string, unknown>;
          query: (args: Record<string, unknown>) => Promise<unknown>;
        }) {
          if (['update', 'delete'].includes(operation)) {
            if (!['owner', 'admin'].includes(membership.role)) {
              throw new Error('Forbidden: Only admins can modify the workspace');
            }
            const where = (args.where as Record<string, unknown> | undefined) ?? {};
            args.where = { ...where, id: workspaceId };
          }
          return query(args);
        },
      },
    },
  });
}
