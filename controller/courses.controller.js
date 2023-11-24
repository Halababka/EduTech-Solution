import { client, Prisma } from "../db.js";
import bcrypt from "bcrypt";

const saltRounds = 10;

class CoursesController {

    async allCourses(req, res) {
        let allCourses;

        try {
            allCourses = await client.courses.findMany();

        } catch (e) {
            res.json({error: "Неизвестная ошибка"});
        }

        res.json(allCourses);
    }

    async newCourses(req, res) {
        const {name} = req.body;

        let newCourses;

        try {
            newCourses = await client.courses.create({
                data: {
                    name: name
                }
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                switch (e.code) {
                    case "P2002":
                        res.json({error: ""});
                        return;
                    case "P1001":
                        res.json({error: "Нет подключения с БД"});
                        return;
                    default:
                        res.json({error: "Необрабатываемая ошибка"});
                        return;
                }
            } else res.json({error: "Неизвестная ошибка"});
        }

        res.json(newCourses);
    }

    async register(req, res) {
        const {first_name, middle_name, last_name, username, password, about} = req.body;
        const encryptedPassword = await bcrypt.hash(password, saltRounds);


        let newUser;
        try {
            newUser = await client.user.create({
                data: {
                    first_name: first_name,
                    middle_name: middle_name,
                    last_name: last_name,
                    username: username,
                    password: encryptedPassword,
                    about: about
                }
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                switch (e.code) {
                    case "P2002":
                        res.json({error: "Пользователь с такими данными уже создан (username должен быть уникальным)"});
                        return;
                    case "P1001":
                        res.json({error: "Нет подключения с БД"});
                        return;
                    default:
                        res.json({error: "Необрабатываемая ошибка"});
                        return;
                }
            } else res.json({error: "Неизвестная ошибка"});
        }

        res.json(newUser);
    }
}

// Это предложил чатгпт я хз в правильности этого решения
export const allCourses = async (req, res) => {
    const controller = new CoursesController();
    await controller.allCourses(req, res);
};
export const newCourses = async (req, res) => {
    const controller = new CoursesController();
    await controller.newCourses(req, res);
};
// export default new AuthController();
