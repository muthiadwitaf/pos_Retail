-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "change_amount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "paid_amount" DECIMAL(10,2),
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "qr_code_url" TEXT;
