-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletionPolicyVersion" TEXT;
