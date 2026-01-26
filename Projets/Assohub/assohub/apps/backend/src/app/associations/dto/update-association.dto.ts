import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';

export class UpdateAssociationDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    slogan?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    logo_url?: string;

    @IsString()
    @IsOptional()
    address_street?: string;

    @IsString()
    @IsOptional()
    address_city?: string;

    @IsString()
    @IsOptional()
    address_zip?: string;

    @IsString()
    @IsOptional()
    address_country?: string;

    @IsEmail()
    @IsOptional()
    contact_email?: string;

    @IsString()
    @IsOptional()
    contact_phone?: string;

    @IsString()
    @IsOptional()
    legal_form?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
