-- Add receipt slip file path to fuel purchases
ALTER TABLE fuel_purchases 
ADD COLUMN IF NOT EXISTS receipt_slip_path VARCHAR(500);

-- Add index for receipt lookups
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_receipt_slip ON fuel_purchases(receipt_slip_path) WHERE receipt_slip_path IS NOT NULL;

