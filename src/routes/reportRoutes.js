import { Router } from 'express';
import { ReportController } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', ReportController.index);
router.get('/cetak', ReportController.printView);
router.get('/pdf', ReportController.exportPdf);
router.get('/csv', ReportController.exportCsv);

export default router;
