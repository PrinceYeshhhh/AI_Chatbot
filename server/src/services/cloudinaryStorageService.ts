import { v2 as cloudinary } from 'cloudinary';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export interface FileMetadata {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  uploadedAt: Date;
  publicId?: string;
}

export class CloudinaryStorageService {
  private cloudName: string;

  constructor() {
    const cloudinaryConfig: CloudinaryConfig = {
      cloudName: process.env['CLOUDINARY_CLOUD_NAME']!,
      apiKey: process.env['CLOUDINARY_API_KEY']!,
      apiSecret: process.env['CLOUDINARY_API_SECRET']!
    };

    cloudinary.config(cloudinaryConfig);
    this.cloudName = cloudinaryConfig.cloudName;
  }

  async uploadFile(file: Buffer, fileName: string, userId: string, mimeType: string): Promise<FileMetadata> {
    try {
      const fileId = Math.random().toString(36).substr(2, 9);
      const publicId = `users/${userId}/files/${fileId}_${fileName}`;
      
      // Convert buffer to base64 for Cloudinary upload
      const base64File = file.toString('base64');
      const dataURI = `data:${mimeType};base64,${base64File}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        public_id: publicId,
        resource_type: 'auto',
        folder: `users/${userId}/files`,
        use_filename: false,
        unique_filename: false,
        overwrite: false,
        tags: [`user:${userId}`, 'uploaded'],
        context: {
          userId,
          originalName: fileName,
          uploadedAt: new Date().toISOString()
        }
      });

      return {
        id: fileId,
        userId,
        fileName,
        fileSize: file.length,
        mimeType,
        downloadUrl: result.secure_url,
        uploadedAt: new Date(),
        publicId: result.public_id
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  async getFileUrl(publicId: string): Promise<string> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary get URL error:', error);
      throw error;
    }
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  async listUserFiles(userId: string): Promise<string[]> {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: `users/${userId}/files/`,
        max_results: 500
      });
      return result.resources.map(resource => resource.public_id);
    } catch (error) {
      console.error('Cloudinary list files error:', error);
      return [];
    }
  }

  async getFileMetadata(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        createdAt: result.created_at,
        context: result.context
      };
    } catch (error) {
      console.error('Cloudinary get metadata error:', error);
      return null;
    }
  }

  async updateFileMetadata(publicId: string, metadata: any): Promise<boolean> {
    try {
      await cloudinary.uploader.explicit(publicId, {
        type: 'upload',
        context: metadata
      });
      return true;
    } catch (error) {
      console.error('Cloudinary update metadata error:', error);
      return false;
    }
  }

  async generateSignedUrl(publicId: string, expiresIn: number = 3600): Promise<string> {
    try {
      // Cloudinary URLs are already signed and secure
      const result = await cloudinary.api.resource(publicId);
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary signed URL error:', error);
      throw error;
    }
  }

  async uploadFromPath(filePath: string, fileName: string, userId: string, mimeType: string): Promise<FileMetadata> {
    try {
      const fileId = Math.random().toString(36).substr(2, 9);
      const publicId = `users/${userId}/files/${fileId}_${fileName}`;

      // Upload from file path
      const result = await cloudinary.uploader.upload(filePath, {
        public_id: publicId,
        resource_type: 'auto',
        folder: `users/${userId}/files`,
        use_filename: false,
        unique_filename: false,
        overwrite: false,
        tags: [`user:${userId}`, 'uploaded'],
        context: {
          userId,
          originalName: fileName,
          uploadedAt: new Date().toISOString()
        }
      });

      return {
        id: fileId,
        userId,
        fileName,
        fileSize: result.bytes,
        mimeType,
        downloadUrl: result.secure_url,
        uploadedAt: new Date(),
        publicId: result.public_id
      };
    } catch (error) {
      console.error('Cloudinary upload from path error:', error);
      throw error;
    }
  }

  async getTransformationUrl(publicId: string, transformations: any): Promise<string> {
    try {
      return cloudinary.url(publicId, {
        transformation: transformations
      });
    } catch (error) {
      console.error('Cloudinary transformation URL error:', error);
      throw error;
    }
  }
} 