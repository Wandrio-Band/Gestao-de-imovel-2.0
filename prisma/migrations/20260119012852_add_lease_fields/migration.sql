/*
  Warnings:

  - You are about to drop the `AssetOwner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Owner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rental` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `purchaseValue` on the `Asset` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "AssetOwner_assetId_ownerId_key";

-- DropIndex
DROP INDEX "Owner_cpf_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AssetOwner";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Owner";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Rental";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "AssetPartner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "percentage" DECIMAL NOT NULL,
    CONSTRAINT "AssetPartner_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Financing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "valorTotal" DECIMAL NOT NULL,
    "subtotalConstrutora" DECIMAL NOT NULL,
    "valorFinanciar" DECIMAL NOT NULL,
    "valorQuitado" DECIMAL,
    "saldoDevedor" DECIMAL,
    "dataAssinatura" TEXT,
    "vencimentoConstrutora" TEXT,
    "vencimentoPrimeira" TEXT,
    "prazoMeses" TEXT,
    "jurosAnuais" TEXT,
    "indexador" TEXT,
    "sistemaAmortizacao" TEXT,
    "taxaAdm" TEXT,
    "seguros" TEXT,
    "phases" TEXT,
    "cashFlow" TEXT,
    CONSTRAINT "Financing_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lease" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "nomeInquilino" TEXT NOT NULL,
    "documentoInquilino" TEXT,
    "emailInquilino" TEXT,
    "valorAluguel" DECIMAL NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "inicioVigencia" TEXT,
    "fimContrato" TEXT,
    "garantia" TEXT,
    "indexador" TEXT,
    "contractFile" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lease_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "areaPrivative" DECIMAL,
    "areaTotal" DECIMAL,
    "bedrooms" INTEGER,
    "suites" INTEGER,
    "bathrooms" INTEGER,
    "parkingSpaces" INTEGER,
    "matricula" TEXT,
    "iptu" TEXT,
    "registryOffice" TEXT,
    "acquisitionDate" TEXT,
    "irpfStatus" TEXT,
    "acquisitionOrigin" TEXT,
    "value" DECIMAL NOT NULL DEFAULT 0,
    "marketValue" DECIMAL NOT NULL DEFAULT 0,
    "declaredValue" DECIMAL,
    "saleForecast" TEXT,
    "suggestedRentalValue" DECIMAL,
    "rentalValue" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Vago',
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Asset" ("address", "city", "createdAt", "id", "marketValue", "name", "state", "status", "type", "updatedAt", "zipCode") SELECT "address", "city", "createdAt", "id", "marketValue", "name", "state", "status", "type", "updatedAt", "zipCode" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AssetPartner_assetId_idx" ON "AssetPartner"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "Financing_assetId_key" ON "Financing"("assetId");
