/*
  Warnings:

  - Added the required column `link` to the `RecentMatch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RecentMatch" ADD COLUMN     "link" TEXT NOT NULL;
