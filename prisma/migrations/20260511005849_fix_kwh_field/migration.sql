/*
  Warnings:

  - You are about to drop the column `KwhConsumed` on the `ConsumptionRecord` table. All the data in the column will be lost.
  - Added the required column `kwhConsumed` to the `ConsumptionRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConsumptionRecord" DROP COLUMN "KwhConsumed",
ADD COLUMN     "kwhConsumed" DOUBLE PRECISION NOT NULL;
