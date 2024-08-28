import { client } from "../db.js";
import dbErrorsHandler from "../utils/dbErrorsHandler.js";

class RolesController {
    async getAllRoles(req, res) {
        try {
            const roles = await client.roles.findMany({
                include: {
                    permissions: true
                }
            });
            res.json(roles);
        } catch (error) {
            console.error("Error fetching all roles:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }

    async createRole(req, res) {
        try {
            const { code, name, permissions } = req.body;
            const role = await client.roles.create({
                data: {
                    code,
                    name,
                    permissions: {
                        connect: permissions.map(permission => ({ id: permission.id }))
                    }
                },
                include: {
                    permissions: true
                }
            });
            res.status(201).json(role);
        } catch (error) {
            console.error("Error creating role:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async deleteRoles(req, res) {
        try {
            const { ids } = req.body;
            const deletedRoles = await client.roles.deleteMany({
                where: {
                    id: {
                        in: ids
                    }
                }
            });
            res.json(deletedRoles);
        } catch (error) {
            console.error("Error deleting roles:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async updateRole(req, res) {
        try {
            const { roleId } = req.params;
            const { code, name, permissions } = req.body;
            const role = await client.roles.update({
                where: { id: parseInt(roleId) },
                data: {
                    code,
                    name,
                    permissions: {
                        set: permissions.map(permission => ({ id: permission.id }))
                    }
                },
                include: {
                    permissions: true
                }
            });
            res.json(role);
        } catch (error) {
            console.error("Error updating role:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async deleteRolePermission(req, res) {
        try {
            const { roleId } = req.params;
            const { ids } = req.body;
            const role = await client.roles.update({
                where: { id: parseInt(roleId) },
                data: {
                    permissions: {
                        disconnect: ids.map(id => ({ id }))
                    }
                },
                include: {
                    permissions: true
                }
            });
            res.json(role);
        } catch (error) {
            console.error("Error deleting role permissions:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async addPermissionsToRole(req, res) {
        try {
            const { roleId } = req.params;
            const { ids } = req.body;
            const role = await client.roles.update({
                where: { id: parseInt(roleId) },
                data: {
                    permissions: {
                        connect: ids.map(id => ({ id }))
                    }
                },
                include: {
                    permissions: true
                }
            });
            res.json(role);
        } catch (error) {
            console.error("Error adding permissions to role:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}

export default new RolesController()