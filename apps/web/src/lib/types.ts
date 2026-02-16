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
    };
}
