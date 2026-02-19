import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    // ── CREATE NOTIFICATION ──
    async create(userId: string, data: {
        title: string;
        message: string;
        type?: string;
        link?: string;
        metadata?: any;
    }) {
        return this.prisma.notification.create({
            data: {
                userId,
                title: data.title,
                message: data.message,
                type: data.type || 'INFO',
                link: data.link || null,
                metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            },
        });
    }

    // ── NOTIFY USER (DB + Email if needed) ──
    // ── NOTIFY USER (DB + Email if needed) ──
    async notify(userId: string, data: {
        title: string;
        message: string;
        type?: string;
        link?: string;
        metadata?: any;
        sendEmail?: boolean;
    }) {
        // 1. Create in DB
        const notif = await this.create(userId, data);

        // 2. Send Email (Optional)
        if (data.sendEmail) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, firstName: true },
            });

            if (user && user.email) {
                // In a real app, we would use a proper email template
                await this.mailService.sendInvitation({
                    to: user.email,
                    memberName: user.firstName || 'Membre',
                    associationName: 'AssoHub', // Generic name or fetch if needed
                    inviteUrl: data.link ? `${process.env.FRONTEND_URL || 'http://localhost:4200'}${data.link}` : '#',
                });
                this.logger.log(`📧 Notification email sent to ${user.email}: ${data.title}`);
            }
        }

        return notif;
    }

    // ── LIST USER NOTIFICATIONS ──
    async findAll(userId: string, limit = 20) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    // ── UNREAD COUNT ──
    async getUnreadCount(userId: string) {
        return this.prisma.notification.count({
            where: { userId, read: false },
        });
    }

    // ── MARK AS READ ──
    async markAsRead(userId: string, notificationId: string) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { read: true, readAt: new Date() },
        });
    }

    // ── MARK ALL AS READ ──
    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true, readAt: new Date() },
        });
    }
}
