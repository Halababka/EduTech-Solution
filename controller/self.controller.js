import {DB} from "../db/db.js";

const db = new DB()

export class SelfController {
    async myself(req, res) {
        const user_id = req.user.id;

        res.json(await db.getUser(user_id));
    }
}