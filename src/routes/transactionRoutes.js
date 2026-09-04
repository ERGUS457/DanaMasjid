import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', TransactionController.index);
router.post('/', TransactionController.create);
router.post('/:id/edit', TransactionController.update);
router.post('/:id/delete', TransactionController.delete);

export default router;
