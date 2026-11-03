-- How {date} is written in every email (docs/GLOSSARY.md: Date format). A settings row saved before it gets a fresh
-- install's, "31 October 2026", the format every email had until now.
-- CreateEnum
CREATE TYPE "MessageDateFormat" AS ENUM ('LONG_MONTH', 'SHORT_MONTH', 'DAY_MONTH_YEAR', 'ISO');

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "date_format" "MessageDateFormat" NOT NULL DEFAULT 'LONG_MONTH';
