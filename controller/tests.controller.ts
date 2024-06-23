import {client} from '../db.js';
import dbErrorsHandler from "../utils/dbErrorsHandler.js";
import {Request, Response} from 'express'
import {sendNotificationToUsers} from "../notificationSocket"

import type {
    Subject,
    Question,
    QuestionTypes,
    Answer,
    AnswerTypes,
    TestTemplate,
    TestSettings, TestAssign
} from '@prisma/client'

const debug = true

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

async function fetchSubjectsWithChildren(subjectId) {
    const subject = await client.subject.findUnique({
        where: {id: subjectId},
        include: {
            questions: {
                include: {
                    answers: true
                }
            },
            children: true
        }
    });
    if (subject.children.length > 0) {
        subject.children = await Promise.all(
            subject.children.map(child => fetchSubjectsWithChildren(child.id))
        );
    }
    return subject;
}

function createAnswerObject(selected, question) {
    if (question.type !== 'TEXT_ANSWER') {
        return question.answers.map(answer => {
            return {
                // "id": answer.id,
                "content": answer.content,
                "type": answer.type,
                "correct": answer.correct,
                "selected": selected.ids.includes(answer.id),
                "AnsweredCorrectly": answer.correct && selected.ids.includes(answer.id)
            }
        })
    } else {
        return [{
            // id: question.answers[0].id,
            content: question.answers[0].content,
            answeredContent: selected.text_answer,
            type: question.answers[0].type,
            correct: question.answers[0].correct,
            selected: selected.text_answer === question.answers[0].content,
            AnsweredCorrectly: selected.text_answer === question.answers[0].content
        }]
    }
}

function checkAnswerCorrect(selected, question) {
    if (question.type === 'TEXT_ANSWER') {
        return question.answers[0].content === selected.text_answer;
    } else if (question.type === 'MANY_ANSWERS') {
        // Получаем массив правильных ответов из вопроса
        const correctAnswers = question.answers.filter(answer => answer.correct).map(answer => answer.id);

        // Проверяем, что все выбранные ответы правильные
        const allSelectedCorrect = selected.ids.every(id => correctAnswers.includes(id));

        // Проверяем, что количество выбранных правильных ответов совпадает с количеством правильных ответов
        const allCorrectSelected = correctAnswers.every(id => selected.ids.includes(id));

        return allSelectedCorrect && allCorrectSelected;
    } else if (question.type === 'ONE_ANSWER') {
        // Проверяем, что выбран ровно один ответ и он правильный
        return selected.ids.length === 1 && question.answers.some(answer => answer.id === selected.ids[0] && answer.correct);
    } else {
        return false;
    }
}

function findQuestionByDifficulty(questions, currentDifficulty) {
    let closestQuestion = null;
    let closestDifference = Infinity;

    questions.forEach(question => {
        const difficultyDifference = Math.abs(question.level - currentDifficulty);
        if (difficultyDifference < closestDifference) {
            closestDifference = difficultyDifference;
            closestQuestion = question;
        }
    });

    return closestQuestion;
}

async function getBreadcrumb(subjectId) {
    const breadcrumb = [];
    let currentSubject: any = await client.subject.findUnique({where: {id: subjectId}, include: {parent: true}});

    while (currentSubject) {
        breadcrumb.unshift({label: currentSubject.name});
        currentSubject = currentSubject.parent;
    }

    return breadcrumb;
}

async function collectQuestions(assign) {
    const result = [];
    let answerIdCounter = 1;

    for (let i = 0; i < assign.length; i++) {
        const subjectsSettings = assign[i].assign.testTemplate.subjectsSettings;
        for (let j = 0; j < subjectsSettings.length; j++) {
            const questions = subjectsSettings[j].Subject.questions;
            for (let k = 0; k < questions.length; k++) {
                const question = questions[k];

                // Получение breadcrumbs для текущего вопроса
                const breadcrumb = await getBreadcrumb(question.subjectId);

                const transformedQuestion = {
                    id: question.id,
                    text: question.text,
                    type: question.type,
                    level: question.level,
                    subjectId: question.subjectId,
                    breadcrumb: breadcrumb, // Добавление breadcrumbs
                    answers: question.answers ? question.answers.map(answer => ({
                        id: answerIdCounter++,
                        content: answer.content,
                        type: "TEXT",
                        correct: answer.correct,
                        questionId: question.id,
                        exQuestionId: null
                    })) : []
                };
                result.push(transformedQuestion);
            }
        }
    }

    return result;
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

        const subjectNames = await client.subject.findMany({})

        // Создаем словарь для быстрого поиска имени темы по id
        const themeMap = subjectNames.reduce((map, theme) => {
            map[theme.id] = theme.name;
            return map;
        }, {});

        // Обновляем массив newSubjects, добавляя поле subjectName
        const newSubjects = subjects.map(subject => {
            const {name, ...rest} = subject;
            return {
                ...rest,
                subjectId: subject.subjectId,
                subjectName: themeMap[subject.subjectId] || 'Неизвестная тема'
            };
        });

        if (subjects) {
            try {
                newData.subjectsSettings = {
                    create: newSubjects
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
                    subjectsSettings: true
                }
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.status(201).json(template)
    }

    async getTestTemplates(req: Request, res: Response) {

        let templates: TestTemplate[]
        try {
            templates = await client.testTemplate.findMany({
                include: {
                    subjectsSettings: true
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

        let template: TestTemplate
        try {
            template = await client.testTemplate.findUnique({
                where: {
                    id: id
                },
                include: {
                    subjectsSettings: true
                }
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        let subjectsList: subject[]
        try {
            subjectsList = await client.subject.findMany()
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }
        let queries = [];

        if (subjects) {

            // Массивы для разделения
            let newRecords = [];
            let updatedRecords = [];
            let deletedRecords = [];

            // Индексировать существующие записи по subjectId для удобства
            let existingSubjectsMap = {};
            template.subjectsSettings.forEach(subject => {
                existingSubjectsMap[subject.subjectId] = subject;
            });

            // Найти новые и обновленные записи
            subjects.forEach(subject => {
                const existingSubject = existingSubjectsMap[subject.subjectId];
                if (existingSubject) {
                    // Проверка на изменения данных
                    if (existingSubject.initialDifficulty !== subject.initialDifficulty ||
                        existingSubject.totalQuestions !== subject.totalQuestions ||
                        existingSubject.threshold !== subject.threshold) {
                        updatedRecords.push(subject);
                    }
                    // Удаляем найденные записи из existingSubjectsMap
                    delete existingSubjectsMap[subject.subjectId];
                } else {
                    // Новые записи
                    newRecords.push(subject);
                }
            });

            // Оставшиеся записи в existingSubjectsMap являются удаленными
            deletedRecords = Object.values(existingSubjectsMap).map(subject => subject.subjectId);

            deletedRecords.length !== 0 && (function deleteQuery() {
                queries.push(client.testTemplateSubjects.deleteMany({
                    where: {
                        subjectId: {
                            in: deletedRecords,
                        },
                        testTemplateId: id,
                    },
                }))
            })();

            newRecords.length !== 0 && (function insertQuery() {
                const newSubjectList = newRecords.map(newRecords => {
                    const subjectInfo = subjectsList.find(sub => sub.id === newRecords.subjectId);
                    return {
                        ...newRecords,
                        testTemplateId: id,
                        subjectName: subjectInfo ? subjectInfo.name : 'Unknown'
                    };
                });
                queries.push(client.testTemplateSubjects.createMany({data: newSubjectList}))
            })();

            updatedRecords.length !== 0 && (function updateQuery() {
                for (const update of updatedRecords) {
                    queries.push(client.testTemplateSubjects.updateMany({
                        where: {
                            subjectId: update.subjectId,
                            testTemplateId: id,
                        },
                        data: {
                            initialDifficulty: update.initialDifficulty,
                            totalQuestions: update.totalQuestions,
                            threshold: update.threshold,
                        },
                    }))
                }
            })();
        }

        let updateTemplateName = client.testTemplate.update({
            where: {id: id},
            data: newData,
            include: {
                subjectsSettings: true
            }
        });

        if (newData.length !== 0) {
            queries.push(updateTemplateName); // Spread the array here
        }

        let updatedTemplate;
        try {
            updatedTemplate = await client.$transaction(queries);
        } catch (e) {
            return res.status(500).json({error: dbErrorsHandler(e)});
        }
        return res.json(updatedTemplate[updatedTemplate.length - 1]);
    }

    async deleteTestTemplate(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        try {
            await client.$transaction([
                client.testTemplateSubjects.deleteMany({
                    where: {
                        testTemplateId: id
                    }
                }),
                client.testTemplate.deleteMany({
                    where: {
                        id: id
                    }
                })
            ]);
        } catch (e) {
            return res.status(500).json({error: dbErrorsHandler(e)});
        }
        return res.json({status: 'Ok'});
    }

    async createTestSettings(req: Request, res: Response) {
        const {name, startTime, endTime, duration, attemptsCount, assessmentMethod} = req.body;
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
            settings = await client.testSettings.findMany({
                orderBy: {
                    id: 'desc'
                }
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(settings.map(obj => {
            for (const key in obj) {
                if (obj[key] === null) {
                    obj[key] = '-';
                }
            }
            return obj;
        }))
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

    async getUserTestAssign(req: Request, res: Response) {
        const user_id = (req as any).user.id;

        let assign
        try {
            assign = await client.userAssign.findMany({
                where: {
                    userId: user_id
                },
                include: {
                    assign: {
                        include: {
                            testSettings: true
                        }
                    },
                },
                orderBy: {
                    id: 'desc'
                }
            })
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        assign.map(assign => {

            const startTime = assign.assign.testSettings.startTime
            const endTime = assign.assign.testSettings.endTime
            const now = new Date()

            if (now < startTime) {
                assign.status = 'NOT STARTED'
            } else if (now > endTime) {
                assign.status = 'COMPLETED'
            }
        })

        return res.json(assign)

    }

    async result(req: Request, res: Response) {
        const assign_id = parseInt(req.params.assign_id);
        const user_id = (req as any).user.id;

        const userQuestions = await client.userQuestions.findMany({
            where: {
                userAssign: {
                    assignId: assign_id,
                    userId: user_id
                }
            },
            include: {
                question: {
                    include: {subjects: true}
                }
            }
        });


        // Создаём объект для группировки данных
        const groupedData = {};

        // Проходим по каждому элементу исходного массива data
        userQuestions.forEach(item => {
            const subjectName = item.question.subjects.name;

            // Если для данной темы ещё не создан массив вопросов, создаём его
            if (!groupedData[subjectName]) {
                groupedData[subjectName] = {
                    subject: subjectName,
                    questions: [],
                    levels: [] // Массив для уровней вопросов по каждой теме
                };
            }

            // Добавляем объект вопроса в массив вопросов для текущей темы
            groupedData[subjectName].questions.push(item.question);

            // Добавляем уровень вопроса в массив уровней для текущей темы
            groupedData[subjectName].levels.push(item.level);
        });

        // Преобразуем объект groupedData в массив, чтобы получить конечный результат
        const resultArray = Object.values(groupedData);

        return res.json(resultArray)
    }

    async nextQuestion(req: Request, res: Response) {
        const {ids, text_answer} = req.body;
        const user_id = (req as any).user.id;
        const assign_id = parseInt(req.params.assign_id);

        let selected = {
            ids: ids,
            text_answer: text_answer
        }

        let assign
        try {
            assign = await client.userAssign.findMany({
                where: {
                    AND: [
                        {userId: user_id},
                        {assignId: assign_id}
                    ]
                },
                include: {
                    UserQuestions: {
                        include: {
                            question: true
                        }
                    },
                    assign: {
                        include: {
                            testSettings: true,
                            testTemplate: {
                                include: {
                                    subjectsSettings: {
                                        include: {
                                            Subject: {
                                                include: {
                                                    questions: {
                                                        include: {
                                                            answers: true
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        if (assign.length === 0) {
            return res.status(404).json({error: 'Тест не найден'})
        }

        if (assign[0].status === 'PASSED') {
            return res.status(403).json({error: 'Данный тест уже завершён'})
        }

        const questions = await collectQuestions(assign)

        const startTime = assign[0].assign.testSettings.startTime
        const endTime = assign[0].assign.testSettings.endTime
        const now = new Date()

        if (now < startTime) {
            return res.status(403).json({error: 'Тест ещё не открыт'})
        } else if (now > endTime) {
            return res.status(403).json({error: 'Тест уже закончился'})
        }

        if (assign[0].questionId === null) {
            debug && console.log('Тест начинается. Подбираю первый вопрос')
            // Выбираем первый вопрос
            // Средняя сложность среди всех вопросов всех тем
            const firstSubject = questions[0].subjectId
            const questionsBySubject = questions.filter(question => question.subjectId === firstSubject)

            const initLevel = assign[0].assign.testTemplate.subjectsSettings[0].initialDifficulty !== null ? assign[0].assign.testTemplate.subjectsSettings[0].initialDifficulty : questionsBySubject.map(question => question.level).reduce((a, b) => a + b, 0) / questionsBySubject.length;
            debug && console.log('Стартовая сложность', initLevel)

            // Ищем ближайший вопрос к этой сложности
            const currentQuestion = findQuestionByDifficulty(questionsBySubject, initLevel)

            // Сохраняем в базу текущий вопрос
            try {
                await client.userAssign.update({
                    where: {
                        id: assign[0].id
                    },
                    data: {
                        startTime: new Date(),
                        questionId: currentQuestion.id,
                        UserQuestions: {
                            create: [
                                {
                                    question: {
                                        connect: {id: currentQuestion.id}
                                    },
                                    level: initLevel
                                }
                            ]
                        }
                    }
                })
            } catch (e) {
                res.status(500).json({error: dbErrorsHandler(e)})
                return
            }
            return res.status(200).json(currentQuestion)
        } else {
            // Есть ответ на текущий
            if (ids || text_answer) {
                //TODO: Проверерка если на текущий уже отвечали
                debug && console.log('Ответ есть, проверяю правильность')

                const currentQuestion = questions.find(question => question.id === assign[0].questionId)
                if (currentQuestion.type !== 'TEXT_ANSWER' && !ids) {
                    return res.status(400).json({error: 'Не дан ответ на вопрос'})
                }
                if (currentQuestion.type == 'TEXT_ANSWER' && !text_answer) {
                    return res.status(400).json({error: 'Не дан ответ на вопрос'})
                }

                // Ищем в какой UserQuestions будем заносить
                const userQuestion = assign[0].UserQuestions.find(question => question.questionId === currentQuestion.id)

                // Рассчитываем коэффициент вопроса
                const coefficient = 1 / userQuestion.level

                let newLevel;

                debug && console.log('Текущая сложность', userQuestion.level)
                debug && console.log('Коэффициент', coefficient)
                // Если ответили верно, увеличить сложность, иначе уменьшить
                const correctness = checkAnswerCorrect(selected, currentQuestion)
                if (correctness) {
                    // Увеличиваем сложность
                    newLevel = userQuestion.level + coefficient
                    debug && console.log('Оцениваю: Увеличиваем сложность', newLevel)
                } else {
                    // Уменьшаем сложность
                    newLevel = userQuestion.level - coefficient
                    debug && console.log('Оцениваю: Уменьшаем сложность', newLevel)
                    if (newLevel < 0) {
                        newLevel = 0
                    }
                }

                // Заносим в базу отвеченные
                try {
                    await client.userQuestions.update({
                        where: {
                            id: userQuestion.id
                        },
                        data: {
                            level: parseFloat(newLevel.toFixed(2)),
                            answer: {
                                create: createAnswerObject(selected, currentQuestion)
                            },
                            correct: correctness
                        }
                    })
                } catch (e) {
                    res.status(500).json({error: dbErrorsHandler(e)})
                    return
                }

                //     Подобрать и спросить следущий вопрос, учитывая тему и т.п.
                //     И которого нет в уже отвеченных
                const askedQuestions = assign[0].UserQuestions
                // console.log(askedQuestions)

                // Номер темы предыдущего вопроса
                const lastSubject = currentQuestion.subjectId

                // Выбираем вопросы из этой темы
                const questionSet = questions.filter(question => question.subjectId === lastSubject)

                // Создаем массив идентификаторов уже заданных вопросов
                const askedQuestionIds = askedQuestions.map(q => q.questionId);

                // Фильтруем исходный массив вопросов, чтобы получить спрошенные вопросы в этой теме
                const filteredQuestionSet = questionSet.filter(q => !askedQuestionIds.includes(q.id));

                // Если заданное количество вопросов в теме было задано
                const CountTotalQuestions = assign[0].assign.testTemplate.subjectsSettings.find(subject => subject.subjectId === lastSubject).totalQuestions
                const totalQuestions = assign[0].assign.testTemplate.subjectsSettings
                // return

                const askedSubjectsIds = Array.from(new Set(askedQuestions.map(item => item.question.subjectId)));

                console.log(totalQuestions)
                console.log(askedQuestions)

                // Создаем объект для хранения количества заданных вопросов по каждому subjectId
                const askedCounts = {};

                // Считаем количество заданных вопросов для каждого subjectId
                askedQuestions.forEach(question => {
                    const subjectId = question.question.subjectId;
                    if (!askedCounts[subjectId]) {
                        askedCounts[subjectId] = 0;
                    }
                    askedCounts[subjectId]++;
                });

                // Формируем массив askedSubjectsId на основе askedCounts и totalQuestions
                const askedSubjectsId = totalQuestions.reduce((result, item) => {
                    const {subjectId, totalQuestions} = item;
                    if (totalQuestions === null) {
                        // Если totalQuestions равно null, включаем все subjectId
                        result.push(subjectId);
                    } else {
                        // Иначе включаем subjectId только если количество заданных вопросов больше или равно totalQuestions
                        if (askedCounts[subjectId] >= totalQuestions) {
                            result.push(subjectId);
                        }
                    }
                    return result;
                }, []);

                console.log(askedSubjectsId)

                // return

                debug && console.log(`Количество вопросов, которые необходимо было спросить: ${CountTotalQuestions}, было задано ${askedQuestions.length}`)
                // return
                // console.log(totalQuestions)
                // if (totalQuestions !== null && askedQuestions.length >= totalQuestions) {
                //     debug && console.log(`Завершаю тест`)
                //     try {
                //         await client.userAssign.update({
                //             where: {
                //                 id: assign[0].id
                //             },
                //             data: {
                //                 status: 'PASSED',
                //                 endTime: new Date()
                //             }
                //         })
                //     } catch (e) {
                //         res.status(500).json({error: dbErrorsHandler(e)})
                //         return
                //     }
                //
                //     return res.json('Завершаем тестирование')
                // }

                // Если вопросов нет, то переходим к следующей теме
                // if (filteredQuestionSet.length === 0) {

                if (filteredQuestionSet.length >= CountTotalQuestions || askedQuestions.length >= CountTotalQuestions) {
                    debug && console.log('Вопросы в теме заданы или закончились. Подбираю новый вопрос')
                    // Берём оставшиеся вопросы, которые не были заданы
                    const lostQuestions = questions.filter(q => !askedQuestionIds.includes(q.id)).filter(question => !askedSubjectsIds.includes(question.subjectId));

                    // Вопросов не осталось, завершаю тест
                    if (lostQuestions.length === 0) {
                        // Добавить последнюю сложность в отвеченный последним вопрос
                        debug && console.log('Вопросов не осталось, завершаю тест')
                        try {
                            await client.userAssign.update({
                                where: {
                                    id: assign[0].id
                                },
                                data: {
                                    status: 'PASSED',
                                    endTime: new Date()
                                }
                            })
                        } catch (e) {
                            res.status(500).json({error: dbErrorsHandler(e)})
                            return
                        }

                        return res.json('Завершаем тестирование')
                    }

                    // Выбираем новую главную тему
                    const firstSubject = lostQuestions[0].subjectId
                    const questionsBySubject = lostQuestions.filter(question => question.subjectId === firstSubject)

                    const initLevel = (assign[0].assign.testTemplate.subjectsSettings.find(subject => subject.subjectId === firstSubject).initialDifficulty !== null ? assign[0].assign.testTemplate.subjectsSettings.find(subject => subject.subjectId === firstSubject).initialDifficulty : questionsBySubject.map(question => question.level).reduce((a, b) => a + b, 0) / questionsBySubject.length);

                    const currentQuestion = findQuestionByDifficulty(questionsBySubject, initLevel)

                    debug && console.log('Стартовая сложность новой темы: ', initLevel)

                    // Сохраняем в базу текущий вопрос
                    try {
                        await client.userAssign.update({
                            where: {
                                id: assign[0].id
                            },
                            data: {
                                questionId: currentQuestion.id,
                                UserQuestions: {
                                    create: [
                                        {
                                            question: {
                                                connect: {id: currentQuestion.id}
                                            },
                                            level: initLevel
                                        }
                                    ]
                                }
                            }
                        })
                    } catch (e) {
                        res.status(500).json({error: dbErrorsHandler(e)})
                        return
                    }
                    return res.status(200).json(currentQuestion)
                }

                debug && console.log('Подбираю следующий вопрос в той же теме')

                // Берём доступный список вопросов
                const lostQuestions = questions.filter(q => !askedQuestionIds.includes(q.id))

                // Берём вопросы связанные с этой темой
                const questionSetBySubject = lostQuestions.filter(question => question.subjectId === currentQuestion.subjectId)

                // Подбираем следующий вопрос
                const newQuestion = findQuestionByDifficulty(questionSetBySubject, 8)


                if (!isFinite(newLevel)) newLevel = 0
                // Сохраняем в базу текущий вопрос

                try {
                    await client.userAssign.update({
                        where: {
                            id: assign[0].id
                        },
                        data: {
                            questionId: newQuestion.id,
                            UserQuestions: {
                                create: [
                                    {
                                        question: {
                                            connect: {id: newQuestion.id} // Connect to an existing Question
                                        },
                                        level: newLevel
                                    }
                                ]
                            }
                        }
                    })
                } catch (e) {
                    res.status(500).json({error: dbErrorsHandler(e)})
                    return
                }
                return res.status(200).json(newQuestion)
            } else {
                //     Ответа нет, повторяем вопрос
                const questionsBySubject: any = questions.find(question => question.id === assign[0].questionId)

                if (questionsBySubject.type === 'TEXT_ANSWER') {
                    delete questionsBySubject.answers;
                } else {
                    questionsBySubject.answers.forEach(answer => {
                        delete answer.correct;
                    });
                }

                return res.json(questionsBySubject)
            }

            // Если вопросов нет или выполнились условия завершения, завершить тест
        }
    }

    async NewNextQuestion(req: Request, res: Response) {
        const {ids, text_answer} = req.body;
        const user_id = (req as any).user.id;
        const assign_id = parseInt(req.params.assign_id);

        let selected = {
            ids: ids,
            text_answer: text_answer
        }

        let assign
        try {
            assign = await client.userAssign.findMany({
                where: {
                    AND: [
                        {userId: user_id},
                        {assignId: assign_id}
                    ]
                },
                include: {
                    UserQuestions: {
                        include: {
                            question: true
                        }
                    },
                    assign: {
                        include: {
                            testSettings: true,
                            testTemplate: {
                                include: {
                                    subjectsSettings: {
                                        include: {
                                            Subject: {
                                                include: {
                                                    questions: {
                                                        include: {
                                                            answers: true
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        if (assign.length === 0) {
            return res.status(404).json({error: 'Тест не найден'})
        }

        if (assign[0].status === 'PASSED') {
            return res.status(403).json({error: 'Данный тест уже завершён'})
        }

        const questions = await collectQuestions(assign)

        const startTime = assign[0].assign.testSettings.startTime
        const endTime = assign[0].assign.testSettings.endTime
        const now = new Date()

        if (now < startTime) {
            return res.status(403).json({error: 'Тест ещё не открыт'})
        } else if (now > endTime) {
            return res.status(403).json({error: 'Тест уже закончился'})
        }

        if (assign[0].questionId === null) {
            debug && console.log('Тест начинается. Подбираю первый вопрос')
            // Выбираем первый вопрос
            // Средняя сложность среди всех вопросов всех тем
            const firstSubject = questions[0].subjectId
            const questionsBySubject = questions.filter(question => question.subjectId === firstSubject)

            const initLevel = assign[0].assign.testTemplate.subjectsSettings[0].initialDifficulty !== null ? assign[0].assign.testTemplate.subjectsSettings[0].initialDifficulty : questionsBySubject.map(question => question.level).reduce((a, b) => a + b, 0) / questionsBySubject.length;
            debug && console.log('Стартовая сложность', initLevel)

            // Ищем ближайший вопрос к этой сложности
            const currentQuestion = findQuestionByDifficulty(questionsBySubject, initLevel)

            // Сохраняем в базу текущий вопрос
            try {
                await client.userAssign.update({
                    where: {
                        id: assign[0].id
                    },
                    data: {
                        startTime: new Date(),
                        questionId: currentQuestion.id,
                        UserQuestions: {
                            create: [
                                {
                                    question: {
                                        connect: {id: currentQuestion.id}
                                    },
                                    level: initLevel
                                }
                            ]
                        }
                    }
                })
            } catch (e) {
                res.status(500).json({error: dbErrorsHandler(e)})
                return
            }
            return res.status(200).json(currentQuestion)
        } else {
            // Есть ответ на текущий
            if (ids || text_answer) {
                //TODO: Проверерка если на текущий уже отвечали
                debug && console.log('Ответ есть, проверяю правильность')

                const currentQuestion = questions.find(question => question.id === assign[0].questionId)
                if (currentQuestion.type !== 'TEXT_ANSWER' && !ids) {
                    return res.status(400).json({error: 'Не дан ответ на вопрос'})
                }
                if (currentQuestion.type == 'TEXT_ANSWER' && !text_answer) {
                    return res.status(400).json({error: 'Не дан ответ на вопрос'})
                }

                // Ищем в какой UserQuestions будем заносить
                const userQuestion = assign[0].UserQuestions.find(question => question.questionId === currentQuestion.id)

                // Рассчитываем коэффициент вопроса
                const coefficient = 1 / userQuestion.level

                let newLevel;

                debug && console.log('Текущая сложность', userQuestion.level)
                debug && console.log('Коэффициент', coefficient)
                // Если ответили верно, увеличить сложность, иначе уменьшить
                const correctness = checkAnswerCorrect(selected, currentQuestion)
                if (correctness) {
                    // Увеличиваем сложность
                    newLevel = userQuestion.level + coefficient
                    debug && console.log('Оцениваю: Увеличиваем сложность', newLevel)
                } else {
                    // Уменьшаем сложность
                    newLevel = userQuestion.level - coefficient
                    debug && console.log('Оцениваю: Уменьшаем сложность', newLevel)
                    if (newLevel < 0) {
                        newLevel = 0
                    }
                }

                // Заносим в базу отвеченные
                try {
                    await client.userQuestions.update({
                        where: {
                            id: userQuestion.id
                        },
                        data: {
                            level: parseFloat(newLevel.toFixed(2)),
                            answer: {
                                create: createAnswerObject(selected, currentQuestion)
                            },
                            correct: correctness
                        }
                    })
                } catch (e) {
                    res.status(500).json({error: dbErrorsHandler(e)})
                    return
                }

                // Номер темы предыдущего вопроса
                const lastSubject = currentQuestion.subjectId

                // Заданные вопросы
                const askedQuestions = assign[0].UserQuestions
                // Все вопросы

                // Количество вопросов, которые надо задать в текущей теме
                const totalSubjectQuestions = assign[0].assign.testTemplate.subjectsSettings.find(item => item.subjectId === currentQuestion.subjectId).totalQuestions

                const questionsRequiredToAsk = assign[0].assign.testTemplate.subjectsSettings

                debug && console.log(`Количество вопросов, которые необходимо было спросить: ${totalSubjectQuestions}, было задано ${askedQuestions.length}`)

                const unansweredQuestions = questions.filter(question => {
                    // Проверяем, есть ли текущий вопрос в массиве askedQuestions по его id
                    return !askedQuestions.some(askedQuestion => askedQuestion.question.id === question.id);
                });

                // Функция для фильтрации вопросов из открытых тем
                const filteredQuestions = unansweredQuestions.filter(question => {
                    // Находим информацию о теме вопроса по subjectId
                    const subjectInfo = questionsRequiredToAsk.find(item => item.subjectId === question.subjectId);

                    if (subjectInfo) {
                        // Находим все вопросы в askedQuestions для текущей темы (subjectId)
                        const askedQuestionsForSubject = askedQuestions.filter(asked => asked.question.subjectId === question.subjectId);

                        // Вычисляем количество уже заданных вопросов в этой теме
                        const askedQuestionsCount = askedQuestionsForSubject.length;

                        // Проверяем условие задания вопросов в теме
                        if (subjectInfo.totalQuestions === null) {
                            // Если totalQuestions равно null, то нужно задать все вопросы
                            return true;
                        } else {
                            // Проверяем, что количество уже заданных вопросов не превышает totalQuestions
                            return askedQuestionsCount < subjectInfo.totalQuestions;
                        }
                    } else {
                        // Если информации о теме нет, возвращаем false (не включаем вопрос в итоговый массив)
                        return false;
                    }
                });

                if (filteredQuestions.length === 0) {
                    debug && console.log(`Завершаю тест`)
                    try {
                        await client.userAssign.update({
                            where: {
                                id: assign[0].id
                            },
                            data: {
                                status: 'PASSED',
                                endTime: new Date()
                            }
                        })
                    } catch (e) {
                        res.status(500).json({error: dbErrorsHandler(e)})
                        return
                    }

                    return res.status(204).json('Завершаем тестирование')
                }

                if (askedQuestions.length >= totalSubjectQuestions) {
                    debug && console.log('Подбираю новый вопрос в следующей же теме')

                    const newQuestion = findQuestionByDifficulty(filteredQuestions, newLevel)

                    try {
                        await client.userAssign.update({
                            where: {
                                id: assign[0].id
                            },
                            data: {
                                questionId: newQuestion.id,
                                UserQuestions: {
                                    create: [
                                        {
                                            question: {
                                                connect: {id: newQuestion.id}
                                            },
                                            level: newLevel
                                        }
                                    ]
                                }
                            }
                        })
                    } catch (e) {
                        res.status(500).json({error: dbErrorsHandler(e)})
                        return
                    }
                    return res.status(200).json(newQuestion)
                }

                debug && console.log('Подбираю следующий вопрос в той же теме')

                // Выбираем вопросы из этой темы
                const questionSet = questions.filter(question => question.subjectId === lastSubject)
                console.log(questionSet)

                // Создаем массив идентификаторов уже заданных вопросов
                const askedQuestionIds = askedQuestions.map(q => q.questionId);
                console.log(askedQuestionIds)

                // Фильтруем исходный массив вопросов, чтобы получить спрошенные вопросы в этой теме
                const notAskedQuestions = questionSet.filter(q => !askedQuestionIds.includes(q.id));
                console.log(notAskedQuestions)

                // Берём доступный список вопросов
                // const lostQuestions = questions.filter(q => !askedQuestionIds.includes(q.id))

                // Берём вопросы связанные с этой темой
                const questionSetBySubject = notAskedQuestions.filter(question => question.subjectId === currentQuestion.subjectId)

                // Подбираем следующий вопрос
                const newQuestion = findQuestionByDifficulty(questionSetBySubject, newLevel)

                if (!isFinite(newLevel)) newLevel = 0
                // Сохраняем в базу текущий вопрос

                try {
                    await client.userAssign.update({
                        where: {
                            id: assign[0].id
                        },
                        data: {
                            questionId: newQuestion.id,
                            UserQuestions: {
                                create: [
                                    {
                                        question: {
                                            connect: {id: newQuestion.id}
                                        },
                                        level: newLevel
                                    }
                                ]
                            }
                        }
                    })
                } catch (e) {
                    res.status(500).json({error: dbErrorsHandler(e)})
                    return
                }
                return res.status(200).json(newQuestion)

            } else {
                //     Ответа нет, повторяем вопрос
                const questionsBySubject: any = questions.find(question => question.id === assign[0].questionId)

                if (questionsBySubject.type === 'TEXT_ANSWER') {
                    delete questionsBySubject.answers;
                } else {
                    questionsBySubject.answers.forEach(answer => {
                        delete answer.correct;
                    });
                }

                return res.json(questionsBySubject)
            }

            // Если вопросов нет или выполнились условия завершения, завершить тест
        }
    }

    async createTestAssign(req: Request, res: Response) {
        const {name, testTemplateId, testSettingsId, users} = req.body;
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

        let testAssign: TestAssign;
        try {
            testAssign = await client.testAssign.create({
                data: newData,
                include: {
                    users: true
                }
            });
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        if (users && users.length > 0) {
            const enrolledNotificationMessage = `Вам назначен тест "${testAssign.name}"`;
            sendNotificationToUsers(users, enrolledNotificationMessage);
        }

        return res.json(testAssign)
    }

    async getTestAssign(req: Request, res: Response) {
        let assign: TestAssign[]
        try {
            assign = await client.testAssign.findMany({
                include: {
                    users: true
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
                        users: true
                    }
                }),
                client.testAssign.update({
                    where: {
                        id: id
                    },
                    data: newData,
                    include: {
                        users: true
                    }
                })
            ]);
        } catch (e) {
            res.status(500).json({error: dbErrorsHandler(e)})
            return
        }

        return res.json(testAssign)
    }
}