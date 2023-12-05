import { client } from "../db.js";
import bcrypt from "bcrypt";
import dbErrorsHandler from "../utils/dbErrorsHandler.js";

const saltRounds = 10;

export class CoursesController {

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
            res.status(500).json({error: dbErrorsHandler(e)})
            return
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
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        res.json(newUser);
    }
}