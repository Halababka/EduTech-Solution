import {DB} from "../db/db.js";

const db = new DB()

export class UserController {
    async getUser(req, res) {
        const user_id = parseInt(req.params.user_id);
        res.json(await db.getUser(user_id));
    }
}