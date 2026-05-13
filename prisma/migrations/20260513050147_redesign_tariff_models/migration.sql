/*
  Warnings:

  - You are about to drop the column `kwhConsumed` on the `ConsumptionRecord` table. All the data in the column will be lost.
  - You are about to drop the column `month` on the `ConsumptionRecord` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `ConsumptionRecord` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Tariff` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Tariff` table. All the data in the column will be lost.
  - You are about to drop the column `fixedCharge` on the `Tariff` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Tariff` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerKwh` on the `Tariff` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[type]` on the table `Tariff` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `kwhNonSummer` to the `ConsumptionRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kwhSummer` to the `ConsumptionRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodEnd` to the `ConsumptionRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodStart` to the `ConsumptionRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `EnergyContract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Tariff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConsumptionRecord" DROP COLUMN "kwhConsumed",
DROP COLUMN "month",
DROP COLUMN "year",
ADD COLUMN     "kwhNonSummer" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "kwhSummer" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "periodEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "periodStart" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "EnergyContract" ADD COLUMN     "city" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tariff" DROP COLUMN "city",
DROP COLUMN "createdAt",
DROP COLUMN "fixedCharge",
DROP COLUMN "name",
DROP COLUMN "pricePerKwh",
ADD COLUMN     "summerEndMonth" INTEGER,
ADD COLUMN     "summerStartMonth" INTEGER,
ADD COLUMN     "type" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "CityTariff" (
    "id" SERIAL NOT NULL,
    "city" TEXT NOT NULL,
    "tariffId" INTEGER NOT NULL,

    CONSTRAINT "CityTariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffMonthlyRate" (
    "id" SERIAL NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "isSummer" BOOLEAN NOT NULL DEFAULT false,
    "fixedCharge" DOUBLE PRECISION NOT NULL,
    "tariffId" INTEGER NOT NULL,

    CONSTRAINT "TariffMonthlyRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffBlock" (
    "id" SERIAL NOT NULL,
    "blockOrder" INTEGER NOT NULL,
    "blockName" TEXT NOT NULL,
    "kwhLimit" DOUBLE PRECISION,
    "pricePerKwh" DOUBLE PRECISION NOT NULL,
    "tariffMonthlyRateId" INTEGER NOT NULL,

    CONSTRAINT "TariffBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CityTariff_city_key" ON "CityTariff"("city");

-- CreateIndex
CREATE UNIQUE INDEX "TariffMonthlyRate_tariffId_month_year_isSummer_key" ON "TariffMonthlyRate"("tariffId", "month", "year", "isSummer");

-- CreateIndex
CREATE UNIQUE INDEX "TariffBlock_tariffMonthlyRateId_blockOrder_key" ON "TariffBlock"("tariffMonthlyRateId", "blockOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Tariff_type_key" ON "Tariff"("type");

-- AddForeignKey
ALTER TABLE "CityTariff" ADD CONSTRAINT "CityTariff_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffMonthlyRate" ADD CONSTRAINT "TariffMonthlyRate_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffBlock" ADD CONSTRAINT "TariffBlock_tariffMonthlyRateId_fkey" FOREIGN KEY ("tariffMonthlyRateId") REFERENCES "TariffMonthlyRate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
