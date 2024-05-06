import {client} from '../db.js';
import dbErrorsHandler from "../utils/dbErrorsHandler.js";
import {Request, Response} from 'express'

import type {Subject, Question, QuestionTypes, Answer, AnswerTypes, Topic, Folder} from '@prisma/client'

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
        const {text, subjects, type, level} = req.body;
        let transformedSubjects: Subject[], finalType: QuestionTypes;

        if (!text) {
            return res.status(400).json({error: 'Необходимо указать текст вопроса'});
        }

        finalType = type ? type : 'ONE_ANSWER'

        if (!subjects) {
            transformedSubjects = []
        } else {
            try {
                const subjectCheck = await client.subject.findMany({
                    where: {
                        OR: subjects.map((num: number) => ({id: num}))
                    },
                });
                if (subjectCheck.length !== subjects.length) {
                    return res.status(400).json({error: "Темы, с указанными ID не существуют"})
                } else {
                    transformedSubjects = subjects.map((num: number) => ({id: num}))
                }
            } catch (e) {
                res.status(500).json({error: dbErrorsHandler(e)})
                return
            }
        }
        const data = {
            text: text,
            subjects: {
                connect: transformedSubjects,
            },
            type: finalType
        }
        if (level) data['level'] = level
        const question: Question = await client.question.create({
            data: data,
            include: {
                subjects: true
            }
        });
        res.json(question);
    }

    async getQuestion(req: Request, res: Response) {
        const questions: Question[] = await client.question.findMany({
            include: {
                subjects: true,
            },
        })
        res.json(questions);
    }

    async updateQuestion(req: Request, res: Response) {
        const {text, subjects, type, level} = req.body;
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

        if (subjects) {
            try {
                newData.subjects = {
                    set: [...subjects.map((num: number) => ({id: num}))]
                }
            } catch (e) {
                return res.status(400).json({error: 'Невозможно распарсить массив'});
            }
        }

        if (Object.keys(newData).length === 0) {
            return res.status(400).json({error: 'Нет данных для изменения'})
        }

        const updatedQuestion = await client.question.update({
            include: {
                subjects: true
            },
            where: {id: id},
            data: newData,
        });

        return res.json(updatedQuestion)

    }

    async createSubject(req: Request, res: Response) {
        const {name, topicId} = req.body as Subject;

        if (!req.body.hasOwnProperty('name')) {
            return res.status(400).json({error: 'Одно или несколько обязательных полей отсуствуют'})
        }

        const data = {
            name: name
        }

        if (topicId) {
            data['topicId'] = topicId

            let result: Topic;
            try {
                result = await client.topic.findUnique({
                    where: {
                        id: topicId,
                    },
                })
            } catch (e) {
                res.status(500).json({error: dbErrorsHandler(e)})
                return
            }
            if (!result) {
                return res.status(404).json({error: 'Topic не найден'})
            }
        }


        let newSubject: Subject;
        try {
            newSubject = await client.subject.create({
                data: data,
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
        const {name, topicId} = req.body as Subject;
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

        const data = {}
        if (name) {
            data['name'] = name
        }

        if (topicId) {
            data['topicId'] = topicId

            let result: Topic;
            try {
                result = await client.topic.findUnique({
                    where: {
                        id: topicId,
                    },
                })
            } catch (e) {
                res.status(500).json({error: dbErrorsHandler(e)})
                return
            }
            if (!result) {
                return res.status(404).json({error: 'Topic не найден'})
            }
        }

        try {
            subject = await client.subject.update({
                where: {
                    id: id,
                },
                data: data,
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        res.json(subject)
    }

    async createTopic(req: Request, res: Response) {
        const {name, folderId, subjects} = req.body;

        if (!req.body.hasOwnProperty('name')) {
            return res.status(400).json({error: 'Одно или несколько обязательных полей отсуствуют'})
        }

        const data = {
            name: name
        }

        if (subjects) {
            data['subjects'] = {};
            data['subjects']['connect'] = subjects.map((num: number) => ({id: num}))
        }
        if (folderId) {
            data['folderId'] = folderId

            let result: Folder;
            try {
                result = await client.folder.findUnique({
                    where: {
                        id: folderId,
                    },
                })
            } catch (e) {
                res.status(500).json({error: dbErrorsHandler(e)})
                return
            }
            if (!result) {
                return res.status(404).json({error: 'Folder не найден'})
            }
        }

        let newTopic: Topic;
        try {
            newTopic = await client.topic.create({
                data: data,
                include: {
                    subjects: true
                }
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }
        res.json(newTopic);
    }

    async getTopics(req: Request, res: Response) {
        let topics: Topic[];
        try {
            topics = await client.topic.findMany()
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(topics);
    }

    async updateTopic(req: Request, res: Response) {
        const {name, folderId, subjects} = req.body;
        const id = parseInt(req.params.id);

        let topic: Topic;
        try {
            topic = await client.topic.findUnique({
                where: {
                    id: id,
                },
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        if (!topic) {
            res.status(404).json({error: 'Такой темы нет'})
            return
        }

        const data = {}
        if (name) {
            data['name'] = name
        }

        if (subjects) {
            data['subjects'] = {};
            data['subjects']['connect'] = subjects.map((num: number) => ({id: num}))
        }

        if (folderId) {
            data['folderId'] = folderId

            let result: Folder;
            try {
                result = await client.folder.findUnique({
                    where: {
                        id: folderId,
                    },
                })
            } catch (e) {
                res.status(500).json({error: dbErrorsHandler(e)})
                return
            }
            if (!result) {
                return res.status(404).json({error: 'Folder не найден'})
            }
        }

        try {
            topic = await client.topic.update({
                where: {
                    id: id,
                },
                data: data,
                include: {
                    subjects: true
                }
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        res.json(topic)
    }

    async createFolder(req: Request, res: Response) {
        const {name, topics} = req.body;

        if (!req.body.hasOwnProperty('name')) {
            return res.status(400).json({error: 'Одно или несколько обязательных полей отсуствуют'})
        }

        const data = {
            name: name
        }

        if (topics) {
            data['topics'] = {};
            data['topics']['connect'] = topics.map((num: number) => ({id: num}))
        }

        let newFolder: Folder;
        try {
            newFolder = await client.folder.create({
                data: data,
                include: {
                    topics: true,
                }
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }
        res.json(newFolder);
    }

    async getFolders(req: Request, res: Response) {
        let folders: Folder[];
        try {
            folders = await client.folder.findMany({
                include: {
                    topics: true
                }
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(folders);
    }

    async updateFolder(req: Request, res: Response) {
        const {name, topics} = req.body;
        const id = parseInt(req.params.id);

        let folder: Folder;
        try {
            folder = await client.folder.findUnique({
                where: {
                    id: id,
                },
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        if (!folder) {
            res.status(404).json({error: 'Такой папки нет'})
            return
        }

        const data = {
            name: name
        }

        if (topics) {
            data['topics'] = {};
            data['topics']['connect'] = topics.map((num: number) => ({id: num}))
        }

        try {
            folder = await client.folder.update({
                where: {
                    id: id,
                },
                data: data,
                include: {
                    topics: true,
                }
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(folder)
    }

}