import express from 'express';
import {auth, register} from '../controller/auth.controller.js';

const router = express.Router();

router.post('/auth', auth);
router.post('/register', register);

export default router;

