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
        let {image_url, name, description, starts_at, ends_at, chapters, materials} = req.body;
        const user_id = req.user.id;

        let newCourses;

        try {
            name = name.trim()
            description = description.trim()

            newCourses = await client.courses.create({
                data: {
                    image_url: image_url,
                    name: name,
                    description: description,
                    chapters: {
                        create: chapters.map(chapter => ({
                            name: chapter.name,
                            description: chapter.description,
                            unlocks_at: chapter.unlocks_at,
                            materials: {
                                create: chapter.materials.map(material => ({
                                    name: material.name,
                                    description: material.description,
                                    mime_type: material.mime_type,
                                    path: material.path,
                                    size: material.size,
                                    userId: user_id
                                }))
                            }
                        }))
                    },
                    // materials: {
                    //     create: materials.map(material => ({
                    //         name: material.name,
                    //         description: material.description,
                    //         mime_type: material.mime_type,
                    //         path: material.path,
                    //         size: material.size,
                    //         userId: user_id
                    //     }))
                    // },
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

    async getCoursesByUserId(req, res) {
        const userId = req.user.id;

        try {
            const user = await client.user.findUnique({
                where: { id: parseInt(userId) },
                include: { enrolledCourses: true },
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ courses: user.enrolledCourses });
        } catch (error) {
            console.error('Error fetching courses for the user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}