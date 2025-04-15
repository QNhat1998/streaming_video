import {
  Injectable,
  NotFoundException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { createReadStream, statSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './entities/video.entity';
import {
  VideoStreamResponse,
  VideoUploadResponse,
  VideoInfo,
} from './interfaces/stream.interface';

/**
 * StreamService xử lý logic nghiệp vụ liên quan đến streaming video
 *
 * Vòng đời của service:
 * 1. Được khởi tạo khi module được load
 * 2. Được inject vào controller
 * 3. Tồn tại trong suốt vòng đời của ứng dụng (singleton)
 * 4. Tự động cleanup khi ứng dụng kết thúc
 */
@Injectable()
export class StreamService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {
    // Tạo thư mục videos nếu chưa tồn tại
    if (!existsSync(this.videoPath)) {
      mkdirSync(this.videoPath, { recursive: true });
    }
  }

  private readonly videoPath = join(__dirname, '../../videos');

  /**
   * Tạo video stream từ file video
   *
   * @param videoName - Tên file video
   * @param range - Range for streaming
   *
   * Quy trình:
   * 1. Kiểm tra kích thước file video
   * 2. Tính toán range để streaming
   * 3. Tạo headers phù hợp
   * 4. Tạo read stream từ file
   */
  async getVideoStream(
    videoName: string,
    range: string,
  ): Promise<VideoStreamResponse> {
    try {
      // Tìm video theo public_id (name)
      const video = await this.videoRepository.findOne({
        where: { name: videoName },
      });

      if (!video) {
        throw new Error('Video not found in database');
      }

      const videoUrl = video.url;
      const response = await fetch(videoUrl);
      const videoBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(videoBuffer);
      const fileSize = buffer.length;
      const CHUNK_SIZE = 10 ** 6; // 1MB

      // Nếu không có range, trả về toàn bộ video
      if (!range) {
        return {
          headers: {
            'Content-Length': fileSize.toString(),
            'Content-Type': 'video/mp4',
          },
          videoBuffer: buffer,
        };
      }

      const start = Number(range.replace(/\D/g, ''));
      const end = Math.min(start + CHUNK_SIZE, fileSize - 1);

      const contentLength = end - start + 1;
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength.toString(),
        'Content-Type': 'video/mp4',
      };

      return {
        headers,
        videoBuffer: buffer.slice(start, end + 1),
      };
    } catch (error) {
      throw new Error(`Error streaming video: ${error.message}`);
    }
  }

  async getVideoInfo(videoName: string): Promise<VideoInfo> {
    try {
      // Tìm video theo public_id (name)
      const video = await this.videoRepository.findOne({
        where: { name: videoName },
      });

      if (!video) {
        throw new Error('Video not found in database');
      }

      return {
        name: video.name,
        originalName: video.originalName,
        url: video.url,
        format: video.format,
        size: video.size,
        duration: video.duration,
        createdAt: video.createdAt,
      };
    } catch (error) {
      throw new Error(`Error getting video info: ${error.message}`);
    }
  }

  async saveVideoInfo(videoInfo: Partial<Video>) {
    const video = this.videoRepository.create(videoInfo);
    return this.videoRepository.save(video);
  }

  async uploadVideo(file: Express.Multer.File) {
    try {
      console.log('=== Starting Upload Process ===');
      console.log('File details:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer ? 'Buffer exists' : 'No buffer',
      });

      // Upload to Cloudinary
      console.log('\n=== Uploading to Cloudinary ===');
      const result = await this.cloudinaryService.uploadVideo(file);
      console.log('Full Cloudinary response:', JSON.stringify(result, null, 2));

      // Tách public_id để lưu vào database
      const publicId = result.public_id.split('/').pop();
      console.log('\n=== Processing Public ID ===');
      console.log('Original public_id:', result.public_id);
      console.log('Extracted public_id:', publicId);

      // Create video entity
      console.log('\n=== Creating Video Entity ===');
      const video = this.videoRepository.create({
        name: publicId,
        originalName: file.originalname || 'Untitled Video',
        url: result.secure_url,
        format: result.format,
        size: result.bytes,
        duration: result.duration || 0,
        createdAt: new Date(),
      });
      console.log('Video entity before save:', JSON.stringify(video, null, 2));

      // Save to database
      console.log('\n=== Saving to Database ===');
      const savedVideo = await this.videoRepository.save(video);
      console.log('Saved video:', JSON.stringify(savedVideo, null, 2));

      console.log('\n=== Upload Complete ===');
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Video uploaded successfully',
        data: {
          public_id: publicId,
          url: result.secure_url,
          format: result.format,
          size: result.bytes,
          duration: result.duration || 0,
        },
      };
    } catch (error) {
      console.error('\n=== Upload Error ===');
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Upload failed',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll() {
    const videos = await this.videoRepository.find();
    console.log(videos);

    return videos;
  }

  async findOne(name: string) {
    return this.videoRepository.findOne({ where: { name } });
  }

  async getThumbnailUrl(videoName: string) {
    const video = await this.findOne(videoName);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Generate thumbnail URL using Cloudinary
    const thumbnailUrl = this.cloudinaryService.url(video.name, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        { width: 400, height: 225, crop: 'fill' },
        { quality: 'auto' },
      ],
    });

    return thumbnailUrl;
  }
}
