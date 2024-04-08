import {client} from '../db.js';
import dbErrorsHandler from "../utils/dbErrorsHandler.js";

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
    async getTest(req, res) {
        res.json(1);
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
        const subjects = await client.subject.findMany()
        res.json(subjects);
    }
}