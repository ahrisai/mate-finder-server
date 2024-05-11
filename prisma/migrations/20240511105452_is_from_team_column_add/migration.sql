/*
  Warnings:

  - Added the required column `isFromTeam` to the `TeamRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TeamRequest" ADD COLUMN     "isFromTeam" BOOLEAN NOT NULL;
