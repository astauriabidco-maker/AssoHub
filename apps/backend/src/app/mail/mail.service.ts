import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    /**
     * Send an invitation email.
     */
    async sendInvitation(params: {
        to: string;
        memberName: string;
        associationName: string;
        inviteUrl: string;
    }) {
        this.logEmail('INVITATION EMAIL', params.to, `
            Hello ${params.memberName},
            You are invited to join ${params.associationName}.
            Join here: ${params.inviteUrl}
        `);
        return { sent: true };
    }

    /**
     * Send a notification that a new fee/campaign has been assigned.
     */
    async sendFeeCreatedEmail(params: {
        to: string;
        memberName: string;
        title: string;
        amount: number;
        dueDate: Date;
        paymentLink: string;
    }) {
        this.logEmail('NEW FEE ASSIGNED', params.to, `
            Hello ${params.memberName},
            A new fee is assigned to you: "${params.title}".
            Amount: ${params.amount} XAF
            Due Date: ${params.dueDate.toLocaleDateString()}
            
            Pay securely online: ${params.paymentLink}
        `);
        return { sent: true };
    }

    /**
     * Send a payment reminder for overdue fees.
     */
    async sendPaymentReminderEmail(params: {
        to: string;
        memberName: string;
        title: string;
        amount: number;
        daysOverdue: number;
        paymentLink: string;
    }) {
        this.logEmail('PAYMENT REMINDER', params.to, `
            Hello ${params.memberName},
            
            REMINDER: Your payment for "${params.title}" is overdue by ${params.daysOverdue} days.
            Amount Due: ${params.amount} XAF
            
            Please pay immediately: ${params.paymentLink}
        `);
        return { sent: true };
    }

    /**
     * Send a payment receipt.
     */
    async sendPaymentReceipt(params: {
        to: string;
        memberName: string;
        title: string;
        amount: number;
        transactionId: string;
        date: Date;
    }) {
        this.logEmail('PAYMENT RECEIPT', params.to, `
            Hello ${params.memberName},
            
            We received your payment for "${params.title}".
            Amount Paid: ${params.amount} XAF
            Date: ${params.date.toLocaleDateString()}
            Transaction ID: ${params.transactionId}
            
            Thank you!
        `);
        return { sent: true };
    }

    private logEmail(subject: string, to: string, body: string) {
        this.logger.log('──────────────────────────────────────────');
        this.logger.log(`📧  ${subject}`);
        this.logger.log(`    To: ${to}`);
        // Simple trim for log display
        const lines = body.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        lines.forEach(l => this.logger.log(`    ${l}`));
        this.logger.log('──────────────────────────────────────────');
    }
}
