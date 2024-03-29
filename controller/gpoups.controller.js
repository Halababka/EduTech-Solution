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
}

export default new GroupsController();