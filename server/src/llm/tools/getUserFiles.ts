import { NeonDatabaseService } from '../../services/neonDatabaseService';

/**
 * Fetches a list of files uploaded by a user.
 * @param user_id - ID of the user
 * @returns List of files
 */
export async function getUserFiles(user_id: string): Promise<any> {
  const dbService = new NeonDatabaseService();
  const result = await dbService.getUserFiles(user_id);
  return result.files || [];
} 