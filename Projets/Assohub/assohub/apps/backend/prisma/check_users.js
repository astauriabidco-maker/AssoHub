
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Point to the correct DB file path relative to where this script is run
// If run from /.../assohub/apps/backend/prisma, then 'dev.db' is correct.
const dbPath = path.join(__dirname, 'dev.db');
console.log('Opening DB at:', dbPath);

const db = new Database(dbPath);
const adapter = new PrismaBetterSqlite3(db);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('Users found:', users.length);
        users.forEach(u => console.log(`- ${u.email}`));
    } catch (e) {
        console.error('Error:', e);
    }
}

main()
    .finally(async () => await prisma.$disconnect());
