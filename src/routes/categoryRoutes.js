import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', CategoryController.index);
router.post('/', CategoryController.create);
router.post('/:id/delete', CategoryController.delete);

export default router;
