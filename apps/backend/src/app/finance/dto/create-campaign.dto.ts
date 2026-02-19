export class CreateCampaignDto {
    name: string;
    amount: number;
    due_date: string; // ISO date string
    description?: string;
    scope?: string; // LOCAL (default), NETWORK_MEMBERS, NETWORK_BRANCHES
    frequency?: string; // ONETIME, MONTHLY, QUARTERLY, YEARLY
}
