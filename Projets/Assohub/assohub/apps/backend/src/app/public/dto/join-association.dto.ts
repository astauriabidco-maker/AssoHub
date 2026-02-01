import { IsNotEmpty, IsEmail, IsString, IsOptional } from 'class-validator';

export class JoinAssociationDto {
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    phone?: string;
}
