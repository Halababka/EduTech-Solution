import { client } from "../db.js";
import dbErrorsHandler from "../utils/dbErrorsHandler.js";
import { sendNotificationToUser, sendNotificationToUsers } from "../notificationSocket.js";


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
                    course_owners: true,
                    categories: true
                }
            });

            // Формируем поле fullname для каждого студента
            course.enrolled_students = course.enrolled_students.map(student => ({
                ...student,
                fullname: `${student.last_name} ${student.first_name} ${student.middle_name || ""}`.trim()
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
                return res.status(400).json({error: "Name is required"});
            }
            // console.log(sections[0].contents[0])
            console.log(sections[0].contents[3].folders[0].materials);
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
                                        if (content.folders && content.folders.length > 0) {
                                            contentData.folders = {
                                                create: content.folders.map(folder => ({
                                                    name: folder.name,
                                                    materials: {
                                                        connect: folder.materials.map(material => ({id: material.id}))
                                                    }
                                                }))
                                            };
                                        }
                                        if (content.materials && content.materials.length > 0) {
                                            contentData.materials = {
                                                connect: content.materials.map(material => ({id: material.id}))
                                            };
                                        }
                                        if (content.task) {
                                            contentData.tasks = {
                                                create: {
                                                    name: content.task.name,
                                                    text: content.task.text,
                                                    materials: {
                                                        connect: content.task.materials.map(material => ({id: material.id}))
                                                    }
                                                }
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
                                                connect: folder.materials.map(material => ({id: material.id}))
                                            }
                                        }))
                                    };
                                }
                                if (content.materials && content.materials.length > 0) {
                                    contentData.materials = {
                                        connect: content.materials.map(material => ({id: material.id}))
                                    };
                                }
                                if (content.task) {
                                    contentData.tasks = {
                                        create: {
                                            name: content.task.name,
                                            text: content.task.text,
                                            materials: {
                                                connect: content.task.materials.map(material => ({id: material.id}))
                                            }
                                        }
                                    };
                                }
                                return contentData;
                            })
                        } : undefined
                    }))
                },
                enrolled_students: enrolledStudents ? {connect: enrolledStudents.map(student => ({id: student.id}))} : {connect: {id: user_id}},
                course_owners: courseOwners ? {connect: courseOwners.map(owner => ({id: owner.id}))} : {connect: {id: user_id}},
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
                                            materials: true,
                                            folders: {
                                                include: {materials: true}
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
            res.status(500).json({error: "Error creating course"});
        }
    }

    // async updateCourse(req, res) {
    //     try {
    //         const courseId = parseInt(req.params.id);
    //         const {sections, courseData} = req.body;
    //
    //         const updatedCourse = await client.courses.update({
    //             where: { id: courseId },
    //             data: {
    //                 ...courseData,
    //                 sections: {
    //                     deleteMany: {},
    //                     create: sections.map(section => ({
    //                         name: section.name,
    //                         subsections: {
    //                             create: section.subsections.map(subsection => ({
    //                                 name: subsection.name,
    //                                 section_content: {
    //                                     create: subsection.section_content.map(content => ({
    //                                         title: content.title,
    //                                         content: content.content,
    //                                         urlItem: content.urlItem,
    //                                         urlVideo: content.urlVideo,
    //                                         materials: {
    //                                             create: content.materials.map(material => ({
    //                                                 name: material.name,
    //                                                 description: material.description,
    //                                                 mime_type: material.mime_type,
    //                                                 key: material.key,
    //                                                 path: material.path,
    //                                                 size: material.size,
    //                                                 created_at: material.created_at,
    //                                                 updated_at: material.updated_at,
    //                                                 userId: material.userId,
    //                                                 folderId: material.folderId,
    //                                                 studentAssignmentsId: material.studentAssignmentsId
    //                                             }))
    //                                         },
    //                                         folders: {
    //                                             create: content.folders.map(folder => ({
    //                                                 name: folder.name,
    //                                                 materials: {
    //                                                     create: folder.materials.map(material => ({
    //                                                         name: material.name,
    //                                                         description: material.description,
    //                                                         mime_type: material.mime_type,
    //                                                         key: material.key,
    //                                                         path: material.path,
    //                                                         size: material.size,
    //                                                         created_at: material.created_at,
    //                                                         updated_at: material.updated_at,
    //                                                         userId: material.userId,
    //                                                         folderId: material.folderId,
    //                                                         studentAssignmentsId: material.studentAssignmentsId
    //                                                     }))
    //                                                 }
    //                                             }))
    //                                         },
    //                                         tasks: {
    //                                             create: content.tasks.map(task => ({
    //                                                 title: task.title,
    //                                                 description: task.description,
    //                                                 due_date: task.due_date,
    //                                                 materials: {
    //                                                     create: task.materials.map(material => ({
    //                                                         name: material.name,
    //                                                         description: material.description,
    //                                                         mime_type: material.mime_type,
    //                                                         key: material.key,
    //                                                         path: material.path,
    //                                                         size: material.size,
    //                                                         created_at: material.created_at,
    //                                                         updated_at: material.updated_at,
    //                                                         userId: material.userId,
    //                                                         folderId: material.folderId,
    //                                                         studentAssignmentsId: material.studentAssignmentsId
    //                                                     }))
    //                                                 }
    //                                             }))
    //                                         }
    //                                     }))
    //                                 }
    //                             }))
    //                         }
    //                     }))
    //                 }
    //             }
    //         });
    //
    //         res.status(200).json(updatedCourse);
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({message: "Ошибка обновления курса", error: error.message});
    //     }
    // };

    // async updateCourse(req, res) {
    //     try {
    //         const courseId = parseInt(req.params.id);
    //         const {
    //             name,
    //             description,
    //             imageUrl,
    //             startDate,
    //             endDate,
    //             duration_hours,
    //             categories,
    //             active,
    //             sections,
    //             enrolledStudents,
    //             courseOwners,
    //             isActive
    //         } = req.body;
    //
    //         if (!name) {
    //             return res.status(400).json({error: "Name is required"});
    //         }
    //
    //         const existingCourse = await client.courses.findUnique({
    //             where: {id: courseId}
    //         });
    //
    //         if (!existingCourse) {
    //             return res.status(404).json({error: "Course not found"});
    //         }
    //
    //         const updateData = {
    //             name,
    //             description,
    //             image_url: imageUrl,
    //             starts_at: startDate ? startDate : null,
    //             ends_at: endDate ? endDate : null,
    //             duration_hours: parseInt(duration_hours),
    //             active: isActive,
    //             enrolled_students: enrolledStudents ? {set: enrolledStudents.map(student => ({id: student.id}))} : null,
    //             course_owners: courseOwners ? {set: courseOwners.map(owner => ({id: owner.id}))} : null,
    //             categories: categories ? {set: categories.map(category => ({id: category.id}))} : null
    //         };
    //
    //         // Обновление курса
    //         const updatedCourse = await client.courses.update({
    //             where: {id: courseId},
    //             data: updateData,
    //             include: {
    //                 sections: true
    //             }
    //         });
    //
    //         for (const section of updatedCourse.sections) {
    //             await client.sections.update({
    //                 where: {id: section.id},
    //                 data: {
    //                     Courses: {disconnect: {id: courseId}}
    //                 }
    //             });
    //         }
    //
    //         // Привязка и обновление новых секций и их содержимого
    //         if (sections) {
    //             for (const section of sections) {
    //                 let createdSection;
    //                 if (section.id) {
    //                     createdSection = await client.sections.update({
    //                         where: {id: section.id},
    //                         data: {
    //                             name: section.name,
    //                             description: section.description,
    //                             Courses: {connect: {id: courseId}}
    //                         }
    //                     });
    //                 } else {
    //                     createdSection = await client.sections.create({
    //                         data: {
    //                             name: section.name,
    //                             description: section.description,
    //                             unlocks_at: section.unlocks_at,
    //                             subsections: section.subsections ? {
    //                                 create: section.subsections.map(subsection => ({
    //                                     name: subsection.name,
    //                                     description: subsection.description,
    //                                     unlocks_at: subsection.unlocks_at,
    //                                     section_content: subsection.contents ? {
    //                                         create: subsection.contents.map(content => {
    //                                             const contentData = {};
    //                                             if (content.title) contentData.title = content.title;
    //                                             if (content.content) contentData.content = content.content;
    //                                             if (content.urlItem) contentData.urlItem = content.urlItem;
    //                                             if (content.urlVideo) contentData.urlVideo = content.urlVideo;
    //                                             if (content.folders && content.folders.length > 0) {
    //                                                 contentData.folders = {
    //                                                     create: content.folders.map(folder => ({
    //                                                         name: folder.name,
    //                                                         materials: {
    //                                                             connect: folder.materials.map(material => ({id: material.id}))
    //                                                         }
    //                                                     }))
    //                                                 };
    //                                             }
    //                                             if (content.materials && content.materials.length > 0) {
    //                                                 contentData.materials = {
    //                                                     connect: content.materials.map(material => ({id: material.id}))
    //                                                 };
    //                                             }
    //                                             if (content.task) {
    //                                                 console.log(content.task);
    //                                                 contentData.tasks = {
    //                                                     create: {
    //                                                         name: content.task.name,
    //                                                         text: content.task.text,
    //                                                         materials: {
    //                                                             connect: content.task.materials.map(material => ({id: material.id}))
    //                                                         }
    //                                                     }
    //                                                 };
    //                                             }
    //                                             return contentData;
    //                                         })
    //                                     } : undefined
    //                                 }))
    //                             } : undefined,
    //                             section_content: section.contents ? {
    //                                 create: section.contents.map(content => {
    //                                     const contentData = {};
    //                                     if (content.title) contentData.title = content.title;
    //                                     if (content.content) contentData.content = content.content;
    //                                     if (content.urlItem) contentData.urlItem = content.urlItem;
    //                                     if (content.urlVideo) contentData.urlVideo = content.urlVideo;
    //                                     if (content.folders && content.folders.length > 0) {
    //                                         contentData.folders = {
    //                                             create: content.folders.map(folder => ({
    //                                                 name: folder.name,
    //                                                 materials: {
    //                                                     connect: folder.materials.map(material => ({id: material.id}))
    //                                                 }
    //                                             }))
    //                                         };
    //                                     }
    //                                     if (content.materials && content.materials.length > 0) {
    //                                         contentData.materials = {
    //                                             connect: content.materials.map(material => ({id: material.id}))
    //                                         };
    //                                     }
    //                                     if (content.task) {
    //                                         contentData.tasks = {
    //                                             create: {
    //                                                 name: content.task.name,
    //                                                 text: content.task.text,
    //                                                 materials: {
    //                                                     connect: content.task.materials.map(material => ({id: material.id}))
    //                                                 }
    //                                             }
    //                                         };
    //                                     }
    //                                     return contentData;
    //                                 })
    //                             } : undefined,
    //                             Courses: {connect: {id: courseId}}
    //                         }
    //                     });
    //                     // if (section.subsections) {
    //                     //     for (const subsection of section.subsections) {
    //                     //         let createdSubsection;
    //                     //         if (subsection.id) {
    //                     //             createdSubsection = await client.sections.update({
    //                     //                 where: {id: subsection.id},
    //                     //                 data: {
    //                     //                     name: subsection.name,
    //                     //                     description: subsection.description,
    //                     //                     unlocks_at: subsection.unlocks_at,
    //                     //                     parent: {connect: {id: createdSection.id}}
    //                     //                 }
    //                     //             });
    //                     //         } else {
    //                     //             createdSubsection = await client.sections.create({
    //                     //                 data: {
    //                     //                     name: subsection.name,
    //                     //                     description: subsection.description,
    //                     //                     unlocks_at: subsection.unlocks_at,
    //                     //                     parent: {connect: {id: createdSection.id}}
    //                     //                 }
    //                     //             });
    //                     //         }
    //                     //
    //                     //         if (subsection.contents) {
    //                     //             for (const content of subsection.contents) {
    //                     //                 const contentData = {
    //                     //                     title: content.title,
    //                     //                     content: content.content,
    //                     //                     urlItem: content.urlItem,
    //                     //                     urlVideo: content.urlVideo,
    //                     //                     folders: content.folders ? {
    //                     //                         connect: content.folders.map(folder => ({id: folder.id}))
    //                     //                     } : undefined,
    //                     //                     materials: content.materials ? {
    //                     //                         connect: content.materials.map(material => ({id: material.id}))
    //                     //                     } : undefined,
    //                     //                     tasks: content.task ? {
    //                     //                         create: {
    //                     //                             name: content.task.name,
    //                     //                             text: content.task.text,
    //                     //                             materials: {
    //                     //                                 connect: content.task.materials.map(material => ({id: material.id}))
    //                     //                             }
    //                     //                         }
    //                     //                     } : undefined,
    //                     //                     sectioins: {connect: {id: createdSubsection.id}}
    //                     //                 };
    //                     //
    //                     //                 if (content.id) {
    //                     //                     await client.sectionContents.update({
    //                     //                         where: {id: content.id},
    //                     //                         data: contentData
    //                     //                     });
    //                     //                 } else {
    //                     //                     await client.sectionContents.create({
    //                     //                         data: contentData
    //                     //                     });
    //                     //                 }
    //                     //             }
    //                     //         }
    //                     //     }
    //                     // }
    //                     //
    //                     // if (section.contents) {
    //                     //     for (const content of section.contents) {
    //                     //         const contentData = {
    //                     //             title: content.title,
    //                     //             content: content.content,
    //                     //             urlItem: content.urlItem,
    //                     //             urlVideo: content.urlVideo,
    //                     //             folders: content.folders ? {
    //                     //                 connect: content.folders.map(folder => ({id: folder.id}))
    //                     //             } : undefined,
    //                     //             materials: content.materials ? {
    //                     //                 connect: content.materials.map(material => ({id: material.id}))
    //                     //             } : undefined,
    //                     //             tasks: content.task ? {
    //                     //                 create: {
    //                     //                     name: content.task.name,
    //                     //                     text: content.task.text,
    //                     //                     materials: {
    //                     //                         connect: content.task.materials.map(material => ({id: material.id}))
    //                     //                     }
    //                     //                 }
    //                     //             } : undefined,
    //                     //             sections: {connect: {id: createdSection.id}}
    //                     //         };
    //                     //
    //                     //         if (content.id) {
    //                     //             await client.sectionContents.update({
    //                     //                 where: {id: content.id},
    //                     //                 data: contentData
    //                     //             });
    //                     //         } else {
    //                     //             await client.sectionContents.create({
    //                     //                 data: contentData
    //                     //             });
    //                     //         }
    //                     //     }
    //                     // }
    //                 }
    //             }
    //
    //             res.status(200).json(updatedCourse);
    //         }
    //     } catch (error) {
    //         console.error("Error updating course:", error);
    //         res.status(500).json({error: "Error updating course"});
    //     }
    // }

// async updateCourse(req, res) {
//     try {
//         const courseId = parseInt(req.params.id); // Преобразуем courseId в целое число
//         const {
//             name,
//             description,
//             imageUrl,
//             startDate,
//             endDate,
//             durationHours,
//             categories,
//             active,
//             sections,
//             enrolledStudents,
//             courseOwners
//         } = req.body;
//
//         // Проверка наличия обязательных параметров
//         if (!courseId) {
//             return res.status(400).json({ error: "Course ID is required" });
//         }
//
//         // Объект данных для обновления курса
//         const courseData = {
//             name,
//             description,
//             image_url: imageUrl,
//             starts_at: startDate ? startDate : undefined,
//             ends_at: endDate ? endDate : undefined,
//             duration_hours: durationHours,
//             active,
//             sections: {
//                 create: sections.map(section => ({
//                     where: { id: section.id },
//                     data: {
//                         name: section.name,
//                         description: section.description,
//                         unlocks_at: section.unlocks_at,
//                         subsections: section.subsections ? {
//                             create: section.subsections.map(subsection => ({
//                                 where: { id: subsection.id },
//                                 data: {
//                                     name: subsection.name,
//                                     description: subsection.description,
//                                     unlocks_at: subsection.unlocks_at,
//                                     section_content: subsection.section_content ? {
//                                         create: subsection.section_content.map(content => ({
//                                             where: { id: content.id },
//                                             data: {
//                                                 title: content.title,
//                                                 content: content.content,
//                                                 urlItem: content.urlItem,
//                                                 urlVideo: content.urlVideo,
//                                                 folders: content.folders ? {
//                                                     create: content.folders.map(folder => ({
//                                                         where: { id: folder.id },
//                                                         data: {
//                                                             name: folder.name,
//                                                             materials: {
//                                                                 connect: folder.materials.map(material => ({ id: material.id }))
//                                                             }
//                                                         }
//                                                     }))
//                                                 } : undefined,
//                                                 tasks: content.tasks ? {
//                                                     create: content.tasks.map(task => ({
//                                                         where: { id: task.id },
//                                                         data: {
//                                                             name: task.name,
//                                                             text: task.text,
//                                                             materials: {
//                                                                 connect: task.materials.map(material => ({ id: material.id }))
//                                                             }
//                                                         }
//                                                     }))
//                                                 } : undefined
//                                             }
//                                         }))
//                                     } : undefined
//                                 }
//                             }))
//                         } : undefined
//                     }
//                 }))
//             },
//             enrolled_students: enrolledStudents ? {set: [], connect: enrolledStudents.map(student => ({ id: student.id })) } : undefined,
//             course_owners: courseOwners ? {set: [], connect: courseOwners.map(owner => ({ id: owner.id })) } : undefined,
//             categories: categories ? {set: [], connect: categories.map(category => ({ id: category.id })) } : undefined
//         };
//
//         // Обновление курса
//         const updatedCourse = await client.courses.update({
//             where: { id: courseId },
//             data: courseData
//         });
//
//         return res.status(200).json(updatedCourse);
//     } catch (error) {
//         console.error("Error updating course:", error);
//         return res.status(500).json({ error: "Failed to update course" });
//     }
// }

    // async updateCourse(req, res) {
    //     try {
    //         const courseId = parseInt(req.params.id);
    //         const {
    //             name,
    //             description,
    //             imageUrl,
    //             startDate,
    //             endDate,
    //             duration_hours,
    //             categories,
    //             active,
    //             sections,
    //             enrolledStudents,
    //             courseOwners,
    //             isActive
    //         } = req.body;
    //
    //         if (!name) {
    //             return res.status(400).json({error: "Name is required"});
    //         }
    //
    //         const existingCourse = await client.courses.findUnique({
    //             where: {id: courseId}
    //         });
    //
    //         if (!existingCourse) {
    //             return res.status(404).json({error: "Course not found"});
    //         }
    //
    //         const updateData = {
    //             name,
    //             description,
    //             image_url: imageUrl,
    //             starts_at: startDate ? startDate : null,
    //             ends_at: endDate ? endDate : null,
    //             duration_hours: parseInt(duration_hours),
    //             active: isActive,
    //             enrolled_students: enrolledStudents ? {set: enrolledStudents.map(student => ({id: student.id}))} : null,
    //             course_owners: courseOwners ? {set: courseOwners.map(owner => ({id: owner.id}))} : null,
    //             categories: categories ? {set: categories.map(category => ({id: category.id}))} : null
    //         };
    //
    //         // Обновление курса
    //         const updatedCourse = await client.courses.update({
    //             where: { id: courseId },
    //             data: updateData,
    //             include: {
    //                 sections: {
    //                     include: {
    //                         subsections: {
    //                             include: {
    //                                 section_content: {
    //                                     include: {
    //                                         materials: true,
    //                                         folders: {
    //                                             include: { materials: true }
    //                                         },
    //                                         tasks: {
    //                                             include: {
    //                                                 materials: true
    //                                             }
    //                                         }
    //                                     }
    //                                 }
    //                             }
    //                         },
    //                         section_content: {
    //                             include: {
    //                                 materials: true,
    //                                 folders: {
    //                                     include: {
    //                                         materials: true
    //                                     }
    //                                 },
    //                                 tasks: {
    //                                     include: {
    //                                         materials: true
    //                                     }
    //                                 }
    //                             }
    //                         }
    //                     }
    //                 },
    //                 enrolled_students: true,
    //                 course_owners: true,
    //                 categories: true
    //             }
    //         });
    //
    //         // Привязка и обновление новых секций и их содержимого
    //         // Обновление секций и их содержимого
    //         if (sections) {
    //             // удаление у всех секций связи с курсом
    //             for (const section of updatedCourse.sections) {
    //                 await client.sections.update({
    //                     where: {id: section.id},
    //                     data: {
    //                         Courses: {disconnect: {id: courseId}}
    //                     }
    //                 });
    //             }
    //             for (const section of sections) {
    //                 const sectionData = {
    //                     name: section.name,
    //                     description: section.description
    //                 };
    //
    //                 let updatedSection;
    //                 if (section.id) {
    //                     updatedSection = await client.sections.update({
    //                         where: {id: section.id},
    //                         data: {
    //                             ...sectionData,
    //                             Courses: {connect: {id: courseId}}
    //                         }
    //                     });
    //                 } else {
    //                     updatedSection = await client.sections.create({
    //                         data: {
    //                             ...sectionData,
    //                             Courses: {connect: {id: courseId}}
    //                         }
    //                     });
    //                 }
    //
    //                 if (section.subsections) {
    //                     // удаление у всех сабсекций связи с секцией
    //                     for (const subsections of section.subsections) {
    //                         await client.sections.update({
    //                             where: {id: subsections.id},
    //                             data: {
    //                                 parent: {disconnect: {id: section.id}}
    //                             }
    //                         });
    //                     }
    //                     for (const subsection of section.subsections) {
    //                         const subsectionData = {
    //                             name: subsection.name,
    //                             description: subsection.description
    //                         };
    //
    //                         let updatedSubsection;
    //                         if (subsection.id) {
    //                             updatedSubsection = await client.sections.update({
    //                                 where: {id: subsection.id},
    //                                 data: subsectionData
    //                             });
    //                         } else {
    //                             updatedSubsection = await client.sections.create({
    //                                 data: {
    //                                     ...subsectionData,
    //                                     parent: {connect: {id: updatedSection.id}}
    //                                 }
    //                             });
    //                         }
    //
    //                         if (subsection.contents) {
    //                             // удаление у всего контента связи с сабсекцией
    //                             for (const content of subsection.contents) {
    //                                 await client.sectionContents.update({
    //                                     where: {id: content.id},
    //                                     data: {
    //                                         sections: {disconnect: {id: subsection.id}}
    //                                     }
    //                                 });
    //                             }
    //                             for (const content of subsection.contents) {
    //                                 const contentData = {
    //                                     title: content.title || null,
    //                                     content: content.content || null,
    //                                     urlItem: content.urlItem || null,
    //                                     urlVideo: content.urlVideo || null
    //                                 };
    //
    //                                 if (content.id) {
    //                                     await client.sectionContents.update({
    //                                         where: {id: content.id},
    //                                         data: contentData
    //                                     });
    //                                 } else {
    //                                     await client.sectionContents.create({
    //                                         data: {
    //                                             ...contentData,
    //                                             sections: {connect: {id: updatedSubsection.id}}
    //                                         }
    //                                     });
    //                                 }
    //                             }
    //                         }
    //                     }
    //                 }
    //
    //                 if (section.contents) {
    //                     for (const content of section.contents) {
    //                         const contentData = {
    //                             title: content.title || null,
    //                             content: content.content || null,
    //                             urlItem: content.urlItem || null,
    //                             urlVideo: content.urlVideo || null
    //                         };
    //
    //                         if (content.id) {
    //                             await client.sectionContents.update({
    //                                 where: {id: content.id},
    //                                 data: contentData
    //                             });
    //                         } else {
    //                             await client.sectionContents.create({
    //                                 data: {
    //                                     ...contentData,
    //                                     sections: {connect: {id: updatedSection.id}}
    //                                 }
    //                             });
    //                         }
    //                     }
    //                 }
    //             }
    //
    //
    //             res.status(200).json(updatedCourse);
    //         }
    //     } catch (error) {
    //         console.error("Error updating course:", error);
    //         res.status(500).json({error: "Error updating course"});
    //     }
    // }

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
                return res.status(400).json({error: "Course ID is required"});
            }

            const courseData = {
                name,
                description,
                image_url: imageUrl,
                starts_at: startDate ? startDate : null,
                ends_at: endDate ? endDate : null,
                duration_hours: parseInt(duration_hours),
                active: isActive,
                enrolled_students: enrolledStudents ? {set: enrolledStudents.map(student => ({id: student.id}))} : null,
                course_owners: courseOwners ? {set: courseOwners.map(owner => ({id: owner.id}))} : null,
                categories: categories ? {set: categories.map(category => ({id: category.id}))} : null
            };

            const updatedCourse = await client.courses.update({
                where: {id: courseId},
                data: courseData
            });

            const allSections = await client.sections.findMany({
                where: {coursesId: courseId},
                select: {id: true}
            });

            const sectionIdsToKeep = sections.map(section => section.id);

            for (const section of allSections) {
                if (!sectionIdsToKeep.includes(section.id)) {
                    await client.sections.update({
                        where: {id: section.id},
                        data: {
                            coursesId: null
                        }
                    });
                }
            }

            for (const section of sections) {
                const updatedSection = await client.sections.upsert({
                    where: {id: section.id || 0},
                    update: {
                        name: section.name,
                        description: section.description,
                        unlocks_at: section.unlocks_at,
                        coursesId: courseId,
                        section_content: {
                            upsert: section.contents.map(content => ({
                                where: {id: content.id || 0},
                                create: {
                                    title: content.title,
                                    content: content.content,
                                    urlItem: content.urlItem,
                                    urlVideo: content.urlVideo,
                                    folders: content.folders ? {
                                        create: content.folders.map(folder => ({
                                            name: folder.name,
                                            materials: {
                                                connect: folder.materials.map(material => ({id: material.id}))
                                            }
                                        }))
                                    } : undefined,
                                    materials: content.materials ? {
                                        connect: content.materials.map(material => ({id: material.id}))
                                    } : undefined,
                                    tasks: content.task ? {
                                        create: {
                                            name: content.task.name,
                                            text: content.task.text,
                                            materials: {
                                                connect: content.task.materials.map(material => ({id: material.id}))
                                            }
                                        }
                                    } : undefined
                                },
                                update: {
                                    title: content.title,
                                    content: content.content,
                                    urlItem: content.urlItem,
                                    urlVideo: content.urlVideo,
                                    folders: content.folders ? {
                                        upsert: content.folders.map(folder => ({
                                            where: {id: folder.id || 0},
                                            create: {
                                                name: folder.name,
                                                materials: {
                                                    connect: folder.materials.map(material => ({id: material.id}))
                                                }
                                            },
                                            update: {
                                                name: folder.name,
                                                materials: {
                                                    connect: folder.materials.map(material => ({id: material.id}))
                                                }
                                            }
                                        }))
                                    } : undefined,
                                    materials: content.materials ? {
                                        connect: content.materials.map(material => ({id: material.id}))
                                    } : undefined,
                                    tasks: content.task ? {
                                        upsert: {
                                            where: {id: content.task.id || 0},
                                            create: {
                                                name: content.task.name,
                                                text: content.task.text,
                                                materials: {
                                                    connect: content.task.materials.map(material => ({id: material.id}))
                                                }
                                            },
                                            update: {
                                                name: content.task.name,
                                                text: content.task.text,
                                                materials: {
                                                    connect: content.task.materials.map(material => ({id: material.id}))
                                                }
                                            }
                                        }
                                    } : undefined
                                }
                            }))
                        },
                        subsections: {
                            upsert: section.subsections.map(subsection => ({
                                where: {id: subsection.id || 0},
                                create: {
                                    name: subsection.name,
                                    description: subsection.description,
                                    unlocks_at: subsection.unlocks_at,
                                    section_content: {
                                        create: subsection.contents.map(content => ({
                                            title: content.title,
                                            content: content.content,
                                            urlItem: content.urlItem,
                                            urlVideo: content.urlVideo,
                                            folders: content.folders ? {
                                                create: content.folders.map(folder => ({
                                                    name: folder.name,
                                                    materials: {
                                                        connect: folder.materials.map(material => ({id: material.id}))
                                                    }
                                                }))
                                            } : undefined,
                                            materials: content.materials ? {
                                                connect: content.materials.map(material => ({id: material.id}))
                                            } : undefined,
                                            tasks: content.task ? {
                                                create: {
                                                    name: content.task.name,
                                                    text: content.task.text,
                                                    materials: {
                                                        connect: content.task.materials.map(material => ({id: material.id}))
                                                    }
                                                }
                                            } : undefined
                                        }))
                                    }
                                },
                                update: {
                                    name: subsection.name,
                                    description: subsection.description,
                                    unlocks_at: subsection.unlocks_at,
                                    section_content: {
                                        upsert: subsection.contents.map(content => ({
                                            where: {id: content.id || 0},
                                            create: {
                                                title: content.title,
                                                content: content.content,
                                                urlItem: content.urlItem,
                                                urlVideo: content.urlVideo,
                                                folders: content.folders ? {
                                                    create: content.folders.map(folder => ({
                                                        name: folder.name,
                                                        materials: {
                                                            connect: folder.materials.map(material => ({id: material.id}))
                                                        }
                                                    }))
                                                } : undefined,
                                                materials: content.materials ? {
                                                    connect: content.materials.map(material => ({id: material.id}))
                                                } : undefined,
                                                tasks: content.task ? {
                                                    create: {
                                                        name: content.task.name,
                                                        text: content.task.text,
                                                        materials: {
                                                            connect: content.task.materials.map(material => ({id: material.id}))
                                                        }
                                                    }
                                                } : undefined
                                            },
                                            update: {
                                                title: content.title,
                                                content: content.content,
                                                urlItem: content.urlItem,
                                                urlVideo: content.urlVideo,
                                                folders: content.folders ? {
                                                    upsert: content.folders.map(folder => ({
                                                        where: {id: folder.id || 0},
                                                        create: {
                                                            name: folder.name,
                                                            materials: {
                                                                connect: folder.materials.map(material => ({id: material.id}))
                                                            }
                                                        },
                                                        update: {
                                                            name: folder.name,
                                                            materials: {
                                                                connect: folder.materials.map(material => ({id: material.id}))
                                                            }
                                                        }
                                                    }))
                                                } : undefined,
                                                materials: content.materials ? {
                                                    connect: content.materials.map(material => ({id: material.id}))
                                                } : undefined,
                                                tasks: content.task ? {
                                                    upsert: {
                                                        where: {id: content.task.id || 0},
                                                        create: {
                                                            name: content.task.name,
                                                            text: content.task.text,
                                                            materials: {
                                                                connect: content.task.materials.map(material => ({id: material.id}))
                                                            }
                                                        },
                                                        update: {
                                                            name: content.task.name,
                                                            text: content.task.text,
                                                            materials: {
                                                                connect: content.task.materials.map(material => ({id: material.id}))
                                                            }
                                                        }
                                                    }
                                                } : undefined
                                            }
                                        }))
                                    }
                                }
                            }))
                        }
                    },
                    create: {
                        name: section.name,
                        description: section.description,
                        unlocks_at: section.unlocks_at,
                        coursesId: courseId,
                        section_content: {
                            create: section.contents.map(content => ({
                                title: content.title,
                                content: content.content,
                                urlItem: content.urlItem,
                                urlVideo: content.urlVideo,
                                folders: content.folders ? {
                                    create: content.folders.map(folder => ({
                                        name: folder.name,
                                        materials: {
                                            connect: folder.materials.map(material => ({id: material.id}))
                                        }
                                    }))
                                } : undefined,
                                materials: content.materials ? {
                                    connect: content.materials.map(material => ({id: material.id}))
                                } : undefined,
                                tasks: content.task ? {
                                    create: {
                                        name: content.task.name,
                                        text: content.task.text,
                                        materials: {
                                            connect: content.task.materials.map(material => ({id: material.id}))
                                        }
                                    }
                                } : undefined
                            }))
                        },
                        subsections: {
                            create: section.subsections.map(subsection => ({
                                name: subsection.name,
                                description: subsection.description,
                                unlocks_at: subsection.unlocks_at,
                                section_content: {
                                    create: subsection.contents.map(content => ({
                                        title: content.title,
                                        content: content.content,
                                        urlItem: content.urlItem,
                                        urlVideo: content.urlVideo,
                                        folders: content.folders ? {
                                            create: content.folders.map(folder => ({
                                                name: folder.name,
                                                materials: {
                                                    connect: folder.materials.map(material => ({id: material.id}))
                                                }
                                            }))
                                        } : undefined,
                                        materials: content.materials ? {
                                            connect: content.materials.map(material => ({id: material.id}))
                                        } : undefined,
                                        tasks: content.task ? {
                                            create: {
                                                name: content.task.name,
                                                text: content.task.text,
                                                materials: {
                                                    connect: content.task.materials.map(material => ({id: material.id}))
                                                }
                                            }
                                        } : undefined
                                    }))
                                }
                            }))
                        }
                    }
                });

                // Deleting contents that are not in the new data for section
                const allContents = await client.sectionContents.findMany({
                    where: {sectionsId: updatedSection.id},
                    select: {id: true}
                });

                const contentIdsToKeep = section.contents.map(content => content.id);

                for (const content of allContents) {
                    if (!contentIdsToKeep.includes(content.id)) {
                        await client.sectionContents.delete({
                            where: {id: content.id}
                        });
                    }
                }

                // Deleting subsections that are not in the new data for section
                const allSubsections = await client.sections.findMany({
                    where: {parentId: updatedSection.id},
                    select: {id: true}
                });

                const subsectionIdsToKeep = section.subsections.map(subsection => subsection.id);

                for (const subsection of allSubsections) {
                    if (!subsectionIdsToKeep.includes(subsection.id)) {
                        await client.sections.update({
                            where: {id: subsection.id},
                            data: {
                                parentId: null
                            }
                        });
                    }
                }

                // Deleting contents of subsections that are not in the new data
                for (const subsection of section.subsections) {
                    const allSubsectionContents = await client.sectionContents.findMany({
                        where: { sectionsId: subsection.id },
                        select: { id: true }
                    });

                    const subsectionContentIdsToKeep = subsection.contents.map(content => content.id);

                    for (const content of allSubsectionContents) {
                        if (!subsectionContentIdsToKeep.includes(content.id)) {
                            await client.sectionContents.delete({
                                where: { id: content.id }
                            });
                        }
                    }
                }
            }

            return res.status(200).json(updatedCourse);
        } catch (error) {
            console.error("Error updating course:", error);
            return res.status(500).json({error: "Failed to update course"});
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