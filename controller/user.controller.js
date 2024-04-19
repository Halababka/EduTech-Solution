import { DB } from "../db/db.js";
import { client } from "../db.js";
import bcrypt from "bcrypt";

const db = new DB();
const saltRounds = 10;

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
                    rolesId: true,
                    role: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    groups: {
                        select: {
                            id: true,
                            full_name: true,
                            abbreviation: true
                        }
                    }
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
                include: {enrolled_courses: true}
            });
            if (!user) {
                return res.status(404).json({error: "User not found"});
            }
            res.json({courses: user.enrolled_courses});
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

    // Метод для создания нового пользователя
    async createUser(req, res) {
        try {
            // Получаем данные о пользователях из тела запроса
            const usersData = req.body;

            // Проверяем, что данные не пусты
            if (!Array.isArray(usersData) || usersData.length === 0) {
                return res.status(400).json({error: "No user data provided"});
            }
            // Массив для хранения созданных пользователей
            const createdUsers = [];
            // Массив для хранения имен пользователей, которые не удалось создать
            const unavailableUsernames = [];
            // Проверяем, что все обязательные поля присутствуют у каждого пользователя
            for (const userData of usersData) {

                if (!userData.first_name || !userData.last_name || !userData.username || !userData.password) {
                    return res.status(400).json({error: "Missing required fields"});
                }

                const existingUser = await client.user.findUnique({where: {username: userData.username}});
                if (existingUser) {
                    unavailableUsernames.push(userData.username);
                    continue; // Пропускаем создание пользователя, если имя пользователя уже существует
                }

                const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

                const newUser = await client.user.create({
                    data: {
                        ...userData,
                        password: hashedPassword

                    }
                });
                createdUsers.push(newUser);
            }

            // Возвращаем успешный ответ с массивом созданных пользователей и недоступных имен
            res.status(201).json({createdUsers, unavailableUsernames});
        } catch (error) {
            // Обрабатываем ошибку и возвращаем ее клиенту
            console.error("Error creating users:", error);
            res.status(500).json({error: "Failed to create users"});
        }
    }

    // Метод для обновления информации о пользователе
    async updateUser(req, res) {
        try {
            // Получаем ID пользователя из параметров запроса
            const userId = parseInt(req.params.userId);

            // Получаем данные для обновления из тела запроса
            const userData = req.body;

            // Проверяем, что данные отличаются от существующих данных в базе
            const existingUser = await client.user.findUnique({
                where: {id: userId}
            });

            const updatedFields = {};
            for (const key in userData) {
                if (existingUser[key] !== userData[key]) {
                    updatedFields[key] = userData[key];
                }
            }

            if (Object.keys(updatedFields).length === 0) {
                return res.status(400).json({error: "No fields to update"});
            }

            // Обновляем информацию о пользователе в базе данных
            const updatedUser = await client.user.update({
                where: {id: userId},
                data: updatedFields
            });

            // Возвращаем успешный ответ с обновленными данными пользователя
            res.json(updatedUser);
        } catch (error) {
            // Обрабатываем ошибку и возвращаем ее клиенту
            console.error("Error updating user:", error);
            res.status(500).json({error: "Failed to update user"});
        }
    }

    // Метод для смены пароля пользователя
    async changePassword(req, res) {
        try {
            // Получаем идентификатор пользователя и новый пароль из тела запроса
            const {userId, oldPassword, newPassword} = req.body;

            // Проверяем, что переданы все необходимые данные
            if (!userId || !oldPassword || !newPassword) {
                return res.status(400).json({error: "Missing required fields"});
            }

            // Получаем текущий пароль пользователя из базы данных
            const user = await client.user.findUnique({where: {id: userId}, select: {password: true}});

            // Проверяем, совпадает ли старый пароль пользователя с тем, что был передан в запросе
            const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({error: "Invalid old password"});
            }

            // Хэшируем новый пароль
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

            // Обновляем пароль пользователя в базе данных
            await client.user.update({
                where: {id: userId},
                data: {password: hashedNewPassword}
            });

            // Возвращаем успешный ответ
            res.status(200).json({message: "Password changed successfully"});
        } catch (error) {
            // Обрабатываем ошибку и возвращаем ее клиенту
            console.error("Error changing password:", error);
            res.status(500).json({error: "Failed to change password"});
        }
    }

    async deleteUser(req, res) {
        try {

            const userIds = req.body.userIds;

            // Проверяем, что userIds является массивом
            if (!Array.isArray(userIds)) {
                return res.status(400).json({error: "User IDs must be an array"});
            }

            // Проверяем, что массив не пустой
            if (userIds.length === 0) {
                return res.status(400).json({error: "User IDs array is empty"});
            }
            const existingUsers = await client.user.findMany({
                where: {id: {in: userIds}}
            });

            if (existingUsers.length !== userIds.length) {
                // Не все пользователи с указанными идентификаторами найдены
                return res.status(404).json({error: "One or more users not found"});
            }
            // Удаляем пользователя из базы данных
            const deletedUsers = await client.user.deleteMany({
                where: {id: {in: userIds}}
            });
            if (deletedUsers.length === 0) {
                // Ни один пользователь не был удален
                return res.status(404).json({error: "No users were deleted"});
            }

            res.status(200).json({message: "Users deleted successfully", deletedUsers});

        } catch (error) {
            console.error("Error deleting users:", error);
            res.status(500).json({error: "Failed to delete users"});
        }
    }

}