import { client, Prisma } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const saltRounds = 10;
const secret = process.env.SECRET;

const generateAuthToken = function (id) {
    return jwt.sign({id: id}, secret
        //     , {
        //     expiresIn: '300000'
        // }
    );
};

class AuthController {
    async auth(req, res) {
        const {username, password} = req.body;

        if (!username || !password) {
            res.json({error: 'Логин или пароль не может быть пустой'})
            return
        }

        const user = await client.user.findUnique({
            where: {
                username: username,
            },
        });

        if (user && await bcrypt.compare(password, user.password)) {
            res.json({token: generateAuthToken(user.id)})
            return
        } else {
            res.json({error: 'Неверное имя пользователя или пароль'})
            return
        }
    }

    async register(req, res) {
        const {first_name, middle_name, last_name, username, password, about} = req.body;
        const encryptedPassword = await bcrypt.hash(password, saltRounds)


        let newUser;
        try {
            newUser = await client.user.create({
                data: {
                    first_name: first_name,
                    middle_name: middle_name,
                    last_name: last_name,
                    username: username,
                    password: encryptedPassword,
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
