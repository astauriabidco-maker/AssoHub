export class CreateEventDto {
    title: string;
    description?: string;
    location?: string;
    start_date: string; // ISO date string
    end_date?: string;
    type?: string; // MEETING, AG, PARTY
    is_paid?: boolean;
    price?: number;
    recurrence?: string; // NONE, WEEKLY, MONTHLY, YEARLY
    recurrenceEnd?: string; // ISO date
    reminderTime?: number; // Minutes
}
