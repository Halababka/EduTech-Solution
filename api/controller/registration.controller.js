import { client } from "../db.js";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import dbErrorsHandler from "../utils/dbErrorsHandler.js";

const saltRounds = 10;

export const registerLink = async (req, res) => {
    const {token} = req.query;

    try {
        // Проверка существования ссылки в базе данных
        const registrationLink = await client.registrationLinks.findUnique({
            where: {
                token
            }
        });
        if (!registrationLink || registrationLink.remaining_usages <= 0) {
            // Ссылка недействительна или использования исчерпаны
            return res.status(404).send("Ссылка недействительна или использования исчерпаны");
        }
        // Ссылка действительна, пользователь может зарегистрироваться
        const registrationUrl = ("http://localhost:3000/registration?token=" + token); // Замените на актуальный URL вашего сайта и порт
        res.redirect(registrationUrl);
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, error: "Internal Server Error"});
    }
};

export const createRegisterLink = async (req, res) => {
    const {name, description, remaining_usages, role, groups} = req.body;

    // Валидация входных данных
    if (!name || !remaining_usages) {
        return res.status(400).json({error: "Name and remaining_usages are required"});
    }

    // Проверка существования роли, если указан roleId
    if (role) {
        const roleExists = await client.roles.findUnique({
            where: {id: role.id}
        });
        if (!roleExists) {
            return res.status(404).json({error: "Role not found"});
        }
    }

    // Проверка существования групп, если указаны groupIds
    if (groups && groups.length < 0) {
        const groupIds = groups.map(group => group.id);
        const groupsExist = await client.groups.findMany({
            where: {
                id: {in: groupIds}
            }
        });
        if (groupsExist.length !== groups.length) {
            return res.status(404).json({error: "One or more groups not found"});
        }
    }

    // Генерация токена
    const token = nanoid();

    try {
        const newLink = await client.registrationLinks.create({
            data: {
                name,
                description,
                token,
                remaining_usages,
                role: role ? {connect: {id: role.id}} : undefined,
                groups: groups && groups.length > 0 ? {connect: groups.map(group => ({ id: group.id }))} : undefined
            },
            include: {role: true, groups: true}
        });

        // Формирование ссылки
        const registrationUrl = `http://localhost:8080/api/registration?token=${token}`;

        // Возвращаемый объект с новой ссылкой
        res.status(201).json({...newLink, url: registrationUrl});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Failed to create registration link"});
    }
};

export const getAllRegisterLinks = async (req, res) => {
    try {
        const links = await client.registrationLinks.findMany({
            include: {role: true, groups: true}
        });

        const linksWithUrl = links.map(link => {
            const registrationUrl = `http://localhost:8080/api/registration?token=${link.token}`;
            return { ...link, url: registrationUrl };
        });

        res.status(200).json({success: true, links: linksWithUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Failed to retrieve registration links"});
    }
};

export const deleteRegisterLinks = async (req, res) => {
    const {ids} = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({error: "IDs are required and must be an array"});
    }

    try {
        // Получение существующих ссылок из базы данных
        const existingLinks = await client.registrationLinks.findMany({
            where: {
                id: {in: ids.map(id => parseInt(id))}
            }
        });

        // Получение ID существующих ссылок
        const existingIds = existingLinks.map(link => link.id);

        if (existingIds.length === 0) {
            return res.status(404).json({error: "No registration links found for provided IDs"});
        }

        // Удаление существующих ссылок
        await client.registrationLinks.deleteMany({
            where: {
                id: {in: existingIds}
            }
        });

        res.status(200).json({
            success: true,
            message: "Registration links deleted successfully",
            deletedIds: existingIds
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Failed to delete registration links"});
    }
};

export const registerUserToLink = async (req, res) => {
    const {first_name, middle_name, last_name, username, email, password} = req.body.userData;

    const {token} = req.query;

    // Проверка наличия токена
    if (!token) {
        return res.status(400).json({error: "Token is required"});
    }

    try {
        // Проверка существования ссылки и оставшихся использований
        const registrationLink = await client.registrationLinks.findUnique({
            where: {token},
            include: {role: true, groups: true}
        });

        if (!registrationLink || registrationLink.remaining_usages <= 0) {
            return res.status(400).json({error: "Invalid or expired token"});
        }

        // Проверка существования пользователя по username
        const existingUser = await client.user.findUnique({
            where: {username}
        });

        if (existingUser) {
            return res.status(400).json({error: "Username already exists"});
        }

        // Шифрование пароля
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log(registrationLink);
        // Создание нового пользователя
        const result = await client.$transaction([
            client.user.create({
                data: {
                    first_name,
                    middle_name,
                    last_name,
                    username,
                    email,
                    password: hashedPassword,
                    role: registrationLink.role ? {connect: {id: registrationLink.role.id}} : undefined,
                    groups: registrationLink.groups ? {connect: registrationLink.groups.map(group => ({id: group.id}))} : undefined
                }
            }),
            // Уменьшение доступного использования ссылки
            client.registrationLinks.update({
                where: {token},
                data: {remaining_usages: registrationLink.remaining_usages - 1}
            })
        ]);

        const newUser = result[0];

        res.status(201).json({success: true, user: newUser});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Internal Server Error"});
    }
};
