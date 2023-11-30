import { client, Prisma } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dbErrorsHandler from "../utils/dbErrorsHandler.js";

const saltRounds = 10;
const secret = process.env.SECRET;

const generateAuthToken = function (id) {
    return jwt.sign({id: id}, secret
        //     , {
        //     expiresIn: '300000'
        // }
    );
};

const isUsernameExist = async (res, username) => {
    try {
        const user = await client.user.findUnique({
            where: {
                username: username,
            },
        });
        return !!user;
    } catch (e) {
        res.status(500).json({error: dbErrorsHandler(e)})
        return
    }
}

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
        } else {
            res.json({error: 'Неверное имя пользователя или пароль'})
        }
    }

    async register(req, res) {
        const {first_name, middle_name, last_name, username, password, about} = req.body;
        const encryptedPassword = await bcrypt.hash(password, saltRounds)

        if (await isUsernameExist(res, username)) {
            res.status(409).json({error: 'Данный username уже занят'})
            return
        }

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
            res.status(500).json({error: dbErrorsHandler(e)})
            return
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
