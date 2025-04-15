import { Module } from '@nestjs/common';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';

/**
 * StreamModule là module chính xử lý việc streaming video
 *
 * Vòng đời của module:
 * 1. Được import vào AppModule (module gốc)
 * 2. Khởi tạo các dependencies (CloudinaryModule)
 * 3. Khởi tạo các providers (StreamService)
 * 4. Khởi tạo controller (StreamController)
 * 5. Tự động cleanup khi ứng dụng kết thúc
 *
 * Các thành phần chính:
 * - StreamController: Xử lý các request HTTP (upload, stream video)
 * - StreamService: Xử lý logic nghiệp vụ (đọc file, tạo stream)
 * - CloudinaryModule: Xử lý việc lưu trữ video trên cloud
 */
@Module({
  imports: [TypeOrmModule.forFeature([Video]), CloudinaryModule],
  controllers: [StreamController],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}
