import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * AppController là controller gốc của ứng dụng
 *
 * Vòng đời của controller:
 * 1. Được khởi tạo khi AppModule được load
 * 2. Được inject AppService thông qua constructor
 * 3. Xử lý các request trong suốt vòng đời của ứng dụng
 * 4. Tự động cleanup khi ứng dụng kết thúc
 *
 * Các endpoint:
 * - GET /: Trả về thông điệp chào mừng
 */
@Controller() // Không có prefix path, sẽ xử lý các request đến root path
export class AppController {
  constructor(private readonly appService: AppService) {} // Inject AppService

  /**
   * Xử lý request GET đến root path (/)
   * @returns Chuỗi chào mừng từ AppService
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
