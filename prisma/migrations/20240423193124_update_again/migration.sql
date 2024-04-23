/*
  Warnings:

  - Added the required column `roleId` to the `TeamRequest` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "TeamRequest_teamId_key";

-- AlterTable
ALTER TABLE "TeamRequest" ADD COLUMN     "roleId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "TeamRequest" ADD CONSTRAINT "TeamRequest_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Cs2Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
