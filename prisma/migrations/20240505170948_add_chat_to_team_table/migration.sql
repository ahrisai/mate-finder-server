/*
  Warnings:

  - A unique constraint covering the columns `[teamId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "teamId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Chat_teamId_key" ON "Chat"("teamId");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
