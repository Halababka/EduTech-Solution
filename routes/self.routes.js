import express from 'express';
import {SelfController} from '../controller/self.controller.js';

const selfController = new SelfController();
const router = express.Router();
import {authenticateToken} from '../middleware/authenticateToken.js'

router.use(authenticateToken)
router.get('/', selfController.myself);
export default router;