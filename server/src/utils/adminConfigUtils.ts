const adminConfigs: Record<string, any> = {};

const DEFAULT_CONFIG = {
  teamMembers: [
    { id: 'admin', name: 'Admin User', role: 'admin' },
    { id: 'user1', name: 'User One', role: 'member' },
  ],
  fileSizeLimitMB: 20,
  toolAccess: {
    admin: ['all'],
    member: ['chat', 'image', 'audio'],
  },
  featureFlags: {
    enablePlugins: false,
    enableAdvancedAnalytics: false,
  },
};

export async function getAdminConfigFromStore(workspaceId: string) {
  return adminConfigs[workspaceId] || { ...DEFAULT_CONFIG };
}

export async function updateAdminConfigInStore(workspaceId: string, config: any) {
  adminConfigs[workspaceId] = { ...DEFAULT_CONFIG, ...config };
  return adminConfigs[workspaceId];
} 