/*
  Warnings:

  - Added the required column `city` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postalCode` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "postalCode" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL;
