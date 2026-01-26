import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsBoolean()
    @IsOptional()
    isPaid?: boolean;

    @IsNumber()
    @IsOptional()
    price?: number;
}
