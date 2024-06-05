-- CreateTable
CREATE TABLE "RecentMatch" (
    "id" SERIAL NOT NULL,
    "cs2DataId" INTEGER NOT NULL,
    "map" TEXT NOT NULL,
    "result" BOOLEAN NOT NULL,
    "stat" TEXT NOT NULL,
    "kad" TEXT NOT NULL,
    "kd" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "eloChange" TEXT NOT NULL,

    CONSTRAINT "RecentMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecentMatch_cs2DataId_key" ON "RecentMatch"("cs2DataId");

-- AddForeignKey
ALTER TABLE "RecentMatch" ADD CONSTRAINT "RecentMatch_cs2DataId_fkey" FOREIGN KEY ("cs2DataId") REFERENCES "Cs2_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;
