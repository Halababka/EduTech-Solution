import { PrismaClient } from "@prisma/client";
import { usersData } from "./seeds/users.js";
import { groupsData } from "./seeds/groups.js";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Start seeding...");

    // Роли
    const roleUser = await prisma.roles.create({
        data: {
            code: "USER",
            name: 'Пользователь',
        }
    });

    const roleTeacher = await prisma.roles.create({
        data: {
            code: "TEACHER",
            name: 'Преподаватель',
        }
    });

    const roleAdmin = await prisma.roles.create({
        data: {
            code: "ADMIN",
            name: 'Администратор',
        }
    });

    // Группы
    await prisma.groups.createMany({
        data: groupsData
    })

    // Юзеры
    await prisma.user.createMany({
        data: usersData
    });

    // Разрешения
    const permission1_1 = await prisma.permissions.create({
        data: {
            code: 'CREATE_COURSES',
            name: 'Создание курсов',
            roles: {
                connect: [
                    { id: roleAdmin.id },
                    { id: roleTeacher.id }
                ]
            }
        }
    });
    const permission1_2 = await prisma.permissions.create({
        data: {
            code: 'READ_COURSES',
            name: 'Чтение курсов',
            roles: {
                connect: [
                    { id: roleAdmin.id },
                    { id: roleUser.id },
                    { id: roleTeacher.id }
                ]
            }
        }
    });
    const permission1_3 = await prisma.permissions.create({
        data: {
            code: 'UPDATE_COURSES',
            name: 'Обновление курсов',
            roles: {
                connect: [
                    { id: roleAdmin.id },
                    { id: roleTeacher.id }
                ]
            }
        }
    });
    const permission1_4 = await prisma.permissions.create({
        data: {
            code: 'DELETE_COURSES',
            name: 'Удаление курсов',
            roles: {
                connect: [
                    { id: roleAdmin.id },
                    { id: roleTeacher.id }
                ]
            }
        }
    });
    const permission2_1 = await prisma.permissions.create({
        data: {
            code: 'CRUD_USERS',
            name: 'Круд пользователей',
            roles: {
                connect: [
                    { id: roleAdmin.id }
                ]
            }
        }
    });
    const permission3_1 = await prisma.permissions.create({
        data: {
            code: 'CRUD_ROLES',
            name: 'Круд ролей',
            roles: {
                connect: [
                    { id: roleAdmin.id }
                ]
            }
        }
    });
    const permission4_1 = await prisma.permissions.create({
        data: {
            code: 'CRUD_GROUPS',
            name: 'Круд групп',
            roles: {
                connect: [
                    { id: roleAdmin.id }
                ]
            }
        }
    });

    const permission5_1 = await prisma.permissions.create({
        data: {
            code: 'CRUD_CATEGORIES',
            name: 'Круд категорий',
            roles: {
                connect: [
                    { id: roleAdmin.id }
                ]
            }
        }
    });

    const permission6_1 = await prisma.permissions.create({
        data: {
            code: 'CRUD_LINKS',
            name: 'Круд ссылок',
            roles: {
                connect: [
                    { id: roleAdmin.id }
                ]
            }
        }
    });

    console.log("🌾 Finish seeding...");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });