-- CreateEnum
CREATE TYPE "StockReason" AS ENUM ('RESTOCK', 'ADJUST', 'WASTE', 'ORDER_DEDUCT', 'ORDER_REFUND');

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "low_stock_threshold" INTEGER,
ADD COLUMN     "stock_qty" DECIMAL(65,30),
ADD COLUMN     "stock_unit" TEXT;

-- CreateTable
CREATE TABLE "StockLedger" (
    "id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "delta" DECIMAL(65,30) NOT NULL,
    "balance_after" DECIMAL(65,30) NOT NULL,
    "reason" "StockReason" NOT NULL,
    "note" TEXT,
    "admin_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockLedger_restaurant_id_created_at_idx" ON "StockLedger"("restaurant_id", "created_at");

-- CreateIndex
CREATE INDEX "StockLedger_menu_item_id_idx" ON "StockLedger"("menu_item_id");

-- AddForeignKey
ALTER TABLE "StockLedger" ADD CONSTRAINT "StockLedger_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLedger" ADD CONSTRAINT "StockLedger_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
