-- AlterTable
ALTER TABLE "User" ADD COLUMN "birth_date" DATETIME;
ALTER TABLE "User" ADD COLUMN "family_branch" TEXT;
ALTER TABLE "User" ADD COLUMN "membership_date" DATETIME;
ALTER TABLE "User" ADD COLUMN "residence_city" TEXT;
ALTER TABLE "User" ADD COLUMN "residence_country" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Association" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "slogan" TEXT,
    "logo_url" TEXT,
    "address_street" TEXT,
    "address_city" TEXT,
    "address_zip" TEXT,
    "address_country" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "legal_form" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "origin_village" TEXT,
    "origin_region" TEXT,
    "chieftaincy" TEXT,
    "parentId" TEXT,
    "networkLevel" TEXT NOT NULL DEFAULT 'LOCAL',
    CONSTRAINT "Association_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Association" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Association" ("address_city", "address_country", "address_street", "address_zip", "contact_email", "contact_phone", "createdAt", "id", "is_active", "legal_form", "logo_url", "name", "networkLevel", "parentId", "slogan", "slug", "updatedAt") SELECT "address_city", "address_country", "address_street", "address_zip", "contact_email", "contact_phone", "createdAt", "id", "is_active", "legal_form", "logo_url", "name", "networkLevel", "parentId", "slogan", "slug", "updatedAt" FROM "Association";
DROP TABLE "Association";
ALTER TABLE "new_Association" RENAME TO "Association";
CREATE UNIQUE INDEX "Association_slug_key" ON "Association"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
