import {client} from '../db.js';
import dbErrorsHandler from "../utils/dbErrorsHandler.js";
import {json, Request, Response} from 'express'

import type {
    Subject,
    Question,
    QuestionTypes,
    Answer,
    AnswerTypes,
    TestTemplate,
    TestSettings, TestAssign
} from '@prisma/client'

async function checkCircularReference(id: number, parentId: number, res: Response) {
    // Fetch the parent
    const parent = await client.subject.findUnique({where: {id: parentId}});

    // If the parent's parentId is the same as the current id, throw an error
    if (parent.parentId === id) {
        return res.status(400).json({error: 'Родитель не может быть своим потомком'});
    }

    // If the parent has a parent, recursively check the next level
    if (parent.parentId) {
        await checkCircularReference(id, parent.parentId, res);
    }
}

function now() {
    return new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });
}

export class TestsController {
    async createAnswer(req: Request, res: Response) {
        const questionId = parseInt(req.params.questionId);
        const {type, content, correct} = req.body;

        let questions: Question, finalType: AnswerTypes, answers: Answer;

        try {
            questions = await client.question.findUnique({
                where:
                    {
                        id: questionId
                    },
            })
        } catch (e) {
            return res.status(500).json({error: dbErrorsHandler(e)})
        }

        if (!questions) {
            return res.status(404).json({error: "Вопрос не найден"})
        }

        if (!content) {
            return res.status(400).json({error: 'Контент не заполнен'});
        }

        if ((content.split(" ").join("")) === '') {
            return res.status(400).json({error: 'Необходимо указать контент'})
        }

        finalType = type ? type : 'TEXT'

        try {
            answers = await client.answer.create({
                data: {
                    content: content,
                    type: finalType,
                    correct: correct,
                    questionId: questionId
                }
            })
        } catch (e) {
            return res.status(500).json({error: dbErrorsHandler(e)})
        }

        res.json(answers)
    }

    async getAnswers(req: Request, res: Response) {
        const questionId = parseInt(req.params.questionId);

        let answers: Answer[];

        try {
            answers = await client.answer.findMany({
                where:
                    {
                        questionId: questionId
                    },
            })
        } catch (e) {
            return res.status(500).json({error: dbErrorsHandler(e)})
        }

        if (answers.length < 1) {
            return res.status(404).json({error: "Вопрос не найден"})
        }

        return res.json(answers)

    }

    async createQuestion(req: Request, res: Response) {
        const {text, subjectId, type, level, answers} = req.body;
        let finalType: QuestionTypes;

        if (!text) {
            return res.status(400).json({error: 'Необходимо указать текст вопроса'});
        }

        finalType = type ? type : 'ONE_ANSWER'

        const data = {
            text: text,
            subjectId: subjectId,
            type: finalType,
            answers: {create: answers}
        }

        if (level) data['level'] = level
        const question: Question = await client.question.create({
            data: data,
            include: {
                subjects: true,
                answers: true
            }
        });

        return res.json(question);
    }

    async getQuestion(req: Request, res: Response) {
        const questions: Question[] = await client.question.findMany({
            include: {
                subjects: true,
                answers: {
                    orderBy: {
                        id: 'asc'
                    }
                }
            }
        })
        res.json(questions);
    }

    async updateQuestion(req: Request, res: Response) {
        const {text, subjectId, type, level, answers} = req.body;
        const id = parseInt(req.params.id);

        const newData: any = {}

        if (text) {
            newData.text = text
        }

        if (type) {
            newData.type = type
        }

        if (level) {
            newData.level = level
        }

        if (level) {
            newData.subjectId = subjectId
        }

        if (Object.keys(newData).length === 0) {
            return res.status(400).json({error: 'Нет данных для изменения'})
        }

        const question = await client.question.findUnique({
            where: {
                id: id
            },
            include: {
                answers: true
            }
        })

        let queries = [];

        if (answers) {
            const recordsToUpdate = answers.filter(newRecord =>
                question.answers.some(currentRecord =>
                        currentRecord.id === newRecord.id && (
                            currentRecord.content !== newRecord.content ||
                            currentRecord.correct !== newRecord.correct ||
                            currentRecord.type !== newRecord.type
                        )
                )
            );

            // Identify records to delete
            const recordsToDelete = question.answers.filter(currentRecord => !answers.some(newRecord => newRecord.id === currentRecord.id));

            // Identify records to create
            const recordsToCreate = answers.filter(newRecord => !newRecord.id);

            const updateData = recordsToUpdate.map(answer => ({
                where: {id: answer.id},
                data: {
                    content: answer.content,
                    type: answer.type,
                    correct: answer.correct,
                }
            }));

            const deleteData = recordsToDelete.map(obj => obj.id);

            const updateQuery = client.question.update({
                where: {id: id},
                data: {
                    answers: {updateMany: updateData}
                }
            })

            const deleteQuery = client.answer.updateMany({
                where: {
                    id: {in: deleteData}
                },
                data: {
                    questionId: null,
                    exQuestionId: id
                }
            })

            const createQuery = client.question.update({
                where: {id: id},
                data: {
                    answers: {create: recordsToCreate}
                }
            })

            if (updateData.length !== 0) {
                queries.push(updateQuery)
            }
            if (deleteData.length !== 0) {
                queries.push(deleteQuery)
            }
            if (recordsToCreate.length !== 0) {
                queries.push(createQuery)
            }
        }

        let updateQuestion = client.question.update({
            where: {id: id},
            data: newData,
        });

        queries.push(updateQuestion)

        let updatedQuestion;
        try {
            updatedQuestion = await client.$transaction(queries);
        } catch (e) {
            return res.status(500).json({error: dbErrorsHandler(e)})
        }
        return res.json(updatedQuestion)
    }

    async createSubject(req: Request, res: Response) {
        const {name, parentId, children} = req.body;

        if (children && parentId && children.includes(parentId)) {
            return res.status(400).json({error: 'Нельзя назначить одного и того же родителя и ребенка'})
        }

        if (!req.body.hasOwnProperty('name')) {
            return res.status(400).json({error: 'Одно или несколько обязательных полей отсуствуют'})
        }
        // TODO: Сделать проверку, что родитель не будет потомком
        // await checkCircularReference(id, parentId, res);

        const data = {
            name: name
        }

        if (parentId) {
            data['parentId'] = parentId
        }

        if (children) {
            data['children'] = {};
            data['children']['connect'] = children.map((num: number) => ({id: num}))
        }

        let newSubject: Subject;
        try {
            newSubject = await client.subject.create({
                data: data,
                include: {
                    children: true
                }
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }
        res.json(newSubject);
    }

    async getSubjects(req: Request, res: Response) {
        let subjects: Subject[];
        try {
            subjects = await client.subject.findMany()
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(subjects);
    }

    async updateSubjects(req: Request, res: Response) {
        const {name, parentId, children} = req.body;
        const id = parseInt(req.params.id);

        let subject: Subject;
        try {
            subject = await client.subject.findUnique({
                where: {
                    id: id,
                },
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        if (!subject) {
            res.status(404).json({error: 'Такой темы нет'})
            return
        }

        if (children && parentId && children.includes(parentId)) {
            return res.status(400).json({error: 'Нельзя назначить одного и того же родителя и ребенка'})
        }

        await checkCircularReference(id, parentId, res);

        const data = {}
        if (name) {
            data['name'] = name
        }

        if (parentId) {
            data['parentId'] = parentId

            let result: Subject;
            try {
                result = await client.subject.findUnique({
                    where: {
                        id: parentId,
                    },
                })
            } catch (e) {
                res.status(500).json({error: dbErrorsHandler(e)})
                return
            }
            if (!result) {
                return res.status(404).json({error: 'Тема с таким id (parentId) не найдена'})
            }
        }

        if (children) {
            data['children'] = {};
            data['children']['connect'] = children.map((num: number) => ({id: num}))
        }

        try {
            subject = await client.subject.update({
                where: {
                    id: id,
                },
                data: data,
                include: {
                    children: true
                }
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        res.json(subject)
    }

    async createTestTemplate(req: Request, res: Response) {
        const {name, subjects} = req.body;
        const user_id = (req as any).user.id;

        let newData: any = {
            authorId: user_id
        };

        newData.name = name ? name : `Шаблон от ${now()}`

        if (subjects) {
            try {
                newData.subjects = {
                    connect: [...subjects.map((num: number) => ({id: num}))]
                }
            } catch (e) {
                return res.status(400).json({error: 'Невозможно распарсить массив'});
            }
        } else {
            return res.status(400).json({error: 'Невозможно создать шаблон без тем'})
        }

        let template: TestTemplate
        try {
            template = await client.testTemplate.create({
                data: newData,
                include: {
                    subjects: true
                }
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(template)
    }

    async getTestTemplates(req: Request, res: Response) {

        let templates: TestTemplate[]
        try {
            templates = await client.testTemplate.findMany({
                include: {
                    subjects: true
                }
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(templates)
    }

    async updateTestTemplate(req: Request, res: Response) {
        const {name, subjects} = req.body;
        const id = parseInt(req.params.id);

        let newData: any = {};

        if (name) {
            newData.name = name
        }

        if (!name && !subjects) {
            return res.status(400).json({error: 'Нет данных для обновления'})
        }

        if (subjects) {
            try {
                newData.subjects = {
                    connect: [...subjects.map((num: number) => ({id: num}))]
                }
            } catch (e) {
                return res.status(400).json({error: 'Невозможно распарсить массив'});
            }
        }
        // TODO: Как привязывать новые и определять, что удаляешь старые
        let template: TestTemplate
        try {
            template = await client.testTemplate.update({
                where: {
                    id: id
                },
                data: newData,
                include: {
                    subjects: true
                }
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(template)
    }

    async createTestSettings(req: Request, res: Response) {
        const {name, startTime, endTime, duration, attemptsCount, assessmentMethod, initialDifficulty} = req.body;
        const user_id = (req as any).user.id;

        let newData: any = {
            authorId: user_id
        };

        if (duration) {
            newData.duration = duration
        }

        if (attemptsCount) {
            newData.attemptsCount = attemptsCount
        }

        if (initialDifficulty) {
            newData.initialDifficulty = initialDifficulty
        }

        if (assessmentMethod) {
            newData.assessmentMethod = assessmentMethod
        }

        newData.name = name ? name : `Настройки от ${now()}`

        if (startTime) {
            newData.startTime = new Date(startTime)
        }

        if (endTime) {
            newData.endTime = new Date(endTime)
        }

        let settings: TestSettings
        try {
            settings = await client.testSettings.create({
                data: newData
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(settings)
    }

    async getTestSettings(req: Request, res: Response) {

        let settings: TestSettings[]
        try {
            settings = await client.testSettings.findMany({})
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(settings)
    }

    async updateTestSettings(req: Request, res: Response) {
        const {name, startTime, endTime, duration, attemptsCount, assessmentMethod, initialDifficulty} = req.body;
        const id = parseInt(req.params.id);

        let newData: any = {};

        if (name) newData.name = name

        if (duration) newData.duration = duration

        if (attemptsCount) newData.attemptsCount = attemptsCount

        if (initialDifficulty) newData.initialDifficulty = initialDifficulty

        if (assessmentMethod) newData.assessmentMethod = assessmentMethod

        if (startTime) newData.startTime = new Date(startTime)

        if (endTime) newData.endTime = new Date(endTime)

        if (Object.keys(newData).length === 0) {
            return res.status(400).json({error: 'Нет данных для обновления'})
        }

        let settings: TestSettings
        try {
            settings = await client.testSettings.update({
                where: {
                    id: id
                },
                data: newData
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(settings)
    }

    async createTestAssign(req: Request, res: Response) {
        const {name, testTemplateId, testSettingsId, users, groups} = req.body;
        const user_id = (req as any).user.id;

        if (!testSettingsId && !testTemplateId) {
            return res.status(400).json({error: "testTemplateId и testSettingsId являются обязательными"})
        }

        let newData: any = {
            author: {
                connect: {id: user_id},
            },
            testTemplate: {
                connect: {id: testTemplateId}
            },
            testSettings: {
                connect: {id: testSettingsId}
            }
        };

        newData.name = name ? name : `Назначение от ${now()}`

        if (users) {
            try {
                newData.users = {
                    create: users.map((user) => ({
                        user: {
                            connect: {id: user}
                        }
                    }))
                }
            } catch (e) {
                return res.status(400).json({error: 'Невозможно распарсить массив'});
            }
        }

        if (groups) {
            try {
                newData.groups = {
                    connect: [...groups.map((num: number) => ({id: num}))]
                }
            } catch (e) {
                return res.status(400).json({error: 'Невозможно распарсить массив'});
            }
        }

        let testAssign: TestAssign;
        try {
            testAssign = await client.testAssign.create({
                data: newData,
                include: {
                    users: true,
                    groups: true
                }
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(testAssign)
    }

    async getTestAssign(req: Request, res: Response) {
        let assign: TestAssign[]
        try {
            assign = await client.testAssign.findMany({
                include: {
                    users: true,
                    groups: true
                }
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(assign)
    }

    async updateTestAssign(req: Request, res: Response) {
        const {name, testTemplateId, testSettingsId, users, groups} = req.body;
        const id = parseInt(req.params.id);

        let newData: any = {};

        if (name) newData.name = name

        if (testTemplateId) newData.testTemplateId = testTemplateId

        if (testSettingsId) newData.testSettingsId = testSettingsId

        if (users) {
            try {
                newData.users = {
                    create: users.map((user) => ({
                        user: {
                            connect: {id: user}
                        }
                    }))
                }
            } catch (e) {
                return res.status(400).json({error: 'Невозможно распарсить массив'});
            }
        }

        if (groups) {
            try {
                newData.groups = {
                    connect: [...groups.map((num: number) => ({id: num}))]
                }
            } catch (e) {
                return res.status(400).json({error: 'Невозможно распарсить массив'});
            }
        }

        if (Object.keys(newData).length === 0) {
            return res.status(400).json({error: 'Нет данных для обновления'})
        }

        let deleteData: any = {};
        if (users) {
            deleteData.users = {deleteMany: {}}
        }
        if (groups) {
            deleteData.groups = {set: []}
        }

        let testAssign: any;
        try {
            testAssign = await client.$transaction([
                client.testAssign.update({
                    where: {
                        id: id
                    },
                    data: deleteData,
                    include: {
                        groups: true,
                        users: true
                    }
                }),
                client.testAssign.update({
                    where: {
                        id: id
                    },
                    data: newData,
                    include: {
                        groups: true,
                        users: true
                    }
                })
            ]);
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(testAssign[1])
    }
}