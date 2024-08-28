import { client } from "../db.js";

export class TasksController {
    async getTasksByCourseId(req, res) {
        try {
            const courseId = parseInt(req.params.courseId);

            // Получаем задания из секций курса
            const tasksFromSections = await client.tasks.findMany({
                where: {
                    SectionContents: {
                        sections: {
                            coursesId: courseId,
                            parentId: null // Только секции курса
                        }
                    }
                },
                include: {
                    SectionContents: {
                        include: {
                            sections: true
                        }
                    },
                    materials: true,
                    StudentAssignments: {
                        include: {
                            student: true,
                            reviewer: true,
                            materials: true
                        }
                    }
                }
            });

            // Получаем задания из подсекций курса
            const tasksFromSubsections = await client.tasks.findMany({
                where: {
                    SectionContents: {
                        sections: {
                            parent: {
                                coursesId: courseId
                            }
                        }
                    }
                },
                include: {
                    SectionContents: {
                        include: {
                            sections: true
                        }
                    },
                    materials: true,
                    StudentAssignments: {
                        include: {
                            student: true,
                            reviewer: true,
                            materials: true
                        }
                    }
                }
            });

            // Объединяем задания из секций и подсекций
            const allTasks = [...tasksFromSections, ...tasksFromSubsections];

            // Возвращаем полное имя для каждого студента
            allTasks.forEach(task => {
                task.StudentAssignments.forEach(assignment => {
                    assignment.student.fullname = `${assignment.student.first_name} ${assignment.student.last_name} ${assignment.student.middle_name}`;
                });
            });

            res.json(allTasks);
        } catch (error) {
            console.error("Error fetching tasks by course ID:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }

}