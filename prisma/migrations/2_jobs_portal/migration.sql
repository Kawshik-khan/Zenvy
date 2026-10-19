-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('JOB', 'INTERNSHIP', 'PART_TIME', 'REFERRAL');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID');

-- CreateEnum
CREATE TYPE "ApplyMethod" AS ENUM ('LINK', 'EMAIL', 'MESSAGE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING_REVIEW', 'LIVE', 'REJECTED', 'EXPIRED', 'REMOVED');

-- CreateEnum
CREATE TYPE "PosterTrust" AS ENUM ('STUDENT', 'ALUMNI', 'VERIFIED_EMPLOYER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "posterTrust" "PosterTrust" NOT NULL DEFAULT 'STUDENT';

-- CreateTable
CREATE TABLE "JobPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "company" VARCHAR(120) NOT NULL,
    "location" VARCHAR(120) NOT NULL,
    "workMode" "WorkMode" NOT NULL,
    "pay" VARCHAR(80),
    "description" VARCHAR(5000) NOT NULL,
    "applyMethod" "ApplyMethod" NOT NULL,
    "applyTarget" TEXT,
    "tags" TEXT[],
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "scamSignals" TEXT[],
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobMedia" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "JobMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSave" (
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobSave_pkey" PRIMARY KEY ("userId","jobId")
);

-- CreateTable
CREATE TABLE "JobReport" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobPost_status_deadline_idx" ON "JobPost"("status", "deadline");

-- CreateIndex
CREATE INDEX "JobPost_status_type_createdAt_idx" ON "JobPost"("status", "type", "createdAt");

-- CreateIndex
CREATE INDEX "JobPost_authorId_createdAt_idx" ON "JobPost"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "JobMedia_jobId_order_idx" ON "JobMedia"("jobId", "order");

-- CreateIndex
CREATE INDEX "JobSave_jobId_idx" ON "JobSave"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "JobReport_jobId_reporterId_key" ON "JobReport"("jobId", "reporterId");

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMedia" ADD CONSTRAINT "JobMedia_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSave" ADD CONSTRAINT "JobSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSave" ADD CONSTRAINT "JobSave_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobReport" ADD CONSTRAINT "JobReport_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobReport" ADD CONSTRAINT "JobReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

