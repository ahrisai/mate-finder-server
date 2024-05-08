-- DropForeignKey
ALTER TABLE "CheckedBy" DROP CONSTRAINT "CheckedBy_messageId_fkey";

-- DropForeignKey
ALTER TABLE "CheckedBy" DROP CONSTRAINT "CheckedBy_userId_fkey";

-- AddForeignKey
ALTER TABLE "CheckedBy" ADD CONSTRAINT "CheckedBy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckedBy" ADD CONSTRAINT "CheckedBy_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
