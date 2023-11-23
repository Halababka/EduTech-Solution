import { client, Prisma } from '../db.js';

class AuthController {
    async auth(req, res) {
        const {username, password} = req.body;

        res.json({nickname, password});
    }

    async register(req, res) {
        const {first_name, middle_name, last_name, username, about} = req.body;

        let newUser;
        try {
            newUser = await client.user.create({
                data: {
                    first_name: first_name,
                    middle_name: middle_name,
                    last_name: last_name,
                    username: username,
                    about: about,
                },
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                switch (e.code) {
                    case 'P2002':
                        res.json({error: 'Пользователь с такими данными уже создан (username должен быть уникальным)'})
                        return
                    case 'P1001':
                        res.json({error: 'Нет подключения с БД'})
                        return
                    default:
                        res.json({error: 'Необрабатываемая ошибка'})
                        return
                }
            } else res.json({error: 'Неизвестная ошибка'})
        }

        res.json(newUser);
    }
}

// Это предложил чатгпт я хз в правильности этого решения
export const auth = async (req, res) => {
    const controller = new AuthController();
    await controller.auth(req, res);
};
export const register = async (req, res) => {
    const controller = new AuthController();
    await controller.register(req, res);
};

// export default new AuthController();
