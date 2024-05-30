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
        try {
            const id = parseInt(req.params.id);

            const course = await client.courses.findUnique({
                where: {
                    id: id
                },
                include: {
                    sections: {
                        include: {
                            section_content: {
                                include: {
                                    materials: true
                                }
                            }
                        }
                    },
                    enrolled_students: true,
                    course_owners: true,
                    categories: true
                }
            });

            res.json(course);
        } catch (e) {
            res.json({error: "Неизвестная ошибка"});
        }
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
            const user_id = req.user.id;
            const {
                name,
                description,
                imageUrl,
                startDate,
                endDate,
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
                starts_at: startDate ? startDate : undefined,
                ends_at: endDate ? endDate : undefined,
                duration_hours: durationHours,
                active,
                sections: {
                    create: sections.map(section => ({
                        name: section.name,
                        description: section.description,
                        unlocks_at: section.unlocks_at,
                        subsections: section.subsections ? {
                            create: section.subsections.map(subsection => ({
                                name: subsection.name,
                                description: subsection.description,
                                unlocks_at: subsection.unlocks_at,
                                section_content: subsection.contents ? {
                                    create: subsection.contents.map(content => {
                                        const contentData = {};
                                        if (content.title) contentData.title = content.title;
                                        if (content.content) contentData.content = content.content;
                                        if (content.urlItem) contentData.urlItem = content.urlItem;
                                        if (content.urlVideo) contentData.urlVideo = content.urlVideo;
                                        if (content.folder) {
                                            contentData.folder = {
                                                create: {
                                                    name: content.folder.name,
                                                    materials: {
                                                        connect: content.folder.materials.map(material => ({id: material.id}))
                                                    }
                                                }
                                            }
                                        }
                                        if (content.materials && content.materials.length > 0) {
                                            contentData.materials = {
                                                connect: content.materials.map(material => ({id: material.id}))
                                            };
                                        }
                                        return contentData;
                                    })
                                } : undefined
                            }))
                        } : undefined,
                        section_content: section.contents ? {
                            create: section.contents.map(content => {
                                const contentData = {};
                                if (content.title) contentData.title = content.title;
                                if (content.content) contentData.content = content.content;
                                if (content.urlItem) contentData.urlItem = content.urlItem;
                                if (content.urlVideo) contentData.urlVideo = content.urlVideo;
                                if (content.folder) {
                                    contentData.folder = {
                                        create: {
                                            name: content.folder.name,
                                            materials: {
                                                connect: content.folder.materials.map(material => ({id: material.id}))
                                            }
                                        }
                                    }
                                }
                                if (content.materials && content.materials.length > 0) {
                                    contentData.materials = {
                                        connect: content.materials.map(material => ({id: material.id}))
                                    };
                                }
                                return contentData;
                            })
                        } : undefined
                    }))
                },
                enrolled_students: enrolledStudents ? {connect: enrolledStudents.map(student => ({id: student}))} : {connect: {id: user_id}},
                course_owners: courseOwners ? {connect: courseOwners.map(owner => ({id: owner}))} : {connect: {id: user_id}},
                categories: categories ? {connect: categories.map(category => ({id: category.id}))} : undefined
            };

            const createdCourse = await client.courses.create({
                data: courseData,
                include: {
                    sections: {
                        include: {
                            subsections: {
                                include: {
                                    section_content: {
                                        include: {
                                            materials: true
                                        }
                                    }
                                }
                            },
                            section_content: {
                                include: {
                                    materials: true
                                }
                            }
                        }
                    },
                    enrolled_students: true,
                    course_owners: true,
                    categories: true
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

    async deleteCourses(req, res) {
        try {
            const {ids} = req.body;
            await client.courses.deleteMany({
                where: {
                    id: {in: ids.map(id => parseInt(id))}
                }
            });

            res.status(200).json("success");
        } catch (error) {
            console.error("Error deleting courses:", error);
            res.status(500).json({error: "Error deleting courses"});
        }
    }
}