-- WebAuthn / Passkey credentials enrolled by users.
-- One user may have multiple credentials (one per device). When at
-- least one row exists for a user, the in-app lock screen will
-- require biometric verification on every fresh app launch.
CREATE TABLE "PasskeyCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "transports" TEXT[],
    "deviceLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasskeyCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasskeyCredential_credentialId_key"
    ON "PasskeyCredential"("credentialId");
CREATE INDEX "PasskeyCredential_userId_idx"
    ON "PasskeyCredential"("userId");

ALTER TABLE "PasskeyCredential"
    ADD CONSTRAINT "PasskeyCredential_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
