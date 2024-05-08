/*
  Warnings:

  - You are about to drop the column `checked` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "checked";

-- CreateTable
CREATE TABLE "CheckedBy" (
    "id" SERIAL NOT NULL,
    "checked" BOOLEAN NOT NULL,
    "userId" INTEGER NOT NULL,
    "messageId" INTEGER NOT NULL,

    CONSTRAINT "CheckedBy_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CheckedBy" ADD CONSTRAINT "CheckedBy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckedBy" ADD CONSTRAINT "CheckedBy_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
