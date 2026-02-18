export class CreateGroupDto {
    name: string;
    description?: string;
    leaderId?: string;
    memberIds?: string[];
}
