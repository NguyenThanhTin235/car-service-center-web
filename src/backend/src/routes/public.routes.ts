import { Router } from 'express';
import { publicController } from '../controllers/public.controller';

const router = Router();

router.get('/categories', publicController.getServiceCategories.bind(publicController));
router.get('/services', publicController.getServices.bind(publicController));
router.post('/web-vitals', publicController.recordWebVitals.bind(publicController));

export default router;
