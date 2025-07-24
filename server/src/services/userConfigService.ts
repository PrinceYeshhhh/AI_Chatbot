import { getUserConfigFromStore, updateUserConfigInStore } from '../utils/userConfigUtils';

export async function getUserConfig(userId: string) {
  return getUserConfigFromStore(userId);
}

export async function updateUserConfig(userId: string, config: any) {
  return updateUserConfigInStore(userId, config);
} 