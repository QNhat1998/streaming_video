import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StreamModule } from './stream/stream.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './stream/entities/video.entity';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

/**
 * AppModule là module gốc (root module) của ứng dụng
 *
 * Vòng đời của module:
 * 1. Được khởi tạo đầu tiên khi ứng dụng bắt đầu
 * 2. Khởi tạo và cấu hình các module con (StreamModule)
 * 3. Khởi tạo các providers (AppService)
 * 4. Khởi tạo controllers (AppController)
 * 5. Tự động cleanup khi ứng dụng kết thúc
 *
 * Cấu trúc module:
 * - ConfigModule: Quản lý biến môi trường
 * - StreamModule: Xử lý streaming video
 * - AppController: Xử lý các request cơ bản
 * - AppService: Cung cấp các service cơ bản
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'streaming_db'),
        entities: [Video],
        synchronize: true, // Chỉ sử dụng trong môi trường development
      }),
      inject: [ConfigService],
    }),
    StreamModule,
    CloudinaryModule,
  ],
  controllers: [AppController], // Đăng ký controller gốc
  providers: [AppService], // Đăng ký service gốc
})
export class AppModule {}
