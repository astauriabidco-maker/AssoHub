import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateObjectiveDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @IsOptional()
    @IsString()
    assignedToId?: string;

    @IsOptional()
    @IsString()
    status?: string;
}
