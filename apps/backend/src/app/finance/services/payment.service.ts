"use client";

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-change-me';

    constructor(private prisma: PrismaService) { }

    // ── HELPER: Encryption ──
    private encryptKey(text: string): string {
        if (!text) return '';
        return CryptoJS.AES.encrypt(text, this.ENCRYPTION_KEY).toString();
    }

    private decryptKey(ciphertext: string): string {
        if (!ciphertext) return '';
        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, this.ENCRYPTION_KEY);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            this.logger.error("Failed to decrypt key", e);
            return '';
        }
    }

    // ── GET CONFIG ──
    async getPaymentConfig(associationId: string) {
        const config = await this.prisma.paymentConfig.findUnique({
            where: { associationId },
        });

        if (!config) {
            return {
                associationId,
                provider: 'MANUAL',
                publicKey: '',
                secretKey: '',
                isEnabled: false,
            };
        }

        return {
            ...config,
            secretKey: config.secretKey ? '••••••••' : '', // Mask for display
        };
    }

    // ── UPDATE CONFIG ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updatePaymentConfig(associationId: string, dto: any) {
        let encryptedSecret = '';
        if (dto.secretKey && !dto.secretKey.includes('•')) {
            encryptedSecret = this.encryptKey(dto.secretKey);
        } else {
            const existing = await this.prisma.paymentConfig.findUnique({ where: { associationId } });
            encryptedSecret = existing?.secretKey || '';
        }

        return this.prisma.paymentConfig.upsert({
            where: { associationId },
            update: {
                provider: dto.provider,
                publicKey: dto.publicKey,
                secretKey: encryptedSecret,
                isEnabled: dto.isEnabled,
            },
            create: {
                associationId,
                provider: dto.provider,
                publicKey: dto.publicKey,
                secretKey: encryptedSecret,
                isEnabled: dto.isEnabled,
            },
        });
    }

    // ── PROCESS PAYMENT (STRIPE / MOBILE MONEY) ──
    async processPayment(associationId: string, amount: number, description: string, providerOverride?: string, phoneNumber?: string): Promise<string> {
        // 1. Fetch Config
        const config = await this.prisma.paymentConfig.findUnique({
            where: { associationId }
        });

        if (!config || !config.isEnabled) {
            throw new BadRequestException('Les paiements en ligne ne sont pas activés pour cette association.');
        }

        const provider = providerOverride || config.provider;
        let paymentReference = `TX-${Date.now()}`;

        try {
            if (provider === 'STRIPE') {
                const secretKey = this.decryptKey(config.secretKey);

                if (secretKey && secretKey.startsWith('sk_')) {
                    try {
                        const stripeResponse = await axios.post(
                            'https://api.stripe.com/v1/charges',
                            new URLSearchParams({
                                amount: (amount * 100).toString(),
                                currency: 'xaf',
                                source: 'tok_visa',
                                description: description,
                            }).toString(),
                            {
                                headers: {
                                    Authorization: `Bearer ${secretKey}`,
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                }
                            }
                        );
                        paymentReference = stripeResponse.data.id;
                    } catch (apiError) {
                        this.logger.error("Stripe API failed", apiError.message);
                        if (!secretKey.includes('test')) throw new BadRequestException("Échec du paiement Stripe");
                    }
                }
            } else if (provider === 'ORANGE_MONEY' || provider === 'MTNC') {
                this.logger.log(`Initiating Mobile Money payment to ${phoneNumber} via ${provider}`);
                await new Promise(r => setTimeout(r, 1500));

                if (!phoneNumber) throw new BadRequestException("Numéro de téléphone requis");
                if (phoneNumber === '000000000') throw new BadRequestException("Paiement refusé par l'opérateur (Simulé)");
            }

        } catch (error) {
            this.logger.error(`Payment Gateway Error: ${error.message}`);
            throw new BadRequestException(`Erreur de paiement: ${error.message}`);
        }

        return paymentReference;
    }
}
