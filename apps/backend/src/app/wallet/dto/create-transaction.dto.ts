export class CreateTransactionDto {
    amount: number;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'TRANSFER' | 'ADJUSTMENT';
    reference?: string;
    description?: string;
}

export class AdminCreditDto extends CreateTransactionDto {
    userId: string;
}
