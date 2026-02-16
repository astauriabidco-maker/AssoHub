-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "associationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" REAL NOT NULL,
    "due_date" DATETIME NOT NULL,
    "auto_reminder" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT NOT NULL DEFAULT 'LOCAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("amount", "associationId", "auto_reminder", "createdAt", "description", "due_date", "id", "name", "updatedAt") SELECT "amount", "associationId", "auto_reminder", "createdAt", "description", "due_date", "id", "name", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE TABLE "new_Fee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "campaignId" TEXT NOT NULL,
    "targetAssociationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_link_token" TEXT,
    "last_reminder_at" DATETIME,
    "reminder_count" INTEGER NOT NULL DEFAULT 0,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Fee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Fee_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fee_targetAssociationId_fkey" FOREIGN KEY ("targetAssociationId") REFERENCES "Association" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Fee_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Fee" ("campaignId", "createdAt", "id", "last_reminder_at", "payment_link_token", "reminder_count", "status", "transactionId", "updatedAt", "userId") SELECT "campaignId", "createdAt", "id", "last_reminder_at", "payment_link_token", "reminder_count", "status", "transactionId", "updatedAt", "userId" FROM "Fee";
DROP TABLE "Fee";
ALTER TABLE "new_Fee" RENAME TO "Fee";
CREATE UNIQUE INDEX "Fee_payment_link_token_key" ON "Fee"("payment_link_token");
CREATE UNIQUE INDEX "Fee_transactionId_key" ON "Fee"("transactionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
