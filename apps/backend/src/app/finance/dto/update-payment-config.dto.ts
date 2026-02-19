export class UpdatePaymentConfigDto {
    provider: string; // MANUAL, STRIPE, ORANGE_MONEY, MTNC
    publicKey?: string;
    secretKey?: string;
    isEnabled?: boolean;
}
