CREATE TABLE "asset_contracts" (
  "id" SERIAL NOT NULL,
  "asset_id" INTEGER NOT NULL,
  "contract_id" TEXT NOT NULL,
  "contract_name" TEXT NOT NULL,
  "maintenance_vendor" TEXT,
  "from_date" TIMESTAMP(3),
  "to_date" TIMESTAMP(3),
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT,
  CONSTRAINT "asset_contracts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "asset_costs" (
  "id" SERIAL NOT NULL,
  "asset_id" INTEGER NOT NULL,
  "cost_factor" TEXT NOT NULL,
  "cost_amount" DOUBLE PRECISION NOT NULL,
  "description" TEXT,
  "cost_date" TIMESTAMP(3),
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT,
  CONSTRAINT "asset_costs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "asset_contracts_asset_id_idx" ON "asset_contracts"("asset_id");
CREATE INDEX "asset_costs_asset_id_idx" ON "asset_costs"("asset_id");

ALTER TABLE "asset_contracts"
  ADD CONSTRAINT "asset_contracts_asset_id_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "asset_costs"
  ADD CONSTRAINT "asset_costs_asset_id_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
