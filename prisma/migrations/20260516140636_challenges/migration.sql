-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "habitType" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "collectiveXp" INTEGER NOT NULL DEFAULT 0,
    "groupShieldPercent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeMember" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xpInChallenge" INTEGER NOT NULL DEFAULT 0,
    "completedDays" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "hasCheckedInToday" BOOLEAN NOT NULL DEFAULT false,
    "lastCheckinDate" TIMESTAMP(3),

    CONSTRAINT "ChallengeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeMessage" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeCheckin" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "xpEarned" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeDailyProgress" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalMembers" INTEGER NOT NULL,
    "checkedInCount" INTEGER NOT NULL,
    "completedCount" INTEGER NOT NULL,
    "difficultCount" INTEGER NOT NULL,
    "collectiveXpEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChallengeDailyProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_inviteCode_key" ON "Challenge"("inviteCode");

-- CreateIndex
CREATE INDEX "Challenge_visibility_createdAt_idx" ON "Challenge"("visibility", "createdAt");

-- CreateIndex
CREATE INDEX "ChallengeMember_challengeId_idx" ON "ChallengeMember"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeMember_challengeId_userId_key" ON "ChallengeMember"("challengeId", "userId");

-- CreateIndex
CREATE INDEX "ChallengeMessage_challengeId_createdAt_idx" ON "ChallengeMessage"("challengeId", "createdAt");

-- CreateIndex
CREATE INDEX "ChallengeCheckin_challengeId_date_idx" ON "ChallengeCheckin"("challengeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeCheckin_challengeId_userId_date_key" ON "ChallengeCheckin"("challengeId", "userId", "date");

-- CreateIndex
CREATE INDEX "ChallengeDailyProgress_challengeId_date_idx" ON "ChallengeDailyProgress"("challengeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeDailyProgress_challengeId_date_key" ON "ChallengeDailyProgress"("challengeId", "date");

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeMember" ADD CONSTRAINT "ChallengeMember_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeMember" ADD CONSTRAINT "ChallengeMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeMessage" ADD CONSTRAINT "ChallengeMessage_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeMessage" ADD CONSTRAINT "ChallengeMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeCheckin" ADD CONSTRAINT "ChallengeCheckin_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeCheckin" ADD CONSTRAINT "ChallengeCheckin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeDailyProgress" ADD CONSTRAINT "ChallengeDailyProgress_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
