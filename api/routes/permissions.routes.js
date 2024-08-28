import express from 'express';
import PermissionsController  from '../controller/permissions.controller.js'
import { authenticateToken } from "../middleware/authenticateToken.js";
import RolesController from "../controller/roles.controller.js";

const rolesController = RolesController
const router = express.Router();


router.use(authenticateToken)
router.get('/', PermissionsController.fetchPermissions);

export default router;