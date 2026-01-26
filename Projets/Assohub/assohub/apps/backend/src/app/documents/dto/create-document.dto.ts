import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateDocumentDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(['AG_REPORT', 'INVOICE', 'STATUTS', 'OTHER'])
    @IsNotEmpty()
    category: 'AG_REPORT' | 'INVOICE' | 'STATUTS' | 'OTHER';

    @IsString()
    @IsOptional()
    eventId?: string;

    @IsEnum(['PUBLIC', 'MEMBERS_ONLY', 'ADMIN_ONLY'])
    @IsOptional()
    accessLevel?: 'PUBLIC' | 'MEMBERS_ONLY' | 'ADMIN_ONLY';
}
