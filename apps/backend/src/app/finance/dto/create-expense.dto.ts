export class CreateExpenseDto {
    amount: number;
    category: string; // LOYER, ASSURANCE, TRANSPORT, MATERIEL, EVENEMENT, AUTRE
    paymentMethod?: string; // CASH, BANK_TRANSFER, MOBILE_MONEY, CARD, OTHER
    date?: string; // ISO date string, defaults to now
    description?: string;
    treasuryAccountId?: string; // Optional: link to a treasury account
}
