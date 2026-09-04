import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', SettingsController.index);
router.post('/masjid', SettingsController.updateMasjid);
router.post('/profil', SettingsController.updateProfile);
router.post('/password', SettingsController.updatePassword);

export default router;
