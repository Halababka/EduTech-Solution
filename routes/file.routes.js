import express from 'express';
import { FileController } from '../controller/file.controller.js';
import { authenticateToken } from "../middleware/authenticateToken.js";

const filesController = new FileController();
const router = express.Router();

router.use(authenticateToken)
router.post('/upload', filesController.uploadFile);

export default router;