import { NeonDatabaseService } from '../services/neonDatabaseService';
import { QdrantService } from '../services/qdrantService';
import fs from 'fs/promises';
import path from 'path';

async function cleanupExpiredTemporaryFiles() {
  const dbService = new NeonDatabaseService();
  const qdrantService = new QdrantService();
  const expiredFiles = await dbService.getExpiredTemporaryFiles();
  for (const file of expiredFiles) {
    try {
      // Delete file from disk
      if (file.user_id && file.file_name) {
        const filePath = path.join(__dirname, '../../uploads', file.user_id, 'temporary', file.file_name);
        await fs.unlink(filePath).catch(() => {});
      }
      // Delete embeddings from Qdrant
      if (file.id) {
        await qdrantService.deleteEmbeddings(file.id);
      }
      // Delete metadata from DB
      await dbService.deleteFileById(file.id);
      console.log(`Deleted expired temporary file: ${file.file_name}`);
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  }
}

cleanupExpiredTemporaryFiles().then(() => {
  console.log('Expired temporary file cleanup complete.');
  process.exit(0);
}); 