import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateStatusDto {
    @IsNotEmpty()
    @IsString()
    @IsIn(['ACTIVE', 'SUSPENDED'])
    status: 'ACTIVE' | 'SUSPENDED';
}
