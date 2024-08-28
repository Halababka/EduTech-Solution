import { client } from "../db.js";
import dbErrorsHandler from "../utils/dbErrorsHandler.js";

class GroupsController {
    async getAllGroups(req, res) {
        try {
            const groups = await client.groups.findMany();
            res.json(groups);
        } catch (error) {
            console.error("Error fetching all groups:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }

    async getAllGroupsWithUsers(req, res) {
        try {
            const groups = await client.groups.findMany({
                include: {
                    users: {
                        select: {
                            id: true,
                            first_name: true,
                            middle_name: true,
                            last_name: true,
                            username: true,
                            about: true,
                        }
                    }
                }
            });
            res.json(groups);
        } catch (error) {
            console.error("Error fetching all groups:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }

    async getGroupById(req, res) {
        const {groupId} = req.params;
        try {
            const group = await client.groups.findUnique({
                where: {id: parseInt(groupId)}
            });
            if (!group) {
                return res.status(404).json({error: "Group not found"});
            }
            res.json(group);
        } catch (error) {
            console.error("Error fetching group by ID:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }

    async getUsersInGroup(req, res) {
        const {groupId} = req.params;
        try {
            const groupWithUsers = await client.groups.findUnique({
                where: {id: parseInt(groupId)},
                include: {
                    users: {
                        select: {
                            id: true,
                            first_name: true,
                            middle_name: true,
                            last_name: true,
                            username: true,
                            about: true,
                            rolesId: true
                        }
                    }
                }
            });
            if (!groupWithUsers) {
                return res.status(404).json({error: "Group not found"});
            }
            res.json(groupWithUsers.users);
        } catch (error) {
            console.error("Error fetching users in group:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }

    async createGroup(req, res) {
        try {
            const {full_name, abbreviation} = req.body;

            console.log(full_name);

            if (!full_name || typeof full_name !== "string") {
                return res.status(400).json({error: "Name must be a non-empty string"});
            }
            // Проверяем, существует ли уже группа с таким названием
            const existingGroup = await client.groups.findUnique({
                where: {full_name: full_name}
            });

            if (existingGroup) {
                return res.status(409).json({error: "Group with this name already exists"});
            }
            const group = await client.groups.create({
                data: {
                    full_name: full_name,
                    abbreviation: abbreviation
                }
            });
            res.status(201).json(group);
        } catch (error) {
            console.error("Error creating group:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }

    async addUsersToGroup(req, res) {
        try {
            const {groupId} = req.params;
            const {userIds} = req.body;
            if (!userIds || !Array.isArray(userIds) || !userIds.every((id) => typeof id === "number")) {
                return res.status(400).json({error: "UserIds must be a non-empty array of numbers"});
            }
            const group = await client.groups.findUnique({
                where: {id: parseInt(groupId)},
                include: {users: true}
            });
            if (!group) {
                return res.status(404).json({error: "Group not found"});
            }

            if (!Array.isArray(group.users)) {
                return res.status(500).json({error: "Failed to retrieve users from the group"});
            }

            const existingUserIds = group.users.map(user => user.id);

            // Отфильтруем userIds, чтобы добавить только тех пользователей, которых ещё нет в группе
            const newUserIds = userIds.filter(userId => !existingUserIds.includes(userId));

            if (newUserIds.length === 0) {
                return res.status(200).json({message: "Users are already in the group"});
            }

            // Проверка, что все переданные userIds существуют в базе данных
            const existingUsers = await client.user.findMany({
                where: {id: {in: newUserIds}},
                select: {id: true}
            });

            const existingUserIdsSet = new Set(existingUsers.map(user => user.id));

            // Отфильтровать только существующих пользователей из новых userIds
            const validNewUserIds = newUserIds.filter(userId => existingUserIdsSet.has(userId));

            // Проверить, есть ли какие-либо недопустимые пользователи
            const invalidUserIds = newUserIds.filter(userId => !existingUserIdsSet.has(userId));

            if (invalidUserIds.length > 0) {
                console.warn(`Invalid user ids: ${invalidUserIds.join(", ")}`);
            }

            // Обновить группу, добавив только существующих пользователей
            await client.groups.update({
                where: {id: parseInt(groupId)},
                data: {
                    users: {
                        connect: validNewUserIds.map(userId => ({id: userId}))
                    }
                }
            });

            res.status(200).json({message: "Users added to the group successfully"});
        } catch (error) {
            console.error("Error adding users to group:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }

    async removeUsersFromGroup(req, res) {
        try {
            const {groupId} = req.params;
            const {userIds} = req.body;
            if (!userIds || !Array.isArray(userIds) || !userIds.every((id) => typeof id === "number")) {
                return res.status(400).json({error: "UserIds must be a non-empty array of numbers"});
            }

            const group = await client.groups.findUnique({
                where: {id: parseInt(groupId)},
                include: {users: true} // Включаем данные о пользователях
            });
            if (!group) {
                return res.status(404).json({error: "Group not found"});
            }

            // Проверяем, что свойство users определено и является массивом
            if (!Array.isArray(group.users)) {
                return res.status(500).json({error: "Failed to retrieve users from the group"});
            }

            const existingUserIds = group.users.map(user => user.id);

            // Отфильтруем userIds, чтобы удалить только тех пользователей, которые есть в группе
            const usersToRemoveIds = userIds.filter(userId => existingUserIds.includes(userId));

            if (usersToRemoveIds.length === 0) {
                return res.status(200).json({message: "Users are not in the group"});
            }

            const removeUsersPromises = usersToRemoveIds.map(async (userId) => {
                await client.groups.update({
                    where: {id: parseInt(groupId)},
                    data: {
                        users: {
                            disconnect: {id: parseInt(userId)}
                        }
                    }
                });
            });

            await Promise.all(removeUsersPromises);

            res.status(200).json({message: "Users removed from the group successfully"});
        } catch (error) {
            console.error("Error removing users from group:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }

    async updateGroup(req, res) {
        try {
            const {groupId} = req.params;
            const {full_name, abbreviation} = req.body;

            // Проверяем, что name и abbreviation не пустые
            if (!full_name && !abbreviation) {
                return res.status(400).json({error: "Name and abbreviation are required"});
            }
            // Проверяем, что группа с заданным ID существует
            const existingGroup = await client.groups.findUnique({
                where: {id: parseInt(groupId)}
            });

            if (!existingGroup) {
                return res.status(404).json({error: "Group not found"});
            }
            // Получаем текущие данные о группе
            const currentGroup = await client.groups.findUnique({
                where: {id: parseInt(groupId)}
            });

            // Проверяем, если переданные данные совпадают с текущими данными
            if (currentGroup.full_name === full_name && currentGroup.abbreviation === abbreviation) {
                return res.status(400).json({error: "Group data is the same as the current data"});
            }
            // Обновляем группу в БД
            const updatedGroup = await client.groups.update({
                where: {id: parseInt(groupId)},
                data: {
                    full_name: full_name,
                    abbreviation: abbreviation
                }
            });

            res.status(200).json({message: "Group updated successfully", group: updatedGroup});
        } catch (error) {
            console.error("Error updating group:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }

    async deleteGroups(req, res) {
        try {
            const groupIds = req.body.groupIds;

            // Проверяем, что groupIds является массивом
            if (!Array.isArray(groupIds)) {
                return res.status(400).json({error: "Group IDs must be an array"});
            }

            // Проверяем, что массив не пустой
            if (groupIds.length === 0) {
                return res.status(400).json({error: "Group IDs array is empty"});
            }
            const existingUsers = await client.groups.findMany({
                where: {id: {in: groupIds}}
            });

            if (existingUsers.length !== groupIds.length) {
                // Не все пользователи с указанными идентификаторами найдены
                return res.status(404).json({error: "One or more groups not found"});
            }
            // Удаляем пользователя из базы данных
            const deletedGroups = await client.groups.deleteMany({
                where: {id: {in: groupIds}}
            });
            if (deletedGroups.length === 0) {
                // Ни один пользователь не был удален
                return res.status(404).json({error: "No groups were deleted"});
            }

            res.status(200).json({message: "Groups deleted successfully", deletedGroups});

        } catch (error) {
            console.error("Error deleting groups:", error);
            res.status(500).json({error: "Failed to delete groups"});
        }
    }
}

export default new GroupsController();