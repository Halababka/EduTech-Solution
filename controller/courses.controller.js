import {client} from "../db.js";
import dbErrorsHandler from "../utils/dbErrorsHandler.js";

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

    async newCourse(req, res) {
        const {name} = req.body;

        let newCourses;

        try {
            newCourses = await client.courses.create({
                data: {
                    name: name
                }
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)});
            return;
        }

        res.json(newCourses);
    }
}