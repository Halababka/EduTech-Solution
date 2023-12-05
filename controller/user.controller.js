import { client } from "../db.js";

const saltRounds = 10;

export class UserController {
    async myself(req, res) {
        const userId = req.user.id;
        let myself;

        try {
            myself = await client.user.findUnique({
                select: {
                    role: true
                },
                where: {
                    id: userId,
                }
                });
        } catch (e) {
            res.json({error: "Неизвестная ошибка"});
        }

        res.json(myself);
    }
}