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
        const {text, subjectId, type, level} = req.body;
        const allowedTypes = ['ONE_ANSWER', 'MANY_ANSWERS', 'TEXT_ANSWER'];
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
        if (req.body.hasOwnProperty('subjectId')) {
            if (typeof subjectId !== 'number') {
                return res.status(400).json({error: 'subjectId должно быть числом'});
            }
            try {
                const result = await client.subject.findUnique({
                    where: {
                        id: subjectId
                    },
                    include: {
                        children: true
                    }
                })
                if (!result) {
                    return res.status(404).json({error: 'Тема (subjectId) не найдена'})
                }
                if (result.children.length > 0) {
                    return res.status(400).json({error: 'Нельзя создать вопрос в этой теме'})
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

    validateAnswers(req: Request, res: Response, next: Function) {
        const {answers, type} = req.body;

        const allowedTypes = ['TEXT', 'IMAGE']

        let one_answer = false

        try {
            answers.forEach((item, id) => {
                if (item.correct) {
                    if (typeof item.correct !== 'boolean') {
                        throw new Error('correct должно быть boolean')
                    }
                }

                if (item.content) {
                    if (typeof item.content !== 'string') {
                        throw new Error('Content должен быть строкой')
                    }
                }

                if (item.type) {
                    if (!allowedTypes.includes(item.type)) {
                        throw new Error(`Тип ${item.type} не разрешен.`)
                    }
                }

                if (type === 'ONE_ANSWER') {
                    if ((item.correct && one_answer) || (!one_answer && (id === answers.length - 1) && !item.correct)) {
                        console.log(one_answer)
                        throw new Error('Допустим только один правильный ответ.')
                    }
                    if (item.correct) {
                        one_answer = true
                    }
                }
            })
        } catch (e) {
            return res.status(400).json({error: e.message})
        }

        next()
    }

    async validateTemplate(req: Request, res: Response, next: Function) {
        const {name, subjects} = req.body;
        const id = parseInt(req.params.id)


        if (id) {
            if (typeof id === 'number' && id > 0) {
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
        const id = parseInt(req.params.id)

        if (id) {
            if (typeof id === 'number' && id > 0) {

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
            console.log(startTime)
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

    async validateAssign(req: Request, res: Response, next: Function) {
        const {name, testTemplateId, testSettingsId, users, groups} = req.body;
        const id = parseInt(req.params.id);

        if (id) {
            if (typeof id === 'number' && id > 0) {

                try {
                    const templateCheck = await client.testAssign.findUnique({
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
        }


        if (req.body.hasOwnProperty('name')) {
            if (typeof name !== 'string') {
                return res.status(400).json({error: 'Название должно быть строкой'});
            }
            if (name.length < 3) {
                return res.status(400).json({error: 'Название слишком короткое'});
            }
        }
        if (testTemplateId) {
            if (typeof testTemplateId !== 'number') {
                return res.status(400).json("testTemplateId должно быть числом")
            }
        }
        if (testSettingsId) {
            if (typeof testSettingsId !== 'number') {
                return res.status(400).json("testSettingsId должно быть числом")
            }
        }
        if (req.body.hasOwnProperty('users')) {
            if (!Array.isArray(users) || !users.every(el => typeof el === "number")) {
                return res.status(400).json({error: `users должны быть массивом и содержать ID тем.`});
            }

            try {
                const usersCheck = await client.user.findMany({
                    where: {
                        OR: users.map(num => ({id: num}))
                    },
                });
                if (usersCheck.length !== users.length) {
                    return res.status(400).json({error: "Один или несколько указанных пользователей не существуют"})
                }
            } catch (e) {
                return res.status(500).json({error: dbErrorsHandler(e)})
            }
        }
        if (req.body.hasOwnProperty('groups')) {
            if (!Array.isArray(groups) || !groups.every(el => typeof el === "number")) {
                return res.status(400).json({error: `groups должны быть массивом и содержать ID тем.`});
            }

            try {
                const groupsCheck = await client.groups.findMany({
                    where: {
                        OR: groups.map(num => ({id: num}))
                    },
                });
                if (groupsCheck.length !== groups.length) {
                    return res.status(400).json({
                        error: "Одна или несколько указанных групп не существуют"
                    });
                }
            } catch (e) {
                return res.status(500).json({error: dbErrorsHandler(e)})
            }
        }
        next()
    }

    async validateNextQuestion(req: Request, res: Response, next: Function) {
        const {ids, text_answer} = req.body;

        if (ids) {
            if (!(Array.isArray(ids) && ids.every(Number.isInteger))) {
                return res.status(400).json({error: "ids должно быть массивом чисел"})
            }
        }

        if (text_answer) {
            if (typeof text_answer !== 'string') {
                return res.status(400).json({error: "text_answer должен быть строкой"})
            }
        }
        next()
    }
}