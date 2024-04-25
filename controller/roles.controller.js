import { client } from "../db.js";
import dbErrorsHandler from "../utils/dbErrorsHandler.js";

class RolesController {
    async getAllRoles(req, res) {
        try {
            const roles = await client.roles.findMany();
            res.json(roles);
        } catch (error) {
            console.error("Error fetching all roles:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }
}

export default new RolesController()