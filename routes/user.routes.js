import express from 'express';
import {UserController} from '../controller/user.controller.js';

const userController = new UserController();
const router = express.Router();
import {authenticateToken} from '../middleware/authenticateToken.js'

router.use(authenticateToken)
router.get('/', userController.getAllUsers)
router.get('/:userId', userController.getUserById)
router.get('/:userId/courses', userController.getCoursesByUserId);
router.get('/:userId/groups', userController.getGroupsByUserId);
router.get('/:userId/materials', userController.getMaterialsByUserId);
router.get('/:userId/owned-courses');
router.get('/:userId/roles');
router.get('/:userId/permissions');
router.get('/:userId/favorites');
router.get('/:userId/available-materials');
export default router;