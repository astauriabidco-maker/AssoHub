-- CreateTable
CREATE TABLE "FamilyBranch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "founderName" TEXT,
    "description" TEXT,
    "associationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FamilyBranch_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "associationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "gender" TEXT,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "residence_city" TEXT,
    "residence_country" TEXT,
    "family_branch" TEXT,
    "familyBranchId" TEXT,
    "birth_date" DATETIME,
    "membership_date" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "professionalStatus" TEXT,
    "jobTitle" TEXT,
    "industrySector" TEXT,
    "employer" TEXT,
    "educationLevel" TEXT,
    "fieldOfStudy" TEXT,
    "availableForMentoring" BOOLEAN NOT NULL DEFAULT false,
    "profileVisibility" TEXT NOT NULL DEFAULT 'MEMBERS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_familyBranchId_fkey" FOREIGN KEY ("familyBranchId") REFERENCES "FamilyBranch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("associationId", "availableForMentoring", "avatar_url", "birth_date", "createdAt", "educationLevel", "email", "employer", "family_branch", "fieldOfStudy", "firstName", "gender", "id", "industrySector", "isVirtual", "jobTitle", "lastName", "membership_date", "password_hash", "phone", "professionalStatus", "profileVisibility", "residence_city", "residence_country", "role", "status", "updatedAt") SELECT "associationId", "availableForMentoring", "avatar_url", "birth_date", "createdAt", "educationLevel", "email", "employer", "family_branch", "fieldOfStudy", "firstName", "gender", "id", "industrySector", "isVirtual", "jobTitle", "lastName", "membership_date", "password_hash", "phone", "professionalStatus", "profileVisibility", "residence_city", "residence_country", "role", "status", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_associationId_key" ON "User"("email", "associationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
