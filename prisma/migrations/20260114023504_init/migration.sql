-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT,
    "purchaseValue" DECIMAL NOT NULL DEFAULT 0,
    "marketValue" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'VACANT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT
);

-- CreateTable
CREATE TABLE "AssetOwner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "percentage" DECIMAL NOT NULL DEFAULT 100,
    CONSTRAINT "AssetOwner_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssetOwner_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "value" DECIMAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rental_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Owner_cpf_key" ON "Owner"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "AssetOwner_assetId_ownerId_key" ON "AssetOwner"("assetId", "ownerId");
