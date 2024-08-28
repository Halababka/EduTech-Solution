import { client } from "../db.js";
import dbErrorsHandler from "../utils/dbErrorsHandler.js";
import { sendNotificationToUser, sendNotificationToUsers } from "../notificationSocket.js";


export class CoursesController {

    async allCourses(req, res) {
        try {
            const allCourses = await client.courses.findMany();
            res.json(allCourses);
        } catch (e) {
            res.json({error: "Неизвестная ошибка"});
        }
    }

    async getCourse(req, res) {
        try {
            const id = parseInt(req.params.id);
            const user_id = req.user.id;

            const course = await client.courses.findUnique({
                where: {
                    id: id
                },
                include: {
                    sections: {
                        include: {
                            subsections: {
                                include: {
                                    section_content: {
                                        include: {
                                            materials: true,
                                            folders: {
                                                include: {materials: true}
                                            },
                                            tasks: {
                                                include: {
                                                    materials: true,
                                                    StudentAssignments: {
                                                        include: {
                                                            materials: true,
                                                            reviewer: true
                                                        },
                                                        where: {userId: user_id}
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            section_content: {
                                include: {
                                    materials: true,
                                    folders: {
                                        include: {materials: true}
                                    },
                                    tasks: {
                                        include: {
                                            materials: true,
                                            StudentAssignments: {
                                                include: {
                                                    materials: true,
                                                    reviewer: true
                                                },
                                                where: {userId: user_id}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    enrolled_students: {
                        include: {groups: true}
                    },
                    course_owners: {
                        include: {groups: true}
                    },
                    categories: true
                }
            });

            // Формируем поле fullname для каждого студента
            course.enrolled_students = course.enrolled_students.map(student => ({
                ...student,
                fullname: `${student.last_name} ${student.first_name} ${student.middle_name || ""}`.trim()
            }));
            course.course_owners = course.course_owners.map(owner => ({
                ...owner,
                fullname: `${owner.last_name} ${owner.first_name} ${owner.middle_name || ""}`.trim()
            }));

            res.json(course);
        } catch (e) {
            res.json({error: "Неизвестная ошибка"});
        }
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
                return res.status(400).json({ error: "Name is required" });
            }

            // Создание курса
            const courseData = {
                name,
                description,
                image_url: imageUrl,
                starts_at: startDate || undefined,
                ends_at: endDate || undefined,
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
                                        if (content.folders && content.folders.length > 0) {
                                            contentData.folders = {
                                                create: content.folders.map(folder => ({
                                                    name: folder.name,
                                                    materials: {
                                                        connect: folder.materials.map(material => ({ id: material.id }))
                                                    }
                                                }))
                                            };
                                        }
                                        if (content.materials && content.materials.length > 0) {
                                            contentData.materials = {
                                                connect: content.materials.map(material => ({ id: material.id }))
                                            };
                                        }
                                        if (content.tasks && content.tasks.length > 0) {
                                            contentData.tasks = {
                                                create: content.tasks.map(task => ({
                                                    name: task.name,
                                                    text: task.text,
                                                    materials: {
                                                        connect: task.materials.map(material => ({ id: material.id }))
                                                    }
                                                }))
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
                                if (content.folders && content.folders.length > 0) {
                                    contentData.folders = {
                                        create: content.folders.map(folder => ({
                                            name: folder.name,
                                            materials: {
                                                connect: folder.materials.map(material => ({ id: material.id }))
                                            }
                                        }))
                                    };
                                }
                                if (content.materials && content.materials.length > 0) {
                                    contentData.materials = {
                                        connect: content.materials.map(material => ({ id: material.id }))
                                    };
                                }
                                if (content.tasks && content.tasks.length > 0) {
                                    contentData.tasks = {
                                        create: content.tasks.map(task => ({
                                            name: task.name,
                                            text: task.text,
                                            materials: {
                                                connect: task.materials.map(material => ({ id: material.id }))
                                            }
                                        }))
                                    };
                                }
                                return contentData;
                            })
                        } : undefined
                    }))
                },
                enrolled_students: enrolledStudents?.length > 0 ? { connect: enrolledStudents.map(student => ({ id: student.id })) } : { connect: { id: user_id } },
                course_owners: courseOwners?.length > 0 ? { connect: courseOwners.map(owner => ({ id: owner.id })) } : { connect: { id: user_id } },
                categories: categories ? { connect: categories.map(category => ({ id: category.id })) } : undefined
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
                                            materials: true,
                                            folders: {
                                                include: { materials: true }
                                            },
                                            tasks: {
                                                include: {
                                                    materials: true
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            section_content: {
                                include: {
                                    materials: true,
                                    folders: {
                                        include: {
                                            materials: true
                                        }
                                    },
                                    tasks: {
                                        include: {
                                            materials: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    enrolled_students: true,
                    course_owners: true,
                    categories: true
                }
            });

            // Отправка уведомлений, без ожидания их завершения (не гарантирует доставку, ускоряет время работы)
            // Для улучшения нужен менеджер очередей kafka

            // 1. Уведомления для всех участников курса
            if (enrolledStudents && enrolledStudents.length > 0) {
                const enrolledStudentsIds = enrolledStudents.map(student => student.id);
                const enrolledNotificationMessage = `Вы были записаны на курс "${name}"`;
                sendNotificationToUsers(enrolledStudentsIds, enrolledNotificationMessage);
            }

            // 2. Уведомления для всех владельцев курса, кроме начального user_id
            const courseOwnersIds = courseOwners && courseOwners.length > 0
                ? [...courseOwners.map(owner => owner.id), user_id]
                : [user_id];

            const courseOwnersNotificationMessage = `Вам были предоставлены права на курс "${name}"`;
            sendNotificationToUsers(courseOwnersIds, courseOwnersNotificationMessage);

            // Отправка созданного курса в ответ
            res.status(201).json(createdCourse);
        } catch (error) {
            console.error("Error creating course:", error);
            res.status(500).json({ error: "Error creating course" });
        }
    }

    async updateCourse(req, res) {
        try {
            const courseId = parseInt(req.params.id);
            const {
                name,
                description,
                imageUrl,
                startDate,
                endDate,
                duration_hours,
                categories,
                isActive,
                sections,
                enrolledStudents,
                courseOwners
            } = req.body;

            if (!courseId) {
                return res.status(400).json({ error: "Course ID is required" });
            }

            const courseData = {
                name,
                description,
                image_url: imageUrl,
                starts_at: startDate ? startDate : null,
                ends_at: endDate ? endDate : null,
                duration_hours: parseInt(duration_hours),
                active: isActive,
                enrolled_students: enrolledStudents ? { set: enrolledStudents.map(student => ({ id: student.id })) } : undefined,
                course_owners: courseOwners ? { set: courseOwners.map(owner => ({ id: owner.id })) } : undefined,
                categories: categories ? { set: categories.map(category => ({ id: category.id })) } : undefined
            };

            const updatedCourse = await client.courses.update({
                where: { id: courseId },
                data: courseData
            });

            // Gather all current sections and their contents
            const allSections = await client.sections.findMany({
                where: { coursesId: courseId },
                select: { id: true }
            });

            const allSectionContents = await client.sectionContents.findMany({
                where: { sectionsId: { in: allSections.map(section => section.id) } },
                select: { id: true }
            });

            const allSubsections = await client.sections.findMany({
                where: { parentId: { in: allSections.map(section => section.id) } },
                select: { id: true }
            });

            const allSubsectionContents = await client.sectionContents.findMany({
                where: { sectionsId: { in: allSubsections.map(subsection => subsection.id) } },
                select: { id: true }
            });

            // Gather IDs to keep
            const sectionIdsToKeep = sections.map(section => section.id).filter(id => id);
            const contentIdsToKeep = sections.flatMap(section => section.contents.map(content => content.id)).filter(id => id);
            const subsectionIdsToKeep = sections.flatMap(section => section.subsections.map(subsection => subsection.id)).filter(id => id);
            const subsectionContentIdsToKeep = sections.flatMap(section => section.subsections.flatMap(subsection => subsection.contents.map(content => content.id))).filter(id => id);

            // Detach or delete sections and contents that are not in the new data
            for (const section of allSections) {
                if (!sectionIdsToKeep.includes(section.id)) {
                    await client.sections.update({
                        where: { id: section.id },
                        data: {
                            coursesId: null
                        }
                    });
                }
            }

            for (const content of allSectionContents) {
                if (!contentIdsToKeep.includes(content.id)) {
                    await client.sectionContents.delete({
                        where: { id: content.id }
                    });
                }
            }

            for (const subsection of allSubsections) {
                if (!subsectionIdsToKeep.includes(subsection.id)) {
                    await client.sections.update({
                        where: { id: subsection.id },
                        data: {
                            parentId: null
                        }
                    });
                }
            }

            for (const content of allSubsectionContents) {
                if (!subsectionContentIdsToKeep.includes(content.id)) {
                    await client.sectionContents.delete({
                        where: { id: content.id }
                    });
                }
            }

            // Upsert sections and their contents
            for (const section of sections) {
                const updatedSection = await client.sections.upsert({
                    where: { id: section.id || 0 },
                    update: {
                        name: section.name,
                        description: section.description,
                        unlocks_at: section.unlocks_at,
                        coursesId: courseId
                    },
                    create: {
                        name: section.name,
                        description: section.description,
                        unlocks_at: section.unlocks_at,
                        coursesId: courseId
                    }
                });

                // Upsert contents within sections
                for (const content of section.contents) {
                    await client.sectionContents.upsert({
                        where: { id: content.id || 0 },
                        update: {
                            title: content.title,
                            content: content.content,
                            urlItem: content.urlItem,
                            urlVideo: content.urlVideo,
                            sectionsId: updatedSection.id,
                            folders: content.folders ? {
                                upsert: content.folders.map(folder => ({
                                    where: { id: folder.id || 0 },
                                    create: {
                                        name: folder.name,
                                        materials: {
                                            connect: folder.materials.map(material => ({ id: material.id }))
                                        }
                                    },
                                    update: {
                                        name: folder.name,
                                        materials: {
                                            connect: folder.materials.map(material => ({ id: material.id }))
                                        }
                                    }
                                }))
                            } : undefined,
                            materials: content.materials ? {
                                connect: content.materials.map(material => ({ id: material.id }))
                            } : undefined,
                            tasks: content.tasks ? {
                                upsert: content.tasks.map(task => ({
                                    where: { id: task.id || 0 },
                                    create: {
                                        name: task.name,
                                        text: task.text,
                                        materials: {
                                            connect: task.materials.map(material => ({ id: material.id }))
                                        }
                                    },
                                    update: {
                                        name: task.name,
                                        text: task.text,
                                        materials: {
                                            connect: task.materials.map(material => ({ id: material.id }))
                                        }
                                    }
                                }))
                            } : undefined
                        },
                        create: {
                            title: content.title,
                            content: content.content,
                            urlItem: content.urlItem,
                            urlVideo: content.urlVideo,
                            sectionsId: updatedSection.id,
                            folders: content.folders ? {
                                create: content.folders.map(folder => ({
                                    name: folder.name,
                                    materials: {
                                        connect: folder.materials.map(material => ({ id: material.id }))
                                    }
                                }))
                            } : undefined,
                            materials: content.materials ? {
                                connect: content.materials.map(material => ({ id: material.id }))
                            } : undefined,
                            tasks: content.tasks ? {
                                create: content.tasks.map(task => ({
                                    name: task.name,
                                    text: task.text,
                                    materials: {
                                        connect: task.materials.map(material => ({ id: material.id }))
                                    }
                                }))
                            } : undefined
                        }
                    });
                }

                // Upsert subsections within sections
                for (const subsection of section.subsections) {
                    const updatedSubsection = await client.sections.upsert({
                        where: { id: subsection.id || 0 },
                        update: {
                            name: subsection.name,
                            description: subsection.description,
                            unlocks_at: subsection.unlocks_at,
                            parentId: updatedSection.id
                        },
                        create: {
                            name: subsection.name,
                            description: subsection.description,
                            unlocks_at: subsection.unlocks_at,
                            parentId: updatedSection.id
                        }
                    });

                    // Upsert contents within subsections
                    for (const content of subsection.contents) {
                        await client.sectionContents.upsert({
                            where: { id: content.id || 0 },
                            update: {
                                title: content.title,
                                content: content.content,
                                urlItem: content.urlItem,
                                urlVideo: content.urlVideo,
                                sectionsId: updatedSubsection.id,
                                folders: content.folders ? {
                                    upsert: content.folders.map(folder => ({
                                        where: { id: folder.id || 0 },
                                        create: {
                                            name: folder.name,
                                            materials: {
                                                connect: folder.materials.map(material => ({ id: material.id }))
                                            }
                                        },
                                        update: {
                                            name: folder.name,
                                            materials: {
                                                connect: folder.materials.map(material => ({ id: material.id }))
                                            }
                                        }
                                    }))
                                } : undefined,
                                materials: content.materials ? {
                                    connect: content.materials.map(material => ({ id: material.id }))
                                } : undefined,
                                tasks: content.tasks ? {
                                    upsert: content.tasks.map(task => ({
                                        where: { id: task.id || 0 },
                                        create: {
                                            name: task.name,
                                            text: task.text,
                                            materials: {
                                                connect: task.materials.map(material => ({ id: material.id }))
                                            }
                                        },
                                        update: {
                                            name: task.name,
                                            text: task.text,
                                            materials: {
                                                connect: task.materials.map(material => ({ id: material.id }))
                                            }
                                        }
                                    }))
                                } : undefined
                            },
                            create: {
                                title: content.title,
                                content: content.content,
                                urlItem: content.urlItem,
                                urlVideo: content.urlVideo,
                                sectionsId: updatedSubsection.id,
                                folders: content.folders ? {
                                    create: content.folders.map(folder => ({
                                        name: folder.name,
                                        materials: {
                                            connect: folder.materials.map(material => ({ id: material.id }))
                                        }
                                    }))
                                } : undefined,
                                materials: content.materials ? {
                                    connect: content.materials.map(material => ({ id: material.id }))
                                } : undefined,
                                tasks: content.tasks ? {
                                    create: content.tasks.map(task => ({
                                        name: task.name,
                                        text: task.text,
                                        materials: {
                                            connect: task.materials.map(material => ({ id: material.id }))
                                        }
                                    }))
                                } : undefined
                            }
                        });
                    }
                }
            }

            return res.status(200).json(updatedCourse);
        } catch (error) {
            console.error("Error updating course:", error);
            return res.status(500).json({ error: "Failed to update course" });
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