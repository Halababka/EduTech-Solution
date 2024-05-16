import type {Question, QuestionTypes, Subject} from '@prisma/client'
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
        const {name, parentId, children} = req.body;
        if (req.body.hasOwnProperty('name')) {
            if (typeof name !== 'string') {
                return res.status(400).json({error: 'Название должно быть строкой'});
            }
            if (name.length < 3) {
                return res.status(400).json({error: 'Название слишком короткое'});
            }
        }

        if (req.body.hasOwnProperty('parentId')) {
            if (typeof parentId !== 'number') {
                return res.status(400).json({error: 'parentId должно быть числом'});
            }
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
                return res.status(404).json({error: 'Тема (parentId) не найдена'})
            }
        }

        if (req.body.hasOwnProperty('children')) {
            if (!Array.isArray(children) || !children.every(el => typeof el === "number")) {
                return res.status(400).json({error: `children должны быть массивом и содержать ID тем.`});
            }

            try {
                const childrenCheck = await client.subject.findMany({
                    where: {
                        OR: children.map(num => ({id: num}))
                    },
                });
                if (childrenCheck.length !== children.length) {
                    return res.status(400).json({error: "Одна или несколько указанных подтем не существуют"})
                }
            } catch (e) {
                return res.status(500).json({error: dbErrorsHandler(e)})
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
                return res.status(400).json({error: 'Текст вопроса должен быть строкой'});
            }

            if ((text.split(" ").join("")) === '') {
                return res.status(400).json({error: 'Необходимо указать текст вопроса'})
            }

            if (text.split(" ").join("").length < 3) {
                return res.status(400).json({error: 'Вопрос слишком короткий'});
            }
        }
        if (level) {
            if (typeof level !== 'number') {
                return res.status(400).json({error: 'Сложность вопроса должен быть целым числом'});
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

    async validateTemplate(req: Request, res: Response, next: Function) {
        const {name, subjects} = req.body;

        if (typeof parseInt(req.params.id) === 'number') {

            try {
                const templateCheck = await client.testTemplate.findUnique({
                    where: {
                        id: parseInt(req.params.id),
                    }
                });
                if (!templateCheck) {
                    return res.status(404).json({error: "id не найден"})
                }
            } catch (e) {
                return res.status(500).json({error: dbErrorsHandler(e)})
            }
        } else {
            return res.status(400).json({error: 'id должно быть целым числом'});
        }

        if (req.body.hasOwnProperty('name')) {
            if (typeof name !== 'string') {
                return res.status(400).json({error: 'Название должно быть строкой'});
            }
            if (name.length < 3) {
                return res.status(400).json({error: 'Название слишком короткое'});
            }
        }

        if (req.body.hasOwnProperty('subjects')) {
            if (!Array.isArray(subjects) || !subjects.every(el => typeof el === "number")) {
                return res.status(400).json({error: `subjects должны быть массивом и содержать ID тем.`});
            }

            try {
                const childrenCheck = await client.subject.findMany({
                    where: {
                        OR: subjects.map(num => ({id: num}))
                    },
                });
                if (childrenCheck.length !== subjects.length) {
                    return res.status(400).json({error: "Одна или несколько указанных подтем не существуют"})
                }
            } catch (e) {
                return res.status(500).json({error: dbErrorsHandler(e)})
            }
        }

        next()
    }

    async validateSettings(req: Request, res: Response, next: Function) {
        const {name, startTime, endTime, duration, attemptsCount, assessmentMethod, initialDifficulty} = req.body;

        if (typeof parseInt(req.params.id) === 'number') {

            try {
                const templateCheck = await client.testSettings.findUnique({
                    where: {
                        id: parseInt(req.params.id),
                    }
                });
                if (!templateCheck) {
                    return res.status(404).json({error: "id не найден"})
                }
            } catch (e) {
                return res.status(500).json({error: dbErrorsHandler(e)})
            }
        } else {
            return res.status(400).json({error: 'id должно быть целым числом'});
        }

        if (req.body.hasOwnProperty('name')) {
            if (typeof name !== 'string') {
                return res.status(400).json({error: 'Название должно быть строкой'});
            }
            if (name.length < 3) {
                return res.status(400).json({error: 'Название слишком короткое'});
            }
        }
        if (startTime) {
            if (new Date(startTime).toString() === 'Invalid Date') {
                return res.status(400).json({error: 'Время и дата начала содержит не корректный формат'});
            }
        }
        if (endTime) {
            if (new Date(endTime).toString() === 'Invalid Date') {
                return res.status(400).json({error: 'Время и дата окончания содержит не корректный формат'});
            }
        }
        if (duration) {
            if (typeof duration !== 'number') {
                return res.status(400).json({error: 'Content должен быть числом'});
            }
        }
        if (attemptsCount) {
            if (typeof attemptsCount !== 'number') {
                return res.status(400).json({error: 'attemptsCount должен быть числом'});
            }
        }
        if (assessmentMethod) {
            if (typeof assessmentMethod !== 'number') {
                return res.status(400).json({error: 'assessmentMethod должен быть числом'});
            }
        }
        if (initialDifficulty) {
            if (typeof initialDifficulty !== 'number') {
                return res.status(400).json({error: 'initialDifficulty должен быть числом'});
            }
        }
        next()
    }
}