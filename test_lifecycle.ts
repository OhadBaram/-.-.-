const m = require('module');
const originalRequire = m.prototype.require;

const mockPrisma = {
  user: {
    findUnique: async (args) => {
      if (args.where.email === 'test@example.com') {
        return {
          id: 'user_1',
          email: 'test@example.com',
          workspaces: [
            { workspaceId: 'ws_1' },
            { workspaceId: 'ws_2' }
          ]
        };
      }
      return null;
    },
    delete: async (args) => {
      mockPrisma.deletedUsers.push(args.where.id);
      return {};
    }
  },
  workspaceUser: {
    count: async (args) => {
      if (args.where.workspaceId === 'ws_1') return 1; // orphaned
      if (args.where.workspaceId === 'ws_2') return 2; // not orphaned
      return 0;
    }
  },
  workspace: {
    deleteMany: async (args) => {
      mockPrisma.deletedWorkspaces.push(...args.where.id.in);
      return { count: args.where.id.in.length };
    }
  },
  $transaction: async (fn) => {
    return fn(mockPrisma);
  },
  deletedUsers: [],
  deletedWorkspaces: []
};

m.prototype.require = function (id) {
  if (id === 'next-auth/next') {
    return {
      getServerSession: async () => ({ user: { email: 'test@example.com' } })
    };
  }
  if (id.includes('lib/prisma')) {
    return { default: mockPrisma, __esModule: true };
  }
  if (id === 'next/server') {
    return {
      NextResponse: {
        json: (body, init) => ({
          status: init?.status || 200,
          json: async () => body
        })
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

async function runTest() {
  const { POST } = require('./src/app/api/user/offboard/route.ts');
  
  console.log("Mock data set up for user: test@example.com");
  console.log("Workspaces associated: ws_1 (1 member), ws_2 (2 members)");
  
  const req = {}; 
  const response = await POST(req);
  const data = await response.json();
  
  console.log("\n--- TEST RESULTS ---");
  console.log("HTTP Status:", response.status);
  console.log("Response Data:", data);
  
  console.log("\n--- DATABASE MUTATIONS ---");
  console.log("Deleted Users:", mockPrisma.deletedUsers);
  console.log("Deleted Workspaces (Orphaned):", mockPrisma.deletedWorkspaces);
  
  if (response.status === 200 && mockPrisma.deletedUsers.includes('user_1') && mockPrisma.deletedWorkspaces.includes('ws_1') && !mockPrisma.deletedWorkspaces.includes('ws_2')) {
    console.log("\n✅ Test Passed: Only the orphaned workspace was deleted, and the user was deleted successfully.");
  } else {
    console.log("\n❌ Test Failed: The logic did not behave as expected.");
  }
}

runTest().catch(console.error);
