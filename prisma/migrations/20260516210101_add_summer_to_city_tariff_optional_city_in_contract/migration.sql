-- AlterTable
ALTER TABLE "CityTariff" ADD COLUMN     "summerEndMonth" INTEGER,
ADD COLUMN     "summerStartMonth" INTEGER;

-- AlterTable
ALTER TABLE "EnergyContract" ALTER COLUMN "city" DROP NOT NULL;
