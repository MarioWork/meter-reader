-- CreateEnum
CREATE TYPE "SignInMethod" AS ENUM ('PASSWORD', 'PASSKEY');

-- CreateEnum
CREATE TYPE "AuthChallengePurpose" AS ENUM ('SETUP', 'SIGN_IN');

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "webauthn_user_id" TEXT NOT NULL,
    "password_hash" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passkeys" (
    "id" SERIAL NOT NULL,
    "credential_id" TEXT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "public_key" BYTEA NOT NULL,
    "counter" INTEGER NOT NULL,
    "transports" TEXT[],
    "is_synced" BOOLEAN NOT NULL,
    "last_used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passkeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "token_hash" TEXT NOT NULL,
    "sign_in_method" "SignInMethod" NOT NULL,
    "signed_in_at" TIMESTAMPTZ(3) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_challenges" (
    "id" SERIAL NOT NULL,
    "challenge" TEXT NOT NULL,
    "purpose" "AuthChallengePurpose" NOT NULL,
    "webauthn_user_id" TEXT,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setup_codes" (
    "id" SERIAL NOT NULL,
    "code_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setup_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "passkeys_credential_id_uidx" ON "passkeys"("credential_id");

-- CreateIndex
CREATE INDEX "passkeys_account_id_idx" ON "passkeys"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_uidx" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_last_seen_at_idx" ON "sessions"("last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "auth_challenges_challenge_uidx" ON "auth_challenges"("challenge");

-- CreateIndex
CREATE INDEX "auth_challenges_expires_at_idx" ON "auth_challenges"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "setup_codes_code_hash_uidx" ON "setup_codes"("code_hash");

-- AddForeignKey
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
