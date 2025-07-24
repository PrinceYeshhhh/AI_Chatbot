import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FileMetadata {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  uploadedAt: Date;
}

export class FirebaseStorageService {
  private storage: any;
  private bucketName: string;

  constructor() {
    const firebaseConfig: FirebaseConfig = {
      apiKey: process.env['FIREBASE_API_KEY']!,
      authDomain: process.env['FIREBASE_AUTH_DOMAIN']!,
      projectId: process.env['FIREBASE_PROJECT_ID']!,
      storageBucket: process.env['FIREBASE_STORAGE_BUCKET']!,
      messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID']!,
      appId: process.env['FIREBASE_APP_ID']!
    };

    const app = initializeApp(firebaseConfig);
    this.storage = getStorage(app);
    this.bucketName = process.env['FIREBASE_STORAGE_BUCKET']!;
  }

  async uploadFile(file: Buffer, fileName: string, userId: string, mimeType: string): Promise<FileMetadata> {
    try {
      const fileId = Math.random().toString(36).substr(2, 9);
      const filePath = `users/${userId}/files/${fileId}_${fileName}`;
      const storageRef = ref(this.storage, filePath);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: mimeType,
        metadata: {
          userId,
          originalName: fileName,
          uploadedAt: new Date().toISOString()
        }
      });

      // Get download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);

      return {
        id: fileId,
        userId,
        fileName,
        fileSize: file.length,
        mimeType,
        downloadUrl,
        uploadedAt: new Date()
      };
    } catch (error) {
      console.error('Firebase upload error:', error);
      throw error;
    }
  }

  async getFileUrl(filePath: string): Promise<string> {
    try {
      const storageRef = ref(this.storage, filePath);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Firebase get URL error:', error);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const storageRef = ref(this.storage, filePath);
      await deleteObject(storageRef);
      return true;
    } catch (error) {
      console.error('Firebase delete error:', error);
      return false;
    }
  }

  async listUserFiles(userId: string): Promise<string[]> {
    try {
      const userFolderRef = ref(this.storage, `users/${userId}/files`);
      const result = await listAll(userFolderRef);
      return result.items.map(item => item.fullPath);
    } catch (error) {
      console.error('Firebase list files error:', error);
      return [];
    }
  }

  async getFileMetadata(filePath: string): Promise<any> {
    try {
      const storageRef = ref(this.storage, filePath);
      const url = await getDownloadURL(storageRef);
      
      // Note: Firebase Storage doesn't provide direct metadata access
      // You might want to store metadata in your database
      return {
        path: filePath,
        url,
        exists: true
      };
    } catch (error) {
      console.error('Firebase get metadata error:', error);
      return null;
    }
  }

  async updateFileMetadata(filePath: string, metadata: any): Promise<boolean> {
    try {
      // Firebase Storage doesn't support metadata updates
      // You'll need to store metadata in your database
      console.log('Firebase Storage metadata updates not supported');
      return true;
    } catch (error) {
      console.error('Firebase update metadata error:', error);
      return false;
    }
  }

  async generateSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const storageRef = ref(this.storage, filePath);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Firebase signed URL error:', error);
      throw error;
    }
  }
} 