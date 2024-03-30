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
            const {name} = req.body;
            const {abbreviation} = req.body;
            if (!name || typeof name !== "string") {
                return res.status(400).json({error: "Name must be a non-empty string"});
            }
            // Проверяем, существует ли уже группа с таким названием
            const existingGroup = await client.groups.findUnique({
                where: {full_name: name}
            });

            if (existingGroup) {
                return res.status(409).json({error: "Group with this name already exists"});
            }
            const group = await client.groups.create({
                data: {
                    full_name: name,
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
            // Assuming userIds is an array of user ids to add to the group
            const addUsersPromises = newUserIds.map(async (userId) => {
                await client.groups.update({
                    where: {id: parseInt(groupId)},
                    data: {
                        users: {
                            connect: {id: parseInt(userId)}
                        }
                    }
                });
            });

            await Promise.all(addUsersPromises);

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
            const {name, abbreviation} = req.body;

            // Проверяем, что name и abbreviation не пустые
            if (!name || !abbreviation) {
                return res.status(400).json({error: "Name and abbreviation are required"});
            }
            // Проверяем, что группа с заданным ID существует
            const existingGroup = await client.groups.findUnique({
                where: { id: parseInt(groupId) },
            });

            if (!existingGroup) {
                return res.status(404).json({ error: 'Group not found' });
            }
            // Получаем текущие данные о группе
            const currentGroup = await client.groups.findUnique({
                where: { id: parseInt(groupId) },
            });

            // Проверяем, если переданные данные совпадают с текущими данными
            if (currentGroup.full_name === name && currentGroup.abbreviation === abbreviation) {
                return res.status(400).json({ error: 'Group data is the same as the current data' });
            }
            // Обновляем группу в БД
            const updatedGroup = await client.groups.update({
                where: {id: parseInt(groupId)},
                data: {
                    full_name: name,
                    abbreviation: abbreviation
                }
            });

            res.status(200).json({message: "Group updated successfully", group: updatedGroup});
        } catch (error) {
            console.error("Error updating group:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }
}

export default new GroupsController();