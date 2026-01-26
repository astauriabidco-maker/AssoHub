-- AlterTable
ALTER TABLE "Association" ADD COLUMN "address_city" TEXT;
ALTER TABLE "Association" ADD COLUMN "address_country" TEXT;
ALTER TABLE "Association" ADD COLUMN "address_street" TEXT;
ALTER TABLE "Association" ADD COLUMN "address_zip" TEXT;
ALTER TABLE "Association" ADD COLUMN "contact_email" TEXT;
ALTER TABLE "Association" ADD COLUMN "contact_phone" TEXT;
ALTER TABLE "Association" ADD COLUMN "description" TEXT;
ALTER TABLE "Association" ADD COLUMN "legal_form" TEXT;
ALTER TABLE "Association" ADD COLUMN "logo_url" TEXT;
ALTER TABLE "Association" ADD COLUMN "slogan" TEXT;

-- AlterTable
ALTER TABLE "Fee" ADD COLUMN "paidAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "associationId" TEXT NOT NULL,
    "eventId" TEXT,
    "name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "access_level" TEXT NOT NULL DEFAULT 'ADMIN_ONLY',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("access_level", "associationId", "category", "createdAt", "file_path", "id", "name", "updatedAt") SELECT "access_level", "associationId", "category", "createdAt", "file_path", "id", "name", "updatedAt" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
