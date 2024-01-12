import {DB} from "../db/db.js";

const db = new DB()

function roleFormat(obj) {
    return obj.role.permissions.map((permission) => {
        return {
            id: permission.id,
            name: permission.name,
        };
    });
}

export class SelfController {
    async myself(req, res) {
        const user_id = req.user.id;
        let user = await db.getUser(user_id)
        user.permissions = roleFormat(user)
        delete user.role
        res.json(user);
    }
}