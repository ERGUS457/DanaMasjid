import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { guestOnly } from '../middleware/auth.js';

const router = Router();

router.get('/login', guestOnly, AuthController.showLogin);
router.post('/login', guestOnly, AuthController.handleLogin);

router.get('/register', guestOnly, AuthController.showRegister);
router.post('/register', guestOnly, AuthController.handleRegister);

router.all('/logout', AuthController.handleLogout);

export default router;
