import express from 'express';
import  GroupsController  from '../controller/gpoups.controller.js'
import {authenticateToken} from '../middleware/authenticateToken.js'

const groupsController = GroupsController
const router = express.Router();


router.use(authenticateToken)
router.get('/', groupsController.getAllGroups)
router.get('/:groupId',groupsController.getGroupById)
router.get('/:groupId/users', groupsController.getUsersInGroup)
export default router;