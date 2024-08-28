import express from 'express';
import { AuthController } from '../controller/auth.controller.js';
import { authenticateToken } from "../middleware/authenticateToken.js";

const authController = new AuthController();
const router = express.Router();

router.post('/auth', authController.auth);
router.post('/register', authController.register);
router.post('/refresh', authController.refreshToken)
router.post('/logout', authController.logout)

export default router;

