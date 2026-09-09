import { Request, Response } from 'express';
import { UploadService } from '../services/upload.service';

export class UploadController {
  static async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Không tìm thấy file ảnh' });
        return;
      }
      
      const folder = req.body.folder || 'car_service/general';
      const secureUrl = await UploadService.uploadImage(req.file.buffer, folder);
      
      res.status(200).json({
        message: 'Tải ảnh lên thành công',
        url: secureUrl
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Lỗi server khi upload ảnh' });
    }
  }
}
