-- CreateTable
CREATE TABLE "MemberShip" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "MemberShip_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MemberShip" ADD CONSTRAINT "MemberShip_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberShip" ADD CONSTRAINT "MemberShip_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberShip" ADD CONSTRAINT "MemberShip_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Cs2Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
