import express from 'express';
import { AuthController } from '../controller/auth.controller.js';

const authController = new AuthController();
const router = express.Router();

router.post('/auth', authController.auth);
router.post('/register', authController.register);

export default router;

