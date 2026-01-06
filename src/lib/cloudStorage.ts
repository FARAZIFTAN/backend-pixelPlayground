import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { logError, logInfo } from './errorHandler';
import { ConfigService, configService } from './config';

/**
 * Cloudinary Cloud Storage Service
 * Handles image uploads to Cloudinary CDN
 * Now supports Dependency Injection for better testability
 */

interface UploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: any;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  secure_url?: string;
  error?: string;
}

interface CloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

class CloudStorageService {
  private isConfigured: boolean = false;
  private readonly DEFAULT_FOLDER = 'pixelplayground';
  private readonly config: ConfigService;
  private cloudinaryInstance: typeof cloudinary;

  constructor(
    config: ConfigService = configService,
    cloudinaryInstance: typeof cloudinary = cloudinary
  ) {
    this.config = config;
    this.cloudinaryInstance = cloudinaryInstance;
    this.initialize();
  }

  /**
   * Get Cloudinary credentials from config service
   */
  private getCloudinaryCredentials(): CloudinaryCredentials | null {
    const cloudinaryConfig = this.config.get('cloudinary');

    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.apiKey || !cloudinaryConfig.apiSecret) {
      return null;
    }

    return {
      cloudName: cloudinaryConfig.cloudName,
      apiKey: cloudinaryConfig.apiKey,
      apiSecret: cloudinaryConfig.apiSecret,
    };
  }

  /**
   * Log Cloudinary configuration warning
   */
  private logConfigurationWarning(): void {
    console.warn('⚠️  Cloudinary not configured. File uploads will use local storage.');
    console.warn('📁 Add Cloudinary credentials to .env file:');
    console.warn('   CLOUDINARY_CLOUD_NAME=your-cloud-name');
    console.warn('   CLOUDINARY_API_KEY=your-api-key');
    console.warn('   CLOUDINARY_API_SECRET=your-api-secret');
  }

  /**
   * Initialize Cloudinary configuration
   */
  private initialize(): void {
    const credentials = this.getCloudinaryCredentials();

    if (!credentials) {
      this.logConfigurationWarning();
      this.isConfigured = false;
      return;
    }

    try {
      this.cloudinaryInstance.config({
        cloud_name: credentials.cloudName,
        api_key: credentials.apiKey,
        api_secret: credentials.apiSecret,
        secure: true,
      });

      this.isConfigured = true;
      console.log('✅ Cloudinary configured successfully');
      logInfo('Cloudinary initialized', { cloudName: credentials.cloudName });
    } catch (error) {
      console.error('❌ Error configuring Cloudinary:', (error as Error).message);
      logError(error as Error, { context: 'Cloudinary initialization' });
      this.isConfigured = false;
    }
  }

  /**
   * Create upload error result
   */
  private createErrorResult(errorMessage: string): UploadResult {
    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Create upload options with defaults
   */
  private createUploadOptions(options: UploadOptions): any {
    return {
      folder: options.folder || this.DEFAULT_FOLDER,
      resource_type: options.resourceType || 'auto',
      public_id: options.publicId,
      transformation: options.transformation,
    };
  }

  /**
   * Upload image from base64 string
   */
  async uploadBase64(
    base64Data: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!this.isConfigured) {
      return this.createErrorResult('Cloudinary not configured. Using local storage fallback.');
    }

    try {
      const uploadOptions = this.createUploadOptions(options);
      const result = await this.cloudinaryInstance.uploader.upload(base64Data, uploadOptions);

      logInfo('Image uploaded to Cloudinary', {
        publicId: result.public_id,
        url: result.secure_url,
      });

      return {
        success: true,
        url: result.url,
        secure_url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('❌ Cloudinary upload error:', errorMessage);
      logError(error as Error, { context: 'Cloudinary base64 upload', folder: options.folder });
      return this.createErrorResult(errorMessage);
    }
  }

  /**
   * Upload image from buffer
   */
  async uploadBuffer(
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!this.isConfigured) {
      return this.createErrorResult('Cloudinary not configured');
    }

    return new Promise((resolve) => {
      const uploadOptions = this.createUploadOptions(options);
      
      const uploadStream = this.cloudinaryInstance.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error || !result) {
            const errorMessage = error?.message || 'Upload failed';
            console.error('❌ Cloudinary upload error:', errorMessage);
            logError(error as Error, { context: 'Cloudinary buffer upload' });
            resolve(this.createErrorResult(errorMessage));
          } else {
            logInfo('Image uploaded to Cloudinary', {
              publicId: result.public_id,
              url: result.secure_url,
            });
            resolve({
              success: true,
              url: result.url,
              secure_url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('Cloudinary not configured, cannot delete image');
      return false;
    }

    try {
      const result = await this.cloudinaryInstance.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        logInfo('Image deleted from Cloudinary', { publicId });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error deleting image:', (error as Error).message);
      logError(error as Error, { context: 'Cloudinary delete', publicId });
      return false;
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(
    base64OrBuffer: string | Buffer,
    userId: string
  ): Promise<UploadResult> {
    const options: UploadOptions = {
      folder: 'pixelplayground/profiles',
      publicId: `profile_${userId}_${Date.now()}`,
      transformation: {
        width: 400,
        height: 400,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto',
      },
    };

    if (typeof base64OrBuffer === 'string') {
      return this.uploadBase64(base64OrBuffer, options);
    } else {
      return this.uploadBuffer(base64OrBuffer, options);
    }
  }

  /**
   * Upload photo (captured photo)
   */
  async uploadPhoto(
    base64OrBuffer: string | Buffer,
    userId: string
  ): Promise<UploadResult> {
    const options: UploadOptions = {
      folder: 'pixelplayground/photos',
      publicId: `photo_${userId}_${Date.now()}`,
      transformation: {
        quality: 'auto:good',
        fetch_format: 'auto',
      },
    };

    if (typeof base64OrBuffer === 'string') {
      return this.uploadBase64(base64OrBuffer, options);
    } else {
      return this.uploadBuffer(base64OrBuffer, options);
    }
  }

  /**
   * Upload composite (final frame with photos)
   */
  async uploadComposite(
    base64OrBuffer: string | Buffer,
    userId: string
  ): Promise<UploadResult> {
    const options: UploadOptions = {
      folder: 'pixelplayground/composites',
      publicId: `composite_${userId}_${Date.now()}`,
      transformation: {
        quality: 'auto:best',
        fetch_format: 'auto',
      },
    };

    if (typeof base64OrBuffer === 'string') {
      return this.uploadBase64(base64OrBuffer, options);
    } else {
      return this.uploadBuffer(base64OrBuffer, options);
    }
  }

  /**
   * Upload template SVG
   */
  async uploadTemplate(
    svgData: string,
    templateId: string
  ): Promise<UploadResult> {
    const options: UploadOptions = {
      folder: 'pixelplayground/templates',
      publicId: `template_${templateId}`,
      resourceType: 'raw',
    };

    // Convert SVG to base64 if needed
    const base64Data = svgData.startsWith('data:')
      ? svgData
      : `data:image/svg+xml;base64,${Buffer.from(svgData).toString('base64')}`;

    return this.uploadBase64(base64Data, options);
  }

  /**
   * Upload payment proof
   */
  async uploadPaymentProof(
    base64OrBuffer: string | Buffer,
    userId: string
  ): Promise<UploadResult> {
    const options: UploadOptions = {
      folder: 'pixelplayground/payment-proofs',
      publicId: `payment_${userId}_${Date.now()}`,
      transformation: {
        quality: 'auto:good',
      },
    };

    if (typeof base64OrBuffer === 'string') {
      return this.uploadBase64(base64OrBuffer, options);
    } else {
      return this.uploadBuffer(base64OrBuffer, options);
    }
  }

  /**
   * Get optimized image URL
   */
  getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: string;
      format?: string;
    } = {}
  ): string {
    if (!this.isConfigured) {
      return publicId; // Return original if not configured
    }

    return cloudinary.url(publicId, {
      transformation: {
        width: options.width,
        height: options.height,
        quality: options.quality || 'auto',
        fetch_format: options.format || 'auto',
        crop: 'limit',
      },
    });
  }

  /**
   * Get service status
   */
  getStatus(): { configured: boolean; cloudName: string } {
    return {
      configured: this.isConfigured,
      cloudName: this.config.get('cloudinary').cloudName || 'Not configured',
    };
  }
}

// Export singleton instance for backward compatibility
export const cloudStorageService = new CloudStorageService();

// Factory function for testing and dependency injection
export const createCloudStorageService = (
  config?: ConfigService,
  cloudinaryInstance?: typeof cloudinary
): CloudStorageService => {
  return new CloudStorageService(config, cloudinaryInstance);
};

export default cloudStorageService;
