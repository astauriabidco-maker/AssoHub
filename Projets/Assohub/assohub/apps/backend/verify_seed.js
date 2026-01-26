const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');

const db = new Database('dev.db');
const adapter = new PrismaBetterSqlite3(db);
const prisma = new PrismaClient({ adapter });

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@verification.com' }
    });
    console.log('User found:', user);
    const association = await prisma.association.findFirst();
    console.log('Association found:', association);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
