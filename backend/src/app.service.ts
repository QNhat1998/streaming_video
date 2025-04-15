import { Injectable } from '@nestjs/common';

/**
 * AppService là service gốc của ứng dụng
 *
 * Vòng đời của service:
 * 1. Được khởi tạo khi AppModule được load
 * 2. Được inject vào AppController
 * 3. Tồn tại trong suốt vòng đời của ứng dụng (singleton)
 * 4. Tự động cleanup khi ứng dụng kết thúc
 *
 * Chức năng:
 * - Cung cấp các phương thức cơ bản cho AppController
 * - Có thể được mở rộng để thêm các chức năng chung cho toàn bộ ứng dụng
 */
@Injectable()
export class AppService {
  /**
   * Trả về thông điệp chào mừng
   * @returns Chuỗi 'Hello World!'
   */
  getHello(): string {
    return 'Hello World!';
  }
}
