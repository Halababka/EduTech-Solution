import {client} from '../db.js';
import dbErrorsHandler from "../utils/dbErrorsHandler.js";
import {Request, Response} from 'express'

import type {Subject} from '@prisma/client'


const isSubjectExist = async (res, name) => {
    try {
        const results = await client.subject.findMany({
            where: {
                name: name,
            },
        });
        return Boolean(results.length);
    } catch (e) {
        res.status(500).json({error: dbErrorsHandler(e)})
    }
}

export class TestsController {
    async getTest(req: Request, res: Response) {
        res.json(1);
    }

    async getQuestion(req: Request, res: Response) {
        const questions = await client.question.findMany({
            include: {
                subjects: true,
            },
        })
        res.json(questions);
    }

    async createQuestion(req: Request, res: Response) {
        const {text, subjects, type} = req.body;
        const allowedTypes = ['ONE_ANSWER', 'MANY_ANSWERS', 'TEXT_ANSWER'];
        let transformedSubjects, finalType;

        if (type) {
            if (!allowedTypes.includes(type)) {
                return res.status(400).json({error: `Тип ${type} не разрешен.`});
            } else {
                finalType = type
            }
        } else {
            finalType = 'ONE_ANSWER'
        }

        if (!text) {
            return res.status(400).json({error: 'Необходимо указать текст вопроса'});
        }

        if (typeof text !== 'string') {
            return res.status(400).json({error: 'Текст вопроса должен быть строкой'});
        }

        if ((text.split(" ").join("")) === '') {
            return res.status(400).json({error: 'Необходимо указать текст вопроса'})
        }

        // Проверка, что subjects является массивом
        if (!Array.isArray(subjects)) {
            return res.status(400).json({error: 'Темы вопроса должны быть массивом'});
        }

        if (!subjects) {
            transformedSubjects = []
        } else {
            transformedSubjects = subjects.map(num => ({id: num}))
        }

        const question = await client.question.create({
                data: {
                    name: text,
                    subjects: {
                        connect: transformedSubjects,
                    },
                    type: finalType
                },
            })
        ;
        res.json(question);
    }

    async createSubject(req: Request, res: Response) {
        const {name} = req.body as Subject;

        if (!name) {
            res.status(400).json({error: 'Необходимо указать название темы'})
            return
        }

        if ((name.split(" ").join("")) === '') {
            res.status(400).json({error: 'Необходимо указать название темы'})
            return
        }

        if (await isSubjectExist(res, name)) {
            res.status(409).json({error: 'Такая тема уже существует'})
            return
        }

        let newSubject;
        try {
            newSubject = await client.subject.create({
                data: {
                    name: name
                },
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }
        res.json(newSubject);
    }

    async getSubjects(req: Request, res: Response) {
        const subjects = await client.subject.findMany()
        res.json(subjects);
    }

    async updateSubjects(req: Request, res: Response) {
        const {name} = req.body;
        const id = parseInt(req.params.id);

        let subject;
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

        if (await isSubjectExist(res, name)) {
            res.status(409).json({error: 'Тема с таким названием уже существует'})
            return
        }

        subject = await client.subject.update({
            where: {
                id: id,
            },
            data: {
                name: name,
            },
        })

        res.json(subject)
    }
}