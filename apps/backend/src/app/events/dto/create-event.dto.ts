export class CreateEventDto {
    title: string;
    description?: string;
    location?: string;
    start_date: string; // ISO date string
    end_date?: string;
    type?: string; // MEETING, AG, PARTY
}
