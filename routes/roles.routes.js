import express from 'express';
import RolesController  from '../controller/roles.controller.js'
import { authenticateToken } from "../middleware/authenticateToken.js";

const rolesController = RolesController
const router = express.Router();


router.use(authenticateToken)
router.get('/', rolesController.getAllRoles)
export default router;