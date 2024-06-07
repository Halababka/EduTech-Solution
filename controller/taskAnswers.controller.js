import { client } from "../db.js";
export class AnswerController {
    async getAllAnswers(req, res) {
        try {
            const answers = await client.studentAssignments.findMany({
                include: {
                    student: true,
                    task: true,
                    materials: true,
                    reviewer: true,
                },
            });
            res.json(answers);
        } catch (error) {
            console.error('Error fetching all answers:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async createAnswer(req, res) {
        try {
            const { taskId, materials } = req.body;
            const studentId = req.user.id;

            const newAnswer = await client.studentAssignments.create({
                data: {
                    student: {
                        connect: { id: parseInt(studentId) },
                    },
                    task: {
                        connect: { id: parseInt(taskId) },
                    },
                    materials: {
                        connect: materials.map((material) => ({ id: material.id })),
                    },
                }
            });

            res.status(201).json(newAnswer);
        } catch (error) {
            console.error("Error creating answer:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // Метод для обновления ответа
    async updateAnswer(req, res) {
        try {
            const { materials } = req.body;
            const answerId = parseInt(req.params.id);

            const updatedAnswer = await client.studentAssignments.update({
                where: { id: answerId },
                data: {
                    materials: {
                        set: [],
                        connect: materials.map(material => ({ id: material.id }))
                    }
                }
            });

            res.json(updatedAnswer);
        } catch (error) {
            console.error("Error updating answer:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
    async gradeAnswer(req, res) {
        try {
            const { answerId, grade } = req.body;
            const reviewerId = req.user.id;

            const updatedAnswer = await client.studentAssignments.update({
                where: { id: parseInt(answerId) },
                data: {
                    grade: parseInt(grade),
                    reviewer: { connect: { id: parseInt(reviewerId) } },
                },
            });

            res.json(updatedAnswer);
        } catch (error) {
            console.error('Error grading answer:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}