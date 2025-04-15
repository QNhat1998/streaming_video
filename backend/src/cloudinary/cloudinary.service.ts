import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { CloudinaryResponse } from './cloudinary-response';

/**
 * CloudinaryService là một service được inject vào các module khác
 * để xử lý việc upload và quản lý video trên Cloudinary
 *
 * Vòng đời của service:
 * 1. Khởi tạo khi ứng dụng bắt đầu (constructor)
 * 2. Được inject vào các module khác thông qua DI (Dependency Injection)
 * 3. Tồn tại trong suốt vòng đời của ứng dụng (singleton)
 * 4. Tự động cleanup khi ứng dụng kết thúc
 */
@Injectable()
export class CloudinaryService {
  constructor() {
    // Cấu hình Cloudinary với thông tin từ biến môi trường
    // Được gọi một lần duy nhất khi service được khởi tạo
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Upload video lên Cloudinary
   * @param file - File video từ request
   * @param options - Optional upload options
   * @returns Promise<CloudinaryResponse> - Object with video info
   *
   * Quy trình upload:
   * 1. Tạo một upload stream từ Cloudinary
   * 2. Chuyển đổi file buffer thành Readable stream
   * 3. Pipe buffer stream vào upload stream
   * 4. Xử lý kết quả upload (thành công/thất bại)
   */
  async uploadVideo(
    file: Express.Multer.File,
    options?: any,
  ): Promise<CloudinaryResponse> {
    try {
      console.log('Starting Cloudinary upload...');

      const result = await new Promise<CloudinaryResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              folder: 'videos',
              ...options,
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                reject(error);
              } else {
                console.log('Cloudinary upload success:', result);
                resolve(result as CloudinaryResponse);
              }
            },
          );

          // Pipe file buffer to upload stream
          const buffer = file.buffer;
          const chunkSize = options?.chunk_size || 5 * 1024 * 1024; // Default 5MB chunks

          for (let i = 0; i < buffer.length; i += chunkSize) {
            const chunk = buffer.slice(i, i + chunkSize);
            uploadStream.write(chunk);
          }

          uploadStream.end();
        },
      );

      return result;
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      throw error;
    }
  }

  /**
   * Xóa video khỏi Cloudinary
   * @param publicId - ID của video trên Cloudinary
   * @returns Promise<void>
   */
  async deleteVideo(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  }

  async getVideoInfo(videoName: string) {
    try {
      const result = await cloudinary.api.resource(videoName, {
        resource_type: 'video',
      });
      return result;
    } catch (error) {
      throw new Error(`Error getting video info: ${error.message}`);
    }
  }

  url(publicId: string, options: any = {}) {
    return cloudinary.url(publicId, options);
  }
}
