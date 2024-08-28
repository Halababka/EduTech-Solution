import { client } from '../db.js';
import dbErrorsHandler from "../utils/dbErrorsHandler.js";

class UserService {
    async findUserByUsername(username) {
        try {
            return await client.user.findUnique({
                where: { username: username },
            });
        } catch (e) {
            throw new Error(dbErrorsHandler(e));
        }
    }

    async isUsernameExist(username) {
        try {
            const user = await this.findUserByUsername(username);
            return !!user;
        } catch (e) {
            throw new Error(dbErrorsHandler(e));
        }
    }

    async createUser(userData) {
        try {
            return await client.user.create({
                data: userData,
            });
        } catch (e) {
            throw new Error(dbErrorsHandler(e));
        }
    }
}

export const userService = new UserService();
