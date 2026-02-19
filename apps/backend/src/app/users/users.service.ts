import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { USER_SELECT, PaginatedResult } from '../shared/user-select';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private mail: MailService,
    ) { }

    /**
     * Find a single user by id + associationId.
     * Shared helper — used by both UsersService and DirectoryService.
     * Throws NotFoundException if not found.
     */
    async findById(associationId: string, id: string) {
        const user = await this.prisma.user.findFirst({
            where: { id, associationId },
        });
        if (!user) throw new NotFoundException('Utilisateur non trouvé.');
        return user;
    }

    /**
     * List all members of an association with pagination.
     */
    async findAll(
        associationId: string,
        page = 1,
        limit = 50,
    ): Promise<PaginatedResult<typeof USER_SELECT>> {
        const skip = (page - 1) * limit;
        const where = { associationId };

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: USER_SELECT,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users as unknown as (typeof USER_SELECT)[],
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async create(associationId: string, dto: CreateUserDto) {
        const existingUser = await this.prisma.user.findFirst({
            where: { email: dto.email, associationId },
        });

        if (existingUser) {
            throw new ConflictException(
                'Un utilisateur avec cet email existe déjà dans votre association.',
            );
        }

        // Random temporary password (virtual users won't log in)
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                role: dto.role || 'MEMBER',
                status: dto.isVirtual ? 'ACTIVE' : 'ACTIVE',
                gender: dto.gender || null,
                isVirtual: dto.isVirtual || false,
                associationId,
                password_hash: passwordHash,
                residence_city: dto.residence_city,
                residence_country: dto.residence_country,
                family_branch: dto.family_branch,
                familyBranchId: dto.familyBranchId || null,
                birth_date: dto.birth_date ? new Date(dto.birth_date) : null,
                membership_date: dto.membership_date ? new Date(dto.membership_date) : null,
            },
            select: USER_SELECT,
        });

        // Auto-create family links if parentIds or spouseId provided
        if (dto.parentIds && dto.parentIds.length > 0) {
            // ── Validation: max 2 parents ──
            if (dto.parentIds.length > 2) {
                throw new BadRequestException('Un membre ne peut avoir plus de 2 parents.');
            }

            // ── Validation: gender coherence ──
            if (dto.parentIds.length === 2) {
                const parents = await this.prisma.user.findMany({
                    where: { id: { in: dto.parentIds }, associationId },
                    select: { id: true, gender: true, firstName: true, lastName: true },
                });

                const genders = parents.map(p => p.gender).filter(Boolean);
                const maleCount = genders.filter(g => g === 'MALE').length;
                const femaleCount = genders.filter(g => g === 'FEMALE').length;

                if (maleCount >= 2) {
                    throw new BadRequestException('Incohérence : un enfant ne peut pas avoir 2 pères.');
                }
                if (femaleCount >= 2) {
                    throw new BadRequestException('Incohérence : un enfant ne peut pas avoir 2 mères.');
                }
            }

            for (const parentId of dto.parentIds) {
                await this.prisma.familyLink.create({
                    data: {
                        associationId,
                        fromUserId: parentId,
                        toUserId: user.id,
                        relationType: 'PARENT',
                    },
                }).catch(() => {
                    // Ignore duplicate links silently
                });
            }
        }

        if (dto.spouseId) {
            await this.prisma.familyLink.create({
                data: {
                    associationId,
                    fromUserId: user.id,
                    toUserId: dto.spouseId,
                    relationType: 'SPOUSE',
                },
            }).catch(() => {
                // Ignore duplicate links silently
            });
        }

        return user;
    }

    async updateStatus(
        associationId: string,
        id: string,
        status: 'ACTIVE' | 'SUSPENDED',
    ) {
        await this.findById(associationId, id);

        return this.prisma.user.update({
            where: { id },
            data: { status },
            select: USER_SELECT,
        });
    }

    async update(associationId: string, id: string, dto: UpdateUserDto) {
        await this.findById(associationId, id);

        // Extract family link fields (not Prisma model fields)
        const { parentIds, spouseId, ...userData } = dto;

        // Convert date strings to Date objects, empty strings to null
        (userData as any).birth_date = userData.birth_date
            ? new Date(userData.birth_date)
            : userData.birth_date === '' ? null : undefined;
        (userData as any).membership_date = userData.membership_date
            ? new Date(userData.membership_date)
            : userData.membership_date === '' ? null : undefined;

        // Convert empty strings to null for FK fields
        if (userData.familyBranchId === '') {
            (userData as any).familyBranchId = null;
        }

        // Remove undefined fields to avoid overwriting with undefined
        const cleanData = Object.fromEntries(
            Object.entries(userData).filter(([, v]) => v !== undefined)
        );

        const user = await this.prisma.user.update({
            where: { id },
            data: cleanData,
            select: USER_SELECT,
        });

        // ── Sync parent links ──
        if (parentIds !== undefined) {
            // Get existing parent links (where this user is the child)
            const existingParentLinks = await this.prisma.familyLink.findMany({
                where: { associationId, toUserId: id, relationType: 'PARENT' },
            });
            const existingParentIds = existingParentLinks.map(l => l.fromUserId);
            const desiredParentIds = parentIds || [];

            // Remove links no longer desired
            const toRemove = existingParentLinks.filter(l => !desiredParentIds.includes(l.fromUserId));
            for (const link of toRemove) {
                await this.prisma.familyLink.delete({ where: { id: link.id } });
            }

            // Add new links
            const toAdd = desiredParentIds.filter(pid => !existingParentIds.includes(pid));
            for (const parentId of toAdd) {
                await this.prisma.familyLink.create({
                    data: { associationId, fromUserId: parentId, toUserId: id, relationType: 'PARENT' },
                }).catch(() => { /* ignore duplicates */ });
            }
        }

        // ── Sync spouse link ──
        if (spouseId !== undefined) {
            // Get existing spouse links (either direction)
            const existingSpouseLinks = await this.prisma.familyLink.findMany({
                where: {
                    associationId,
                    relationType: 'SPOUSE',
                    OR: [{ fromUserId: id }, { toUserId: id }],
                },
            });

            const desiredSpouseId = spouseId || null;

            // Remove all existing spouse links for this user
            for (const link of existingSpouseLinks) {
                const otherUserId = link.fromUserId === id ? link.toUserId : link.fromUserId;
                if (otherUserId !== desiredSpouseId) {
                    await this.prisma.familyLink.delete({ where: { id: link.id } });
                }
            }

            // Add new spouse link if needed and not already present
            if (desiredSpouseId) {
                const alreadyExists = existingSpouseLinks.some(l =>
                    (l.fromUserId === id && l.toUserId === desiredSpouseId) ||
                    (l.fromUserId === desiredSpouseId && l.toUserId === id)
                );
                if (!alreadyExists) {
                    await this.prisma.familyLink.create({
                        data: { associationId, fromUserId: id, toUserId: desiredSpouseId, relationType: 'SPOUSE' },
                    }).catch(() => { /* ignore duplicates */ });
                }
            }
        }

        return user;
    }

    async remove(associationId: string, id: string) {
        await this.findById(associationId, id);

        // Delete related family links first to avoid constraint errors if cascading is not set up
        await this.prisma.familyLink.deleteMany({
            where: {
                associationId,
                OR: [{ fromUserId: id }, { toUserId: id }],
            },
        });

        // Delete user
        return this.prisma.user.delete({
            where: { id },
        });
    }

    // ── CSV Export ──

    private readonly CSV_HEADERS = [
        'prenom', 'nom', 'email', 'telephone', 'genre', 'role', 'statut',
        'ville_residence', 'pays_residence', 'branche_familiale',
        'date_naissance', 'date_adhesion', 'parent1', 'parent2', 'conjoint',
    ] as const;

    async exportCsv(associationId: string): Promise<string> {
        const users = await this.prisma.user.findMany({
            where: { associationId },
            select: {
                ...USER_SELECT,
                familyLinksTo: {
                    where: { relationType: 'PARENT' },
                    include: { fromUser: { select: { firstName: true, lastName: true } } },
                },
                familyLinksFrom: {
                    where: { relationType: 'SPOUSE' },
                    include: { toUser: { select: { firstName: true, lastName: true } } },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        const escCsv = (v: string | null | undefined) => {
            if (!v) return '';
            const s = String(v);
            return s.includes(',') || s.includes('"') || s.includes('\n')
                ? `"${s.replace(/"/g, '""')}"` : s;
        };

        const lines = [this.CSV_HEADERS.join(',')];

        for (const u of users) {
            const parents = (u as any).familyLinksTo || [];
            const spouseLinks = (u as any).familyLinksFrom || [];
            const parent1 = parents[0]?.fromUser;
            const parent2 = parents[1]?.fromUser;
            const spouse = spouseLinks[0]?.toUser;

            const row = [
                escCsv(u.firstName),
                escCsv(u.lastName),
                escCsv(u.email),
                escCsv(u.phone),
                escCsv(u.gender),
                escCsv(u.role),
                escCsv(u.status),
                escCsv(u.residence_city),
                escCsv(u.residence_country),
                escCsv(u.family_branch),
                u.birth_date ? new Date(u.birth_date).toISOString().split('T')[0] : '',
                u.membership_date ? new Date(u.membership_date).toISOString().split('T')[0] : '',
                parent1 ? escCsv([parent1.firstName, parent1.lastName].filter(Boolean).join(' ')) : '',
                parent2 ? escCsv([parent2.firstName, parent2.lastName].filter(Boolean).join(' ')) : '',
                spouse ? escCsv([spouse.firstName, spouse.lastName].filter(Boolean).join(' ')) : '',
            ];
            lines.push(row.join(','));
        }

        return lines.join('\n');
    }

    // ── CSV Import ──

    async importCsv(associationId: string, csvContent: string) {
        const lines = csvContent.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
            throw new BadRequestException('Le fichier CSV est vide ou ne contient pas de données.');
        }

        // Parse header
        const headerLine = lines[0].toLowerCase().replace(/["\s]/g, '');
        const headers = headerLine.split(',');

        const colIndex = (name: string) => headers.indexOf(name);
        const emailIdx = colIndex('email');
        if (emailIdx === -1) {
            throw new BadRequestException('La colonne "email" est obligatoire dans le CSV.');
        }

        // Parse rows
        const parseCsvRow = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            for (const char of line) {
                if (char === '"') { inQuotes = !inQuotes; continue; }
                if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
                current += char;
            }
            result.push(current.trim());
            return result;
        };

        // Preload existing members for duplicate check & parent resolution
        const existingUsers = await this.prisma.user.findMany({
            where: { associationId },
            select: { id: true, email: true, firstName: true, lastName: true },
        });
        const emailSet = new Set(existingUsers.map(u => u.email.toLowerCase()));
        const nameToId = new Map<string, string>();
        for (const u of existingUsers) {
            const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ').toLowerCase();
            if (fullName) nameToId.set(fullName, u.id);
        }

        // Preload branches
        const branches = await this.prisma.familyBranch.findMany({
            where: { associationId },
            select: { id: true, name: true },
        });
        const branchNameToId = new Map(branches.map(b => [b.name.toLowerCase(), b.id]));

        const results = { created: 0, skipped: 0, errors: [] as string[] };
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        for (let i = 1; i < lines.length; i++) {
            const cols = parseCsvRow(lines[i]);
            const email = cols[emailIdx];
            if (!email) {
                results.errors.push(`Ligne ${i + 1}: email manquant.`);
                continue;
            }

            if (emailSet.has(email.toLowerCase())) {
                results.skipped++;
                continue;
            }

            try {
                const get = (name: string) => cols[colIndex(name)] || undefined;
                const branchName = get('branche_familiale');
                const branchId = branchName ? branchNameToId.get(branchName.toLowerCase()) : undefined;

                const user = await this.prisma.user.create({
                    data: {
                        email,
                        firstName: get('prenom') || null,
                        lastName: get('nom') || null,
                        phone: get('telephone') || null,
                        gender: get('genre') || null,
                        role: get('role') || 'MEMBER',
                        status: 'ACTIVE',
                        associationId,
                        password_hash: passwordHash,
                        residence_city: get('ville_residence') || null,
                        residence_country: get('pays_residence') || null,
                        family_branch: branchName || null,
                        familyBranchId: branchId || null,
                        birth_date: get('date_naissance') ? new Date(get('date_naissance')!) : null,
                        membership_date: get('date_adhesion') ? new Date(get('date_adhesion')!) : null,
                    },
                });

                // Track for subsequent rows
                emailSet.add(email.toLowerCase());
                const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').toLowerCase();
                if (fullName) nameToId.set(fullName, user.id);

                // Resolve parent links by name
                const parent1Name = get('parent1')?.toLowerCase();
                const parent2Name = get('parent2')?.toLowerCase();
                const parentIds = [parent1Name, parent2Name]
                    .filter(Boolean)
                    .map(name => nameToId.get(name!))
                    .filter(Boolean) as string[];

                for (const parentId of parentIds) {
                    await this.prisma.familyLink.create({
                        data: { associationId, fromUserId: parentId, toUserId: user.id, relationType: 'PARENT' },
                    }).catch(() => { });
                }

                // Resolve spouse by name
                const spouseName = get('conjoint')?.toLowerCase();
                if (spouseName) {
                    const spouseId = nameToId.get(spouseName);
                    if (spouseId) {
                        await this.prisma.familyLink.create({
                            data: { associationId, fromUserId: user.id, toUserId: spouseId, relationType: 'SPOUSE' },
                        }).catch(() => { });
                    }
                }

                results.created++;
            } catch (err) {
                results.errors.push(`Ligne ${i + 1} (${email}): ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
            }
        }

        return results;
    }

    // ── Invitation ──

    async sendInvitation(associationId: string, userId: string, baseUrl: string) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, associationId },
            include: { association: { select: { name: true } } },
        });

        if (!user) throw new NotFoundException('Membre introuvable.');
        if (user.isVirtual) {
            throw new BadRequestException('Impossible d\'inviter un membre virtuel (fantôme).');
        }

        // Check if already invited with valid token
        if (user.invitation_token && user.invitation_expires && new Date(user.invitation_expires) > new Date()) {
            throw new BadRequestException('Une invitation est déjà en cours pour ce membre. Elle expire le ' +
                new Date(user.invitation_expires).toLocaleDateString('fr-FR') + '.');
        }

        // Generate unique token (URL-safe)
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                invitation_token: token,
                invitation_expires: expires,
                status: 'PENDING',
            },
        });

        const inviteUrl = `${baseUrl}/invite/${token}`;
        const memberName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

        await this.mail.sendInvitation({
            to: user.email,
            memberName,
            associationName: user.association.name,
            inviteUrl,
        });

        return { sent: true, email: user.email, expires: expires.toISOString() };
    }

    async acceptInvitation(token: string, password: string) {
        const user = await this.prisma.user.findFirst({
            where: { invitation_token: token },
            include: { association: { select: { id: true, name: true, slug: true, type: true } } },
        });

        if (!user) {
            throw new BadRequestException('Lien d\'invitation invalide ou expiré.');
        }

        if (!user.invitation_expires || new Date(user.invitation_expires) < new Date()) {
            throw new BadRequestException('Ce lien d\'invitation a expiré. Demandez à l\'administrateur de renvoyer l\'invitation.');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password_hash: passwordHash,
                status: 'ACTIVE',
                invitation_token: null,
                invitation_expires: null,
            },
        });

        return {
            success: true,
            email: user.email,
            associationName: user.association.name,
        };
    }
}
