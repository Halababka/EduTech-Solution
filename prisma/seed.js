import { PrismaClient } from "@prisma/client";
import { usersData } from "./seeds/users.js";
import { groupsData } from "./seeds/groups.js";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Start seeding...");

    // Роли

    const roleUser = await prisma.roles.create({
        data: {
            name: "USER"
        }
    });

    const roleTeacher = await prisma.roles.create({
        data: {
            name: "TEACHER"
        }
    });

    const roleAdmin = await prisma.roles.create({
        data: {
            name: "ADMIN"
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

    const permission1 = await prisma.permissions.create({
        data: {
            name: 'CREATE_COURSE',
            roles: {
                connect: [
                    { id: roleAdmin.id },
                    { id: roleTeacher.id }
                ]
            }
        }
    });
    const permission2 = await prisma.permissions.create({
        data: {
            name: 'READ_COURSES',
            roles: {
                connect: [
                    { id: roleAdmin.id },
                    { id: roleUser.id },
                    { id: roleTeacher.id }
                ]
            }
        }
    });
    const permission3 = await prisma.permissions.create({
        data: {
            name: 'UPDATE_COURSES',
            roles: {
                connect: [
                    { id: roleAdmin.id },
                    { id: roleTeacher.id }
                ]
            }
        }
    });
    const permission4 = await prisma.permissions.create({
        data: {
            name: 'CRUD_USERS',
            roles: {
                connect: [
                    { id: roleAdmin.id }
                ]
            }
        }
    });
    const permission5 = await prisma.permissions.create({
        data: {
            name: 'CRUD_ROLES',
            roles: {
                connect: [
                    { id: roleAdmin.id }
                ]
            }
        }
    });
    const permission6 = await prisma.permissions.create({
        data: {
            name: 'CRUD_GROUPS',
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