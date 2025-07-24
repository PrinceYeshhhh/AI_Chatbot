import fs from 'fs/promises';
import path from 'path';
import { QdrantService } from './qdrantService';
import { NeonDatabaseService } from './neonDatabaseService';
import { EmbeddingService } from './embeddingService';

export interface FileMetadata {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  isDeleted?: boolean;
}

export class FileService {
  public readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Buffer, metadata: Omit<FileMetadata, 'id' | 'uploadedAt'>): Promise<FileMetadata> {
    const fileId = Math.random().toString(36).substr(2, 9);
    const filePath = path.join(this.uploadDir, `${fileId}_${metadata.fileName}`);
    
    await fs.writeFile(filePath, file);
    
    const fileMetadata: FileMetadata = {
      id: fileId,
      userId: metadata.userId,
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      mimeType: metadata.mimeType,
      uploadedAt: new Date()
    };

    // In a real implementation, you would save metadata to a database
    return fileMetadata;
  }

  async getFile(fileId: string): Promise<Buffer | null> {
    try {
      // In a real implementation, you would look up the file path from a database
      const filePath = path.join(this.uploadDir, `${fileId}_*`);
      const files = await fs.readdir(this.uploadDir);
      const targetFile = files.find(file => file.startsWith(fileId));
      
      if (!targetFile) return null;
      
      return await fs.readFile(path.join(this.uploadDir, targetFile));
    } catch {
      return null;
    }
  }

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      // In a real implementation, you would mark the file as deleted in a database
      // For now, we'll just return true
      return true;
    } catch {
      return false;
    }
  }

  async markFileAsDeleted(fileId: string, userId: string): Promise<boolean> {
    try {
      // In a real implementation, you would update the database
      return true;
    } catch {
      return false;
    }
  }

  async getUserFiles(userId: string): Promise<FileMetadata[]> {
    // In a real implementation, you would query a database
    // For now, return empty array
    return [];
  }
}

export async function deleteFileAndMemory(userId: string, fileId: string): Promise<{ success: boolean; steps: string[]; errors: string[] }> {
  const steps: string[] = [];
  const errors: string[] = [];
  const qdrant = new QdrantService();
  const db = new NeonDatabaseService();
  const fileService = new FileService();
  const embeddingService = new EmbeddingService();
  let fileMeta: FileMetadata | null = null;
  try {
    // Step 1: Check file ownership and existence
    fileMeta = await db.getFileById(fileId);
    if (!fileMeta) {
      errors.push('File not found');
      return { success: false, steps, errors };
    }
    if (fileMeta.userId !== userId) {
      errors.push('User does not own this file');
      return { success: false, steps, errors };
    }
    // Step 2: Delete file content from storage (if applicable)
    try {
      // Try to delete from local storage
      const files = await fs.readdir(fileService.uploadDir);
      const targetFile = files.find(file => file.startsWith(fileId));
      if (targetFile) {
        await fs.unlink(path.join(fileService.uploadDir, targetFile));
        steps.push('File content deleted from storage');
      } else {
        steps.push('File content not found in storage (may be already deleted)');
      }
    } catch (e) {
      errors.push('Failed to delete file content: ' + (e instanceof Error ? e.message : e));
    }
    // Step 3: Delete all vector embeddings for this file_id from vector DB (strict multi-tenant)
    try {
      await embeddingService.deleteEmbeddingsForFile(fileId, userId);
      steps.push('Embeddings deleted from vector DB');
    } catch (e) {
      errors.push('Failed to delete embeddings: ' + (e instanceof Error ? e.message : e));
    }
    // Step 4: Delete chunk metadata from DB (index, section, etc.)
    try {
      await db.deleteFileById(fileId);
      steps.push('File metadata deleted from DB');
    } catch (e) {
      errors.push('Failed to delete file metadata: ' + (e instanceof Error ? e.message : e));
    }
    // TODO: If you have a chunk/section table, delete those rows as well for this fileId and userId
    // TODO: If you have analytics/logs, consider deleting or anonymizing those
    return { success: errors.length === 0, steps, errors };
  } catch (e) {
    errors.push('Unexpected error: ' + (e instanceof Error ? e.message : e));
    return { success: false, steps, errors };
  }
} 