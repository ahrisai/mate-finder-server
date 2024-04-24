/*
  Warnings:

  - You are about to drop the column `userId` on the `TeamRequest` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "TeamRequest" DROP CONSTRAINT "TeamRequest_userId_fkey";

-- AlterTable
ALTER TABLE "TeamRequest" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "TeamRequest" ADD CONSTRAINT "TeamRequest_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
