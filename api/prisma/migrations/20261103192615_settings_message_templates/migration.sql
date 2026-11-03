-- The subject and body templates (docs/GLOSSARY.md: Template). They replace MAIL_SUBJECT and the body the code had; a
-- settings row saved before them gets a fresh install's templates.
ALTER TABLE "settings" ADD COLUMN     "body_template" TEXT NOT NULL DEFAULT 'Leitura - {reading} - {date}',
ADD COLUMN     "subject_template" TEXT NOT NULL DEFAULT 'Leitura {date}';
