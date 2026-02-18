export class CreateUserDto {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
    gender?: string;        // MALE, FEMALE, OTHER
    isVirtual?: boolean;    // Fantôme (ancêtre non-inscrit)
    residence_city?: string;
    residence_country?: string;
    family_branch?: string;
    birth_date?: string;
    membership_date?: string;
    // Professional profile
    professionalStatus?: string;
    jobTitle?: string;
    industrySector?: string;
    employer?: string;
    educationLevel?: string;
    fieldOfStudy?: string;
    availableForMentoring?: boolean;
    profileVisibility?: string;
    // Family links (created after user creation)
    parentIds?: string[];   // IDs of parent members
    spouseId?: string;      // ID of spouse member
}
