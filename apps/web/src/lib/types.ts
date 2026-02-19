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

export interface UserAssociation {
    id: string;
    userId: string;
    associationId: string;
    role: string;
    joinedAt: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        avatar_url?: string;
        phone?: string;
        residence_city?: string;
        residence_country?: string;
    };
    association: {
        id: string;
        name: string;
        address_city?: string;
        networkLevel?: string;
        is_active?: boolean;
    };
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ASSIGNMENT' | 'OBJECTIVE' | 'DOCUMENT';
    read: boolean;
    link?: string;
    metadata?: string;
    createdAt: string;
}
