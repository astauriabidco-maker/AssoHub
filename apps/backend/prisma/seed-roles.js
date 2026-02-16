const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

async function main() {
    const dbPath = path.resolve(__dirname, 'dev.db');
    const adapter = new PrismaBetterSqlite3({ url: 'file:' + dbPath });
    const prisma = new PrismaClient({ adapter });

    const assocs = await prisma.association.findMany();
    console.log('Found', assocs.length, 'associations');

    for (const a of assocs) {
        const count = await prisma.role.count({ where: { associationId: a.id } });
        if (count > 0) {
            console.log(a.name, 'already has', count, 'roles');
            continue;
        }

        const roles = [
            { name: 'Administrateur', slug: 'ADMIN', color: '#8b5cf6', isSystem: true, permissions: JSON.stringify(['dashboard.view', 'members.view', 'members.edit', 'groups.view', 'groups.edit', 'finance.view', 'finance.edit', 'events.view', 'events.edit', 'settings.manage', 'roles.manage']) },
            { name: 'Président', slug: 'PRESIDENT', color: '#10b981', isSystem: true, permissions: JSON.stringify(['dashboard.view', 'members.view', 'members.edit', 'groups.view', 'groups.edit', 'finance.view', 'finance.edit', 'events.view', 'events.edit', 'settings.manage']) },
            { name: 'Trésorier', slug: 'TREASURER', color: '#f59e0b', isSystem: false, permissions: JSON.stringify(['dashboard.view', 'finance.view', 'finance.edit', 'members.view', 'events.view', 'groups.view']) },
            { name: 'Secrétaire', slug: 'SECRETARY', color: '#06b6d4', isSystem: false, permissions: JSON.stringify(['dashboard.view', 'members.view', 'members.edit', 'groups.view', 'groups.edit', 'events.view', 'events.edit']) },
            { name: 'Membre', slug: 'MEMBER', color: '#3b82f6', isSystem: true, permissions: JSON.stringify(['dashboard.view', 'groups.view', 'events.view']) },
        ];

        for (const r of roles) {
            await prisma.role.create({ data: { ...r, associationId: a.id } });
        }
        console.log('Seeded 5 roles for', a.name);
    }

    await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
