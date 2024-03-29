import { client } from "../db.js";

export class Users {
    async get(user_id) {
        let user;
        try {
            user = await client.user.findUnique({
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    middle_name: true,
                    username: true,
                    about: true,
                    groups: true,
                    role: {
                        include: {
                            permissions: true
                        }
                    }
                },
                where: {
                    id: user_id
                }
            });
        } catch (e) {
            return {error: e.name};
        }
        return user;
    }
}