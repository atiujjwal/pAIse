/*
  Warnings:

  - Made the column `invite_code` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "invite_code" SET NOT NULL;
