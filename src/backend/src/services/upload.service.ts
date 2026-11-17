import crypto from 'node:crypto';
import cloudinary from '../config/cloudinary';
import { uploadObjectToS3 } from './aws-s3.service';

export class UploadService {
  static async uploadImage(
    fileBuffer: Buffer,
    folder: string = 'car_service',
    contentType: string = 'image/jpeg'
  ): Promise<string> {
    if (process.env.STORAGE_PROVIDER === 's3' && process.env.AWS_S3_BUCKET) {
      const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
      const key = `${cleanFolder}/${Date.now()}-${crypto.randomUUID()}`;
      const result = await uploadObjectToS3({
        buffer: fileBuffer,
        key,
        contentType,
      });
      return result.url;
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto', timeout: 30000 },
        (error, result) => {
          if (error) return reject(error);
          resolve(result?.secure_url as string);
        }
      );
      uploadStream.end(fileBuffer);
    });
  }
}
