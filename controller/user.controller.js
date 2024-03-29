import { DB } from "../db/db.js";
import { client } from "../db.js";

const db = new DB();

export class UserController {
    async getAllUsers(req, res) {
        try {
            const users = await client.user.findMany({
                select: {
                    id: true,
                    first_name: true,
                    middle_name: true,
                    last_name: true,
                    username: true,
                    about: true,
                    rolesId: true
                }
            });
            res.json(users);
        } catch (error) {
            console.error("Error fetching all users:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }

    // Получение конкретного пользователя по его ID
    async getUserById(req, res) {
        const {userId} = req.params;
        try {
            const user = await db.getUser(parseInt(userId));
            if (!user) {
                return res.status(404).json({error: "User not found"});
            }
            res.json(user);
        } catch (error) {
            console.error("Error fetching user by ID:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }

    // Получение списка всех курсов, на которые записан конкретный пользователь
    async getCoursesByUserId(req, res) {
        const userId = req.user.id;
        try {
            const user = await client.user.findUnique({
                where: {id: parseInt(userId)},
                include: {enrolledCourses: true}
            });
            if (!user) {
                return res.status(404).json({error: "User not found"});
            }
            res.json({courses: user.enrolledCourses});
        } catch (error) {
            console.error("Error fetching courses for the user:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }

    // Получение списка всех материалов, загруженных конкретным пользователем
    async getMaterialsByUserId(req, res) {
        const {userId} = req.params;
        try {
            const materials = await client.materials.findMany({
                where: {userId: parseInt(userId)}
            });
            res.json(materials);
        } catch (error) {
            console.error("Error fetching materials by user ID:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }

    // Получение списка всех групп, в которых состоит конкретный пользователь
    async getGroupsByUserId(req, res) {
        const {userId} = req.params;
        try {
            const user = await client.user.findUnique({
                where: {id: parseInt(userId)},
                include: {groups: true}
            });
            if (!user) {
                return res.status(404).json({error: "User not found"});
            }
            res.json(user.groups);
        } catch (error) {
            console.error("Error fetching groups by user ID:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }


}