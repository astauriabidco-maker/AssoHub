export class RegisterDto {
    associationName: string;
    associationType?: string; // FAMILY, CULTURAL, SPORTS, POLITICAL, RELIGIOUS, OTHER
    originVillage?: string;   // If FAMILY
    originRegion?: string;    // If FAMILY
    chieftaincy?: string;     // If FAMILY
    branches?: { name: string; founderName?: string }[]; // If FAMILY: initial branches
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
