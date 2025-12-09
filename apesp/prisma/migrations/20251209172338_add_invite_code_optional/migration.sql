/*
  Warnings:

  - A unique constraint covering the columns `[invite_code]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "invite_code" TEXT,
ADD COLUMN     "invite_code_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_invite_code_key" ON "User"("invite_code");

-- CreateIndex
CREATE INDEX "User_invite_code_idx" ON "User"("invite_code");
