export class CreateUserDto {
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string; // SUPER_ADMIN, ADMIN, TREASURER, SECRETARY, MEMBER
}
