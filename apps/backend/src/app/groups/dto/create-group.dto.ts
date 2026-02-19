export class CreateGroupDto {
    name: string;
    description?: string;
    leaderId?: string;
    memberIds?: string[];
    // Hierarchy & Scope
    parentId?: string;
    scope?: string; // NATIONAL, BRANCH
    attachedToId?: string;
}
