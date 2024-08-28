import {Users} from './users.js'

const users = new Users()

export class DB {
    getUser(user_id) {
        return users.get(user_id)
    }
}