/*
  Warnings:

  - You are about to drop the column `checked` on the `CheckedBy` table. All the data in the column will be lost.
  - Added the required column `isChecked` to the `CheckedBy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CheckedBy" DROP COLUMN "checked",
ADD COLUMN     "isChecked" BOOLEAN NOT NULL;
