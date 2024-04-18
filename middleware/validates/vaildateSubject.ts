import type {Subject} from '@prisma/client'
import {Request, Response} from 'express'

export const validateSubject = (req: Request, res: Response, next: Function) => {
    const {name} = req.body as Subject;

    if (!name || typeof name !== 'string') {
        return res.status(400).json({message: 'Invalid data for login and name'});
    }

    if (name.length < 3) {
        return res.status(400).json({message: 'Name must be at least 3 characters long'});
    }

    next()
}