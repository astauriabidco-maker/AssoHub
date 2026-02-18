export interface AuthResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: string;
    };
    association: {
        id: string;
        name: string;
        slug: string;
        type: string;
    };
}

export interface WalletTransaction {
    id: string;
    amount: number;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'TRANSFER' | 'ADJUSTMENT';
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    reference?: string;
    description?: string;
    createdAt: string;
}

export interface Wallet {
    id: string;
    balance: number;
    currency: string;
    status: string;
    transactions?: WalletTransaction[];
}
