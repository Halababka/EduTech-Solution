import type {Question, QuestionTypes, Subject} from '@prisma/client'
import {Request, Response} from 'express'
import {client} from '../../db.js'
import dbErrorsHandler from "../../utils/dbErrorsHandler.js";

interface QuestionRequestBody {
    text: string;
    subjects: number[];
    type: QuestionTypes;
}

const isSubjectExist = async (res: Response, name: string) => {
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

export class TestValidates {
    async validateSubject(req: Request, res: Response, next: Function) {
        const {name} = req.body as Subject;

        if (req.body.hasOwnProperty('name')) {
            if (!name || typeof name !== 'string') {
                return res.status(400).json({message: 'Необходимо указать название темы'});
            }

            if (name.length < 3) {
                return res.status(400).json({message: 'Название темы слишком короткое'});
            }

            if (await isSubjectExist(res, name)) {
                return res.status(409).json({error: 'Такая тема уже существует'})
            }
        }

        next()
    }

    async vaildateQuestion(req: Request, res: Response, next: Function) {
        const {text, subjects, type}: QuestionRequestBody = req.body;
        const allowedTypes = ['ONE_ANSWER', 'MANY_ANSWERS', 'TEXT_ANSWER']
        const id: number = parseInt(req.params.id);

        if (text) {
            if (typeof text !== 'string') {
                return res.status(400).json({message: 'Текст вопроса должен быть строкой'});
            }

            if ((text.split(" ").join("")) === '') {
                return res.status(400).json({error: 'Необходимо указать текст вопроса'})
            }

            if (text.split(" ").join("").length < 3) {
                return res.status(400).json({message: 'Вопрос слишком короткий'});
            }
        }

        if (type) {
            if (!allowedTypes.includes(type)) {
                return res.status(400).json({error: `Тип ${type} не разрешен.`});
            }
        }
        if (subjects) {
            if (!Array.isArray(subjects) || !subjects.every(el => typeof el === "number")) {
                return res.status(400).json({error: `Темы должны быть массивом и содержать ID тем.`});
            }

            try {
                const subjectCheck = await client.subject.findMany({
                    where: {
                        OR: subjects.map(num => ({id: num}))
                    },
                });
                if (subjectCheck.length !== subjects.length) {
                    res.status(400).json({error: "Одна или несколько указанных тем не существуют"})
                }
            } catch (e) {
                res.status(500).json({error: dbErrorsHandler(e)})
                return
            }
        }

        let question: Question;
        if (id) {
            try {
                question = await client.question.findUnique({
                    include: {
                        subjects: true,
                    },
                    where: {
                        id: id
                    }
                })
            } catch (e) {
                return res.status(500).json({error: dbErrorsHandler(e)})
            }

            if (!question) {
                return res.status(404).json({error: "Вопрос не найден"})
            }
        }

        next()
    }

    vaildateAnswers(req: Request, res: Response, next: Function) {
        const {type, content, correct} = req.body;
        const allowedTypes = ['TEXT', 'IMAGE']

        if (correct) {
            if (typeof correct !== 'boolean') {
                return res.status(400).json({error: 'Correct должен быть boolean'});
            }
        }
        if (content) {
            if (typeof content !== 'string') {
                return res.status(400).json({error: 'Content должен быть строкой'});
            }
        }

        if (type) {
            if (!allowedTypes.includes(type)) {
                return res.status(400).json({error: `Тип ${type} не разрешен.`});
            }
        }

        next()
    }
}