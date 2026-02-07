-- First migration: add columns and enum value only
-- The function will be created in a separate migration

-- Add auto_accept_price_sek to tasks table for instant booking
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS auto_accept_price_sek integer;

-- Add customer_fee_sek and tasker_fee_sek to payments (if not already added)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='customer_fee_sek') THEN
    ALTER TABLE public.payments ADD COLUMN customer_fee_sek integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='tasker_fee_sek') THEN
    ALTER TABLE public.payments ADD COLUMN tasker_fee_sek integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add unique constraint: one offer per tasker per task (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offers_task_tasker_unique') THEN
    ALTER TABLE public.offers ADD CONSTRAINT offers_task_tasker_unique UNIQUE (task_id, tasker_user_id);
  END IF;
END $$;