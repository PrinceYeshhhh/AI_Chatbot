import { getAdminConfigFromStore, updateAdminConfigInStore } from '../utils/adminConfigUtils';

export async function getAdminConfig(workspaceId: string) {
  return getAdminConfigFromStore(workspaceId);
}

export async function updateAdminConfig(workspaceId: string, config: any) {
  return updateAdminConfigInStore(workspaceId, config);
} 