import express from 'express';
import { FileController } from '../controller/file.controller.js';

const filesController = new FileController();
const router = express.Router();

router.post('/upload', filesController.uploadFile);

export default router;