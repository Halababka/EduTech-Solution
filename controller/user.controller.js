import { client } from "../db.js";

const saltRounds = 10;

export class UserController {
    async myself(req, res) {
        const userId = req.user.id;
        let myself;

        try {
            myself = await client.user.findUnique({
                select: {
                    first_name: true,
                    last_name: true,
                    middle_name: true,
                    username: true,
                    about: true,
                    group: true,
                    role: true
                },
                where: {
                    id: userId
                }
            });
        } catch (e) {
            res.json({error: "Неизвестная ошибка"});
        }

        res.json(myself);
    }

    async rolePermissions(req, res) {
        let permissions;
        const {role_id} = req.query;
        try {
            if (role_id !== undefined) {
                permissions = await client.rolesToPermissions.findMany({
                    select: {
                        permissions: true
                    },
                    where: {
                        roles_id: role_id
                    }
                });

                res.json(permissions);
            } else {
                res.json({error: "Нопределенное значение в параметре"});
            }
        } catch (e) {
            res.json({error: "Неизвестная ошибка"});
        }
    }

}