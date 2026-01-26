const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3'); // Ensure this is available
const bcrypt = require('bcrypt');

const path = require('path');
const dbPath = path.join(__dirname, 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: 'file:' + dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
    const passwordHash = await bcrypt.hash('admin123', 10);

    const association = await prisma.association.create({
        data: {
            name: 'Assohub Demo',
            slogan: 'Innovation pour le monde associatif',
            description: 'Plateforme de gestion complète pour les associations de toutes tailles.',
            contact_email: 'contact@assohub-demo.org',
            contact_phone: '+33 1 23 45 67 89',
            address_street: '12 rue de la Paix',
            address_city: 'Paris',
            address_zip: '75002',
            address_country: 'France',
            legal_form: 'Association Loi 1901',
            settings: {},
            subscription_plan: 'FREE',
        },
    });

    const user = await prisma.user.create({
        data: {
            associationId: association.id,
            email: 'admin@verification.com',
            password_hash: passwordHash,
            firstName: 'Admin',
            lastName: 'Verification',
            role: 'ADMIN',
            status: 'ACTIVE',
        },
    });

    console.log('Seed successful:');
    console.log('Email: admin@verification.com');
    console.log('Password: admin123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
