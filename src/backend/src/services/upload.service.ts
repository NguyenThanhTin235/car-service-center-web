import cloudinary from '../config/cloudinary';

export class UploadService {
  static async uploadImage(fileBuffer: Buffer, folder: string = 'car_service'): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) return reject(error);
          resolve(result?.secure_url as string);
        }
      );
      uploadStream.end(fileBuffer);
    });
  }
}
