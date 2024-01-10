import {DB} from "../db/db.js";

const db = new DB()

export class TestsController {
    async getTest(req, res) {
        res.json(1);
    }
}