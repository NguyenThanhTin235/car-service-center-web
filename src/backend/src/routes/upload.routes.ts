import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// Endpoint: POST /api/upload
router.post('/', upload.single('image'), UploadController.uploadImage);

export default router;
