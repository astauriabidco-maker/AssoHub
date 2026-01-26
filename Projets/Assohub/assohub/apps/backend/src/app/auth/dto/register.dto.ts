import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    associationName: string;

    @IsEmail()
    adminEmail: string;

    @IsString()
    @MinLength(6)
    adminPassword: string;

    @IsString()
    @IsOptional()
    adminFirstName?: string;

    @IsString()
    @IsOptional()
    adminLastName?: string;

    @IsString()
    @IsOptional()
    phone?: string;
}
