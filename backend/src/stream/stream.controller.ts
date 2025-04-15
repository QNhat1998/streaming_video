import {
  Controller,
  Get,
  Param,
  Res,
  Headers,
  Post,
  UseInterceptors,
  UploadedFile,
  Header,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { StreamService } from './stream.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Video } from './entities/video.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * StreamController xử lý các request HTTP liên quan đến video
 *
 * Vòng đời của controller:
 * 1. Được khởi tạo khi module được load
 * 2. Được inject các dependencies (StreamService, CloudinaryService)
 * 3. Xử lý các request trong suốt vòng đời của ứng dụng
 * 4. Tự động cleanup khi ứng dụng kết thúc
 */
@Controller('stream') // Base path cho tất cả các route trong controller
export class StreamController {
  constructor(
    private readonly streamService: StreamService,
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  /**
   * Endpoint GET /stream/:videoName
   * Xử lý request streaming video
   *
   * @param videoName - Tên file video
   * @param range - Header Range từ client để hỗ trợ streaming
   * @param res - Response object để gửi stream về client
   */
  @Get(':videoName')
  async getVideo(@Param('videoName') videoName: string, @Res() res: Response) {
    try {
      const range = res.req.headers.range;
      if (!range) {
        throw new BadRequestException('Range header is required');
      }

      const result = await this.streamService.getVideoStream(videoName, range);

      res.writeHead(206, result.headers);
      res.end(Buffer.from(result.videoBuffer));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Endpoint POST /stream/upload
   * Xử lý request upload video
   *
   * @param file - File video từ request
   * @returns Object chứa thông tin về video đã upload
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    console.log('Upload request received:', file);

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Upload to Cloudinary
      console.log('Uploading to Cloudinary...');
      const result = await this.cloudinaryService.uploadVideo(file);
      console.log('Cloudinary upload result:', result);

      // Tách public_id để lưu vào database
      const publicId = result.public_id.split('/').pop();
      if (!publicId) {
        throw new Error('Invalid public_id from Cloudinary');
      }

      // Save video info to database
      const video = new Video();
      video.name = publicId; // Lưu public_id không có folder
      video.originalName = file.originalname || 'Untitled Video'; // Thêm originalName
      video.url = result.secure_url;
      video.format = result.format;
      video.size = result.bytes;
      video.duration = result.duration || 0;
      video.createdAt = new Date();

      console.log('Saving video to database:', video);
      await this.videoRepository.save(video);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Video uploaded successfully',
        data: {
          public_id: publicId, // Trả về public_id không có folder
          url: result.secure_url,
          format: result.format,
          size: result.bytes,
          duration: result.duration || 0,
        },
      };
    } catch (error) {
      console.error('Upload error:', error);
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

  @Get('video/:videoName')
  @Header('Accept-Ranges', 'bytes')
  async getVideoStream(
    @Param('videoName') videoName: string,
    @Headers('range') range: string,
    @Res() res: Response,
  ) {
    if (!range) {
      throw new BadRequestException('Range header is required');
    }

    const result = await this.streamService.getVideoStream(videoName, range);
    res.writeHead(206, result.headers);
    res.end(Buffer.from(result.videoBuffer));
  }

  @Get('info/:videoName')
  async getVideoInfo(@Param('videoName') videoName: string) {
    try {
      console.log('Getting info for video:', videoName);

      // Tìm video theo public_id (name)
      const video = await this.videoRepository.findOne({
        where: { name: videoName },
      });

      console.log('Found video:', video);

      if (!video) {
        console.log('Video not found in database');
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Video not found',
          error: 'Not Found',
        });
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Video found',
        data: {
          name: video.name,
          originalName: video.originalName,
          url: video.url,
          format: video.format,
          size: video.size,
          duration: video.duration,
          createdAt: video.createdAt,
        },
      };
    } catch (error) {
      console.error('Error getting video info:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Failed to get video info',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('videos')
  async getVideos() {
    try {
      const videos = await this.streamService.findAll();

      return {
        statusCode: 200,
        message: 'Success',
        data: videos,
      };
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Error fetching videos',
          error: error.message,
        },
        500,
      );
    }
  }

  @Get('thumbnail/:videoName')
  async getThumbnail(@Param('videoName') videoName: string) {
    try {
      const video = await this.streamService.findOne(videoName);
      if (!video) {
        throw new NotFoundException('Video not found');
      }

      const thumbnailUrl = await this.streamService.getThumbnailUrl(videoName);
      return {
        statusCode: 200,
        message: 'Success',
        data: {
          thumbnailUrl,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Error getting thumbnail',
          error: error.message,
        },
        500,
      );
    }
  }
}
