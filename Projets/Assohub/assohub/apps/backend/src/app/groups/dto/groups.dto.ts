import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGroupDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateGroupDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class AddMemberDto {
    @IsNotEmpty()
    @IsUUID()
    userId: string;
}

export class SetLeaderDto {
    @IsNotEmpty()
    @IsUUID()
    userId: string;
}
