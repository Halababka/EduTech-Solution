import express from 'express';
import { UserController } from '../controller/user.controller.js';

const userController = new UserController();
const router = express.Router();
import { authenticateToken } from '../middleware/authenticateToken.js'

router.get('/me', authenticateToken, userController.myself);

export default router;

