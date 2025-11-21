-- ============================================
-- Migration: Optimize partner_balance table
-- Purpose: Remove duplicates and add triggers
-- ============================================

-- Step 1: Remove duplicate columns from partner_balance
ALTER TABLE public.partner_balance
DROP COLUMN IF EXISTS items CASCADE;

ALTER TABLE public.partner_balance
DROP COLUMN IF EXISTS transaction_type CASCADE;

-- Step 2: Create trigger function for INSERT
CREATE OR REPLACE FUNCTION update_partner_balance_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.partner_balance (
    user_id,
    partner_id,
    total_amount,
    paid_amount,
    remaining_amount,
    payment_status,
    transaction_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.user_id,
    NEW.partner_id,
    NEW.total_value,
    NEW.paid_amount,
    NEW.remaining_amount,
    NEW.payment_status,
    NEW.id,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger function for UPDATE
CREATE OR REPLACE FUNCTION update_partner_balance_on_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.partner_balance
  SET 
    total_amount = NEW.total_value,
    paid_amount = NEW.paid_amount,
    remaining_amount = NEW.remaining_amount,
    payment_status = NEW.payment_status,
    updated_at = NOW()
  WHERE transaction_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger function for DELETE
CREATE OR REPLACE FUNCTION update_partner_balance_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.partner_balance
  WHERE transaction_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trg_partner_balance_insert ON public.transactions;
DROP TRIGGER IF EXISTS trg_partner_balance_update ON public.transactions;
DROP TRIGGER IF EXISTS trg_partner_balance_delete ON public.transactions;

-- Step 6: Create triggers
CREATE TRIGGER trg_partner_balance_insert
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION update_partner_balance_on_insert();

CREATE TRIGGER trg_partner_balance_update
AFTER UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION update_partner_balance_on_update();

CREATE TRIGGER trg_partner_balance_delete
AFTER DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION update_partner_balance_on_delete();

-- Step 7: Verify triggers are created
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'transactions'
ORDER BY trigger_name;
