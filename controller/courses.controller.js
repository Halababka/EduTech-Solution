import { client } from "../db.js";
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

    async getCourse(req, res) {
        const id = parseInt(req.params.id);

        let course;

        try {
            course = await client.courses.findUnique({
                where: {
                    id: id
                }
            });

        } catch (e) {
            res.json({error: "Неизвестная ошибка"});
        }

        res.json(course);
    }

    async newCourse(req, res) {
        const {image_url, name, description, starts_at, ends_at} = req.body;

        let newCourses;

        try {
            newCourses = await client.courses.create({
                data: {
                    image_url: image_url,
                    name: name,
                    description: description,
                    // chapters: null,
                    // materials: null,
                    starts_at: starts_at,
                    ends_at: ends_at,
                    // categories: null
                }
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)});
            return;
        }

        res.json(newCourses);
    }

    async deleteCourse(req, res) {
        const id = parseInt(req.params.id);

        let deleteCourse;

        try {
            deleteCourse = await client.courses.delete({
                where: {
                    id: id
                }
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)});
            return;
        }

        res.json(deleteCourse);

    }
}