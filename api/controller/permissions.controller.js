import { client } from "../db.js";
import dbErrorsHandler from "../utils/dbErrorsHandler.js";

class PermissionsController {
    async fetchPermissions(req, res) {
        try {
            const permissions = await client.permissions.findMany();
            res.json(permissions);
        } catch (error) {
            console.error("Error fetching permissions:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }
}

export default new PermissionsController()