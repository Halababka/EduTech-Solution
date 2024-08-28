import express from 'express';
import RolesController  from '../controller/roles.controller.js'
import { authenticateToken } from "../middleware/authenticateToken.js";

const rolesController = RolesController
const router = express.Router();


router.use(authenticateToken)
router.get('/', rolesController.getAllRoles)
router.post('/', RolesController.createRole);
router.delete('', RolesController.deleteRoles);
router.put('/:roleId', RolesController.updateRole);
router.delete('/:roleId/permissions', RolesController.deleteRolePermission);
router.post('/:roleId/permissions', RolesController.addPermissionsToRole);

export default router;