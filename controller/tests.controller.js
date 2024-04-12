import {client} from '../db.js';
import dbErrorsHandler from "../utils/dbErrorsHandler.js";
import typeCheck from "../utils/typeCheck.js";
import {json} from "express";

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

const checkQuestionTypes = async (type) => {
    const allowedTypes = ['ONE_ANSWER', 'MANY_ANSWERS', 'TEXT_ANSWER'];
    if (!allowedTypes.includes(type)) {
        return {error: `Тип ${type} не разрешен.`};
    } else {
        return type
    }
}

export class TestsController {
    async getTest(req, res) {
        res.json(1);
    }

    async createQuestion(req, res) {
        const {text, subjects, type} = req.body;
        let transformedSubjects, finalType;

        if (!text) {
            return res.status(400).json({error: 'Необходимо указать текст вопроса'});
        }
        if (!typeCheck(text, 'string')) {
            return res.status(400).json({error: 'Текст вопроса должен быть строкой'});
        }
        if ((text.split(" ").join("")) === '') {
            return res.status(400).json({error: 'Необходимо указать текст вопроса'})
        }

        if (type) {
            const typeCheckResult = await checkQuestionTypes(type)
            if (typeCheckResult.error) {
                return res.status(400).json({error: `Тип ${type} не разрешен.`});
            } else {
                finalType = typeCheckResult
            }
        } else {
            finalType = 'ONE_ANSWER'
        }

        // Проверка, что subjects является массивом
        if (!typeCheck(subjects, 'Array')) {
            return res.status(400).json({error: 'Темы вопроса должны быть массивом'});
        }

        if (!subjects) {
            transformedSubjects = []
        } else {
            try {
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

            } catch (e) {
                return res.status(400).json({error: 'Невозможно распарсить массив'});
            }
        }

        const question = await client.question.create({
            data: {
                text: text,
                subjects: {
                    connect: transformedSubjects,
                },
                type: finalType
            },
        });
        res.json(question);
    }

    async getQuestion(req, res) {
        const questions = await client.question.findMany({
            include: {
                subjects: true,
            },
        })
        res.json(questions);
    }

    async updateQuestion(req, res) {
        const {text, subjects, type} = req.body;
        const id = parseInt(req.params.id);

        const newData = {}

        let question;
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

        if (text) {
            if (!typeCheck(text, 'string')) {
                return res.status(400).json({error: 'Текст вопроса должен быть строкой'});
            }
            if ((text.split(" ").join("")) === '') {
                return res.status(400).json({error: 'Необходимо указать текст вопроса'})
            }
        }

        if (type) {
            const typeCheckResult = await checkQuestionTypes(type)
            if (typeCheckResult.error) {
                return res.status(400).json({error: `Тип ${type} не разрешен.`});
            }
        }

        if (subjects) {
            if (!typeCheck(subjects, 'Array')) {
                return res.status(400).json({error: 'Темы вопроса должны быть массивом'});
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

            try {
                newData.subjects = subjects.map(num => ({id: num}))
            } catch (e) {
                return res.status(400).json({error: 'Невозможно распарсить массив'});
            }
        }

        text ? newData.text = text : newData.text = question.text
        subjects ? newData.subjects = subjects.map(num => ({id: num})) : newData.subjects = question.subjects
        type ? newData.type = type : newData.type = question.type

        // res.json(newData);

        const updatedQuestion = await client.question.update({
            include: {
                subjects: true
            },
            where: {id: id},
            data: {
                text: newData.text,
                type: newData.type,
                subjects: {
                    set: newData.subjects,
                },
            },
        });

        return res.status(400).json(updatedQuestion)

    }

    async createSubject(req, res) {
        const {name} = req.body;

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

    async getSubjects(req, res) {
        let subjects;
        try {
            subjects = await client.subject.findMany()
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        res.json(subjects);
    }

    async updateSubjects(req, res) {
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

        if ((name.split(" ").join("")) === '') {
            res.status(400).json({error: 'Необходимо указать название темы'})
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