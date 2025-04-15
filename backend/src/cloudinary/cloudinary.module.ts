import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { ConfigModule } from '@nestjs/config';

/**
 * CloudinaryModule là một module chuyên biệt để quản lý các service liên quan đến Cloudinary
 *
 * Vòng đời của module:
 * 1. Được import vào AppModule hoặc các module khác
 * 2. Khởi tạo các providers (CloudinaryService)
 * 3. Export CloudinaryService để các module khác có thể sử dụng
 * 4. Tự động cleanup khi ứng dụng kết thúc
 */
@Module({
  imports: [ConfigModule],
  providers: [CloudinaryService], // Đăng ký CloudinaryService
  exports: [CloudinaryService], // Cho phép các module khác sử dụng CloudinaryService
})
export class CloudinaryModule {}
