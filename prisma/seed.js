import { PrismaClient } from "@prisma/client";
import { rolesData } from "./seeds/roles.js";
import { usersData } from "./seeds/users.js";
import { groupsData } from "./seeds/groups.js";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Start seeding...");

    await prisma.roles.createMany({
        data: rolesData
    });

    await prisma.groups.createMany({
        data: groupsData
    })

    await prisma.user.createMany({
        data: usersData
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