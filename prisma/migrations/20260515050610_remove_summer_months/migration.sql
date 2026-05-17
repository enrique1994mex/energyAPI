/*
  Warnings:

  - You are about to drop the column `summerEndMonth` on the `Tariff` table. All the data in the column will be lost.
  - You are about to drop the column `summerStartMonth` on the `Tariff` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tariff" DROP COLUMN "summerEndMonth",
DROP COLUMN "summerStartMonth";
