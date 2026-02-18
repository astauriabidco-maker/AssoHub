export class RegisterDto {
    associationName: string;
    associationType?: string; // FAMILY, CULTURAL, SPORTS, POLITICAL, RELIGIOUS, OTHER
    originVillage?: string;   // If FAMILY
    originRegion?: string;    // If FAMILY
    chieftaincy?: string;     // If FAMILY
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
