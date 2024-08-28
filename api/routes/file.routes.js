import express from 'express';
import { FileController } from '../controller/file.controller.js';
import { authenticateToken } from "../middleware/authenticateToken.js";

const filesController = new FileController();
const router = express.Router();

router.use(authenticateToken)
router.get('/', filesController.getAllFiles);
router.get('/:fileId/download', filesController.downloadFile);
router.post('/upload', filesController.uploadFiles);
router.delete('/delete', filesController.deleteFiles);

export default router;