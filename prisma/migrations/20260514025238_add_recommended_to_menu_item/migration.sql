-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'CASHIER');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('TABLE', 'TAKEAWAY');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CREDIT_CARD');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_table_id_fkey";

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "role" "AdminRole" NOT NULL DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "is_recommended" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "order_type" "OrderType" NOT NULL DEFAULT 'TABLE',
ADD COLUMN     "queue_number" TEXT,
ADD COLUMN     "restaurant_id" TEXT,
ADD COLUMN     "service_charge_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "vat_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ALTER COLUMN "table_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "service_charge_rate" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "vat_rate" DECIMAL(65,30) NOT NULL DEFAULT 7;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE';

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "clock_in" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clock_out" TIMESTAMP(3),
    "opening_float" DECIMAL(65,30) NOT NULL,
    "closing_summary" JSONB,
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
