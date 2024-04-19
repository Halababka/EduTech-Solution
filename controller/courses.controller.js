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
        let {image_url, name, description, starts_at, ends_at, sections, materials} = req.body;
        const user_id = req.user.id;

        let newCourses;

        try {
            name = name.trim();
            description = description.trim();

            newCourses = await client.courses.create({
                data: {
                    image_url: image_url,
                    name: name,
                    description: description,
                    sections: {
                        create: sections.map(chapter => ({
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
                    ends_at: ends_at
                    // categories: null
                }
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)});
            return;
        }

        res.json(newCourses);
    }

    async createCourse(req, res) {
        try {
            const {
                name,
                description,
                imageUrl,
                startsAt,
                endsAt,
                durationHours,
                categories,
                active,
                sections,
                enrolledStudents,
                courseOwners
            } = req.body;

            // Проверка наличия обязательных параметров
            if (!name) {
                return res.status(400).json({error: "Name is required"});
            }

            // Создание курса
            const courseData = {
                name,
                description,
                image_url: imageUrl,
                starts_at: startsAt,
                ends_at: endsAt,
                duration_hours: durationHours,
                active,
                sections: {
                    createMany: {
                        data: sections.map(section => ({
                            name: section.name,
                            description: section.description,
                            unlocks_at: section.unlocks_at,
                            section_content: section.sectionContent // Если свойство sectionContent существует, передайте его как есть
                                ? {
                                    create: section.sectionContent.map(content => ({
                                        title: content.title,
                                        content: content.content
                                    }))
                                }
                                : undefined // Иначе передайте undefined
                        }))
                    }
                },
                enrolled_students: {connect: enrolledStudents.map(student => ({id: student}))},
                course_owners: {connect: courseOwners.map(owner => ({id: owner}))},
                categories: {connect: categories.map(category => ({id: category}))}
            };

            const createdCourse = await client.courses.create({
                data: courseData,
                include: {
                    sections: true,
                    enrolled_students: true,
                    course_owners: true
                }
            });

            // Отправка созданного курса в ответ
            res.status(201).json(createdCourse);
        } catch (error) {
            console.error("Error creating course:", error);
            res.status(500).json({error: "Error creating course"});
        }
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