export class CreateChildDto {
    name: string;
    address_city?: string;
    networkLevel?: string; // INTERNATIONAL, NATIONAL, REGIONAL, LOCAL
    adminEmail: string;
    adminFirstName: string;
    adminLastName: string;
}
