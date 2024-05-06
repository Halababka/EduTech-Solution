import type {Question, QuestionTypes, Subject, Topic, Folder} from '@prisma/client'
import {Request, Response} from 'express'
import {client} from '../../db.js'
import dbErrorsHandler from "../../utils/dbErrorsHandler.js";

interface QuestionRequestBody {
    text: string;
    subjects: number[];
    type: QuestionTypes;
    level: number;
}

export class TestValidates {
    async validateSubject(req: Request, res: Response, next: Function) {
        const {name, topicId} = req.body as Subject;
        if (req.body.hasOwnProperty('name')) {
            if (typeof name !== 'string') {
                return res.status(400).json({message: 'Название должно быть строкой'});
            }
            if (name.length < 3) {
                return res.status(400).json({message: 'Название слишком короткое'});
            }
        }

        if (req.body.hasOwnProperty('topicId')) {
            if (typeof topicId !== 'number') {
                return res.status(400).json({message: 'topicId должно быть числом'});
            }
        }

        next()
    }

    async validateTopic(req: Request, res: Response, next: Function) {
        const {name, folderId} = req.body as Topic;
        if (req.body.hasOwnProperty('name')) {
            if (typeof name !== 'string') {
                return res.status(400).json({message: 'Название должно быть строкой'});
            }
            if (name.length < 3) {
                return res.status(400).json({message: 'Название слишком короткое'});
            }
        }

        if (req.body.hasOwnProperty('folderId')) {
            if (typeof folderId !== 'number') {
                return res.status(400).json({message: 'folderId должно быть числом'});
            }
        }

        next()
    }

    async validateFolder(req: Request, res: Response, next: Function) {
        const {name, topics} = req.body;

        if (req.body.hasOwnProperty('topics')) {
            if (!Array.isArray(topics) || !topics.every(el => typeof el === "number")) {
                return res.status(400).json({error: `Темы должны быть массивом и содержать ID тем.`});
            }

            try {
                const topicsCheck = await client.topic.findMany({
                    where: {
                        OR: topics.map(num => ({id: num}))
                    },
                });
                if (topicsCheck.length !== topics.length) {
                    return res.status(400).json({error: "Одна или несколько указанных тем не существуют"})
                }
            } catch (e) {
                return res.status(500).json({error: dbErrorsHandler(e)})
            }
        }

        if (req.body.hasOwnProperty('name')) {
            if (typeof name !== 'string') {
                return res.status(400).json({message: 'Название должно быть строкой'});
            }
            if (name.length < 3) {
                return res.status(400).json({message: 'Название слишком короткое'});
            }
        }

        next()
    }

    async vaildateQuestion(req: Request, res: Response, next: Function) {
        const {text, subjects, type, level}: QuestionRequestBody = req.body;
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
        if (level) {
            if (typeof level !== 'number') {
                return res.status(400).json({message: 'Сложность вопроса должен быть целым числом'});
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