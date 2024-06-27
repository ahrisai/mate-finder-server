-- DropForeignKey
ALTER TABLE "Cs2_dataCs2Maps" DROP CONSTRAINT "Cs2_dataCs2Maps_cs2MapId_fkey";

-- AddForeignKey
ALTER TABLE "Cs2_dataCs2Maps" ADD CONSTRAINT "Cs2_dataCs2Maps_cs2MapId_fkey" FOREIGN KEY ("cs2MapId") REFERENCES "Cs2Maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
