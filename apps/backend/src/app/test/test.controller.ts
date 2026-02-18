import { Controller, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Controller('test')
export class TestController {
  constructor(private prisma: PrismaService) {}

  @Post('seed-nounga')
  async seedNounga() {
    console.log('🌱 Seeding Nounga association...');

    // ─── 1. Association ──────────────────────────────────
    const asso = await this.prisma.association.upsert({
      where: { slug: 'nounga' },
      update: {},
      create: {
        slug: 'nounga',
        name: 'Association Familiale Nounga',
        type: 'FAMILY',
        slogan: "Unis dans la tradition, tournés vers l'avenir",
        address_city: 'Douala',
        address_country: 'Cameroun',
        contact_email: 'contact@nounga.org',
        contact_phone: '+237 6XX XXX XXX',
        legal_form: 'Association loi 1901',
        origin_village: 'Bafang',
        origin_region: 'Ouest',
        chieftaincy: 'Chefferie Nounga',
        networkLevel: 'LOCAL',
      },
    });

    // ─── 2. Roles (FAMILY type) ──────────────────────────
    const ALL_PERMS = ['dashboard.view','members.view','members.edit','groups.view','groups.edit','finance.view','finance.edit','events.view','events.edit','settings.manage','roles.manage'];
    const MANAGEMENT = ['dashboard.view','members.view','members.edit','groups.view','groups.edit','finance.view','finance.edit','events.view','events.edit','settings.manage'];
    const VIEW = ['dashboard.view','groups.view','events.view'];

    const rolesDef = [
      { name: 'Administrateur', slug: 'ADMIN', color: '#8b5cf6', isSystem: true, permissions: JSON.stringify(ALL_PERMS) },
      { name: 'Chef de famille', slug: 'CHIEF', color: '#d97706', isSystem: false, permissions: JSON.stringify(MANAGEMENT) },
      { name: 'Notable', slug: 'NOTABLE', color: '#10b981', isSystem: false, permissions: JSON.stringify(['dashboard.view','members.view','groups.view','finance.view','events.view','events.edit']) },
      { name: 'Doyen / Doyenne', slug: 'ELDER', color: '#f59e0b', isSystem: false, permissions: JSON.stringify(['dashboard.view','members.view','groups.view','events.view']) },
      { name: 'Trésorier', slug: 'TREASURER', color: '#f59e0b', isSystem: false, permissions: JSON.stringify(['dashboard.view','finance.view','finance.edit','members.view','events.view','groups.view']) },
      { name: 'Secrétaire', slug: 'SECRETARY', color: '#06b6d4', isSystem: false, permissions: JSON.stringify(['dashboard.view','members.view','members.edit','groups.view','groups.edit','events.view','events.edit']) },
      { name: 'Commissaire aux comptes', slug: 'AUDITOR', color: '#ec4899', isSystem: false, permissions: JSON.stringify(['dashboard.view','finance.view','members.view','events.view']) },
      { name: 'Membre', slug: 'MEMBER', color: '#3b82f6', isSystem: true, permissions: JSON.stringify(VIEW) },
    ];

    for (const r of rolesDef) {
      await this.prisma.role.upsert({
        where: { slug_associationId: { slug: r.slug, associationId: asso.id } },
        update: {},
        create: { ...r, associationId: asso.id },
      });
    }

    // ─── 3. Users ────────────────────────────────────────
    const hash = await bcrypt.hash('password123', 10);

    const usersDef = [
      { email: 'admin@nounga.org', firstName: 'Pierre', lastName: 'Nounga', role: 'ADMIN', status: 'ACTIVE', gender: 'MALE', phone: '+237 690 111 111', residence_city: 'Douala', residence_country: 'CM', family_branch: 'Branche aînée', professionalStatus: 'EMPLOYED', jobTitle: 'Directeur Général', industrySector: 'TECH', availableForMentoring: true },
      { email: 'marie@nounga.org', firstName: 'Marie', lastName: 'Nounga Fotso', role: 'TREASURER', status: 'ACTIVE', gender: 'FEMALE', phone: '+237 690 222 222', residence_city: 'Yaoundé', residence_country: 'CM', family_branch: 'Branche cadette', professionalStatus: 'EMPLOYED', jobTitle: 'Comptable', industrySector: 'FINANCE', availableForMentoring: true },
      { email: 'jean@nounga.org', firstName: 'Jean', lastName: 'Nounga Kamga', role: 'SECRETARY', status: 'ACTIVE', gender: 'MALE', phone: '+237 690 333 333', residence_city: 'Paris', residence_country: 'FR', family_branch: 'Branche aînée', professionalStatus: 'EMPLOYED', jobTitle: 'Ingénieur', industrySector: 'TECH', availableForMentoring: true },
      { email: 'florence@nounga.org', firstName: 'Florence', lastName: 'Nounga Tagne', role: 'MEMBER', status: 'ACTIVE', gender: 'FEMALE', phone: '+237 690 444 444', residence_city: 'Bafoussam', residence_country: 'CM', family_branch: 'Branche cadette', professionalStatus: 'SELF_EMPLOYED', jobTitle: 'Commerçante', industrySector: 'COMMERCE', availableForMentoring: false },
      { email: 'samuel@nounga.org', firstName: 'Samuel', lastName: 'Nounga Djomo', role: 'MEMBER', status: 'ACTIVE', gender: 'MALE', phone: '+237 690 555 555', residence_city: 'Bafang', residence_country: 'CM', family_branch: 'Branche aînée', professionalStatus: 'RETIRED', jobTitle: 'Ancien instituteur', industrySector: 'EDUCATION', availableForMentoring: true },
      { email: 'celine@nounga.org', firstName: 'Céline', lastName: 'Nounga Mbah', role: 'MEMBER', status: 'ACTIVE', gender: 'FEMALE', phone: '+237 690 666 666', residence_city: 'Bruxelles', residence_country: 'BE', family_branch: 'Branche cadette', professionalStatus: 'EMPLOYED', jobTitle: 'Infirmière', industrySector: 'HEALTH', availableForMentoring: true },
      { email: 'paul@nounga.org', firstName: 'Paul', lastName: 'Nounga Nzudie', role: 'MEMBER', status: 'ACTIVE', gender: 'MALE', phone: '+237 690 777 777', residence_city: 'Montréal', residence_country: 'CA', family_branch: 'Branche aînée', professionalStatus: 'EMPLOYED', jobTitle: 'Développeur', industrySector: 'TECH', availableForMentoring: true },
      { email: 'alice@nounga.org', firstName: 'Alice', lastName: 'Nounga Wabo', role: 'MEMBER', status: 'PENDING', gender: 'FEMALE', phone: '+237 690 888 888', residence_city: 'Douala', residence_country: 'CM', family_branch: 'Branche cadette', professionalStatus: 'STUDENT', jobTitle: 'Étudiante en droit', industrySector: 'LEGAL', availableForMentoring: false },
      { email: 'robert@nounga.org', firstName: 'Robert', lastName: 'Nounga Tchoua', role: 'MEMBER', status: 'ACTIVE', gender: 'MALE', phone: '+237 690 999 999', residence_city: 'Bafang', residence_country: 'CM', family_branch: 'Branche aînée', professionalStatus: 'CIVIL_SERVANT', jobTitle: 'Enseignant', industrySector: 'EDUCATION', availableForMentoring: true },
      { email: 'estelle@nounga.org', firstName: 'Estelle', lastName: 'Nounga Kengne', role: 'MEMBER', status: 'ACTIVE', gender: 'FEMALE', phone: '+237 691 000 000', residence_city: 'Lyon', residence_country: 'FR', family_branch: 'Branche cadette', professionalStatus: 'EMPLOYED', jobTitle: 'Avocate', industrySector: 'LEGAL', availableForMentoring: true },
    ];

    const createdUsers: any[] = [];
    for (const u of usersDef) {
      const user = await this.prisma.user.upsert({
        where: { email_associationId: { email: u.email, associationId: asso.id } },
        update: {},
        create: { ...u, password_hash: hash, associationId: asso.id, membership_date: new Date('2024-01-15') },
      });
      createdUsers.push(user);
    }

    const [admin, marie, jean, florence, samuel, celine, paul, alice, robert, estelle] = createdUsers;

    // ─── 4. Groups ───────────────────────────────────────
    const groupsDef = [
      { name: 'Bureau Exécutif', description: "Organe dirigeant de l'association", leaderId: admin.id, memberIds: [admin.id, marie.id, jean.id] },
      { name: 'Commission Finances', description: 'Gestion des cotisations et budget', leaderId: marie.id, memberIds: [marie.id, florence.id, robert.id] },
      { name: 'Commission Événements', description: 'Organisation des cérémonies et fêtes', leaderId: jean.id, memberIds: [jean.id, celine.id, estelle.id, paul.id] },
      { name: 'Diaspora Europe', description: 'Membres résidant en Europe', leaderId: jean.id, memberIds: [jean.id, celine.id, estelle.id] },
      { name: 'Diaspora Amériques', description: "Membres résidant en Amérique du Nord", leaderId: paul.id, memberIds: [paul.id] },
    ];

    for (const g of groupsDef) {
      const { memberIds, ...groupData } = g;
      await this.prisma.group.create({
        data: { ...groupData, associationId: asso.id, members: { connect: memberIds.map(id => ({ id })) } },
      });
    }

    // ─── 5. Campaigns + Fees ─────────────────────────────
    const campaign = await this.prisma.campaign.create({
      data: { associationId: asso.id, name: 'Cotisation Annuelle 2025', description: 'Cotisation annuelle obligatoire pour tous les membres actifs', amount: 25000, due_date: new Date('2025-06-30'), auto_reminder: true },
    });

    const campaign2 = await this.prisma.campaign.create({
      data: { associationId: asso.id, name: 'Fonds Construction Foyer', description: 'Contribution pour la construction du foyer communautaire à Bafang', amount: 50000, due_date: new Date('2025-12-31') },
    });

    const activeMembers = createdUsers.filter(u => u.status === 'ACTIVE');
    for (const member of activeMembers) {
      const isPaid = [admin.id, marie.id, jean.id, samuel.id].includes(member.id);
      await this.prisma.fee.create({ data: { userId: member.id, campaignId: campaign.id, status: isPaid ? 'PAID' : 'PENDING' } });
      await this.prisma.fee.create({ data: { userId: member.id, campaignId: campaign2.id, status: member.id === admin.id ? 'PAID' : 'PENDING' } });
    }

    // ─── 6. Transactions ─────────────────────────────────
    const txns = [
      { amount: 25000, type: 'INCOME', category: 'COTISATION', paymentMethod: 'MOBILE_MONEY', description: 'Cotisation 2025 - Pierre Nounga', date: new Date('2025-01-15') },
      { amount: 25000, type: 'INCOME', category: 'COTISATION', paymentMethod: 'BANK_TRANSFER', description: 'Cotisation 2025 - Marie Nounga Fotso', date: new Date('2025-01-20') },
      { amount: 25000, type: 'INCOME', category: 'COTISATION', paymentMethod: 'MOBILE_MONEY', description: 'Cotisation 2025 - Jean Nounga Kamga', date: new Date('2025-02-01') },
      { amount: 25000, type: 'INCOME', category: 'COTISATION', paymentMethod: 'CASH', description: 'Cotisation 2025 - Samuel Nounga Djomo', date: new Date('2025-02-10') },
      { amount: 50000, type: 'INCOME', category: 'DON', paymentMethod: 'BANK_TRANSFER', description: 'Don - Fonds construction foyer', date: new Date('2025-02-15') },
      { amount: 150000, type: 'EXPENSE', category: 'EVENEMENT', paymentMethod: 'CASH', description: 'Location salle AG Douala', date: new Date('2025-01-10') },
      { amount: 35000, type: 'EXPENSE', category: 'ACHAT', paymentMethod: 'MOBILE_MONEY', description: 'Fournitures de bureau', date: new Date('2025-02-05') },
    ];
    for (const t of txns) {
      await this.prisma.transaction.create({ data: { ...t, associationId: asso.id } });
    }

    // ─── 7. Events ───────────────────────────────────────
    const event1 = await this.prisma.event.create({
      data: { associationId: asso.id, title: 'Assemblée Générale 2025', description: 'AG annuelle : bilan, élections, perspectives', location: 'Hôtel Akwa Palace, Douala', start_date: new Date('2025-03-15T09:00:00'), end_date: new Date('2025-03-15T17:00:00'), type: 'AG' },
    });

    const event2 = await this.prisma.event.create({
      data: { associationId: asso.id, title: 'Fête du village 2025', description: 'Célébration annuelle avec danses traditionnelles', location: 'Bafang, Place du marché', start_date: new Date('2025-08-10T10:00:00'), end_date: new Date('2025-08-10T22:00:00'), type: 'FESTIVAL', is_paid: true, price: 5000 },
    });

    const event3 = await this.prisma.event.create({
      data: { associationId: asso.id, title: 'Réunion mensuelle - Mars', description: 'Point sur les cotisations et préparation AG', location: 'Visioconférence Zoom', start_date: new Date('2025-03-01T14:00:00'), end_date: new Date('2025-03-01T16:00:00'), type: 'MEETING' },
    });

    for (const user of [admin, marie, jean, florence, samuel]) {
      await this.prisma.eventRegistration.create({ data: { eventId: event1.id, userId: user.id, status: 'ATTENDING' } });
    }
    for (const user of [admin, jean, celine, paul, estelle]) {
      await this.prisma.eventRegistration.create({ data: { eventId: event2.id, userId: user.id, status: 'ATTENDING', has_paid: user.id === admin.id } });
    }

    // ─── 8. Announcements ────────────────────────────────
    await this.prisma.announcement.create({
      data: { associationId: asso.id, title: 'Bienvenue sur AssoHub !', content: "Chers membres de la famille Nounga, notre plateforme de gestion est désormais opérationnelle.", authorId: admin.id },
    });
    await this.prisma.announcement.create({
      data: { associationId: asso.id, title: 'Rappel : Cotisation annuelle 2025', content: "N'oubliez pas de régler votre cotisation annuelle de 25 000 XAF avant le 30 juin 2025.", authorId: marie.id },
    });

    // ─── 9. Wallets ──────────────────────────────────────
    const walletsDef = [
      { userId: admin.id, balance: 50000 }, { userId: marie.id, balance: 25000 },
      { userId: jean.id, balance: 15000 }, { userId: florence.id, balance: 5000 },
      { userId: samuel.id, balance: 10000 }, { userId: celine.id, balance: 30000 },
      { userId: paul.id, balance: 20000 }, { userId: robert.id, balance: 0 },
      { userId: estelle.id, balance: 12000 },
    ];

    for (const w of walletsDef) {
      const wallet = await this.prisma.wallet.upsert({
        where: { userId: w.userId }, update: {},
        create: { userId: w.userId, balance: w.balance, currency: 'XAF', status: 'ACTIVE' },
      });
      if (w.balance > 0) {
        await this.prisma.walletTransaction.create({
          data: { walletId: wallet.id, amount: w.balance, type: 'DEPOSIT', status: 'COMPLETED', description: 'Rechargement initial', reference: `INIT-${wallet.id.substring(0, 8)}` },
        });
      }
    }

    // Pending top-up for Robert
    const rWallet = await this.prisma.wallet.findUnique({ where: { userId: robert.id } });
    if (rWallet) {
      await this.prisma.walletTransaction.create({
        data: { walletId: rWallet.id, amount: 10000, type: 'DEPOSIT', status: 'PENDING', description: 'Rechargement Orange Money', reference: 'OM-PENDING-001' },
      });
    }

    // ─── 10. Skills ──────────────────────────────────────
    const skillNames = ['Comptabilité', 'Développement Web', 'Droit', 'Médecine', 'Enseignement', 'Commerce', 'Gestion de projet', 'Communication'];
    const skills: any[] = [];
    for (const name of skillNames) {
      const skill = await this.prisma.skill.upsert({
        where: { name_associationId: { name, associationId: asso.id } }, update: {},
        create: { name, associationId: asso.id, category: 'OTHER' },
      });
      skills.push(skill);
    }

    const assigns = [
      { userId: admin.id, skillId: skills[1].id, level: 'EXPERT' },
      { userId: admin.id, skillId: skills[6].id, level: 'EXPERT' },
      { userId: marie.id, skillId: skills[0].id, level: 'EXPERT' },
      { userId: jean.id, skillId: skills[1].id, level: 'INTERMEDIATE' },
      { userId: estelle.id, skillId: skills[2].id, level: 'EXPERT' },
      { userId: celine.id, skillId: skills[3].id, level: 'EXPERT' },
      { userId: samuel.id, skillId: skills[4].id, level: 'EXPERT' },
      { userId: florence.id, skillId: skills[5].id, level: 'EXPERT' },
      { userId: paul.id, skillId: skills[1].id, level: 'EXPERT' },
    ];
    for (const sa of assigns) {
      await this.prisma.userSkill.upsert({
        where: { userId_skillId: { userId: sa.userId, skillId: sa.skillId } }, update: {},
        create: sa,
      });
    }

    return {
      message: '🎉 Seed Nounga complet !',
      association: asso.name,
      users: createdUsers.map(u => u.email),
      stats: { roles: 8, users: 10, groups: 5, campaigns: 2, transactions: 7, events: 3, announcements: 2, wallets: 9, skills: 8 },
      login: 'admin@nounga.org / password123',
    };
  }
}
