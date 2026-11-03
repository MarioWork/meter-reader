-- AlterTable
ALTER TABLE "readings" ADD COLUMN     "cost_cents" INTEGER;

-- A Cost is never below 0 (docs/GLOSSARY.md). Prisma cannot say this in the schema, so the check lives here.
ALTER TABLE "readings" ADD CONSTRAINT "readings_cost_cents_check" CHECK ("cost_cents" >= 0);
