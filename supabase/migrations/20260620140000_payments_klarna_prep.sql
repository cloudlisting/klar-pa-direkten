-- Payment method + marketplace payout/refund prep.
-- Förberedelse för Klarna och framtida Stripe Connect-payouts. Inga befintliga
-- kolumner ändras; allt är nullable så befintliga rader och flöden påverkas inte.
--
-- Befintliga kolumner som redan täcker delar av detta:
--   provider              -> payment_provider (t.ex. 'stripe')
--   provider_reference_id -> payment_intent_id
--   platform_fee_sek      -> platform_fee_amount
--   status                -> payment_status (enum)

ALTER TABLE public.payments
  -- 'card' | 'swish' | 'klarna' (frivilligt; null = ej satt ännu)
  ADD COLUMN IF NOT EXISTS payment_method text,
  -- Marketplace-payout till utföraren (Stripe Connect). TODO: implementera Connect.
  -- 'pending' | 'paid' | 'failed'
  ADD COLUMN IF NOT EXISTS payout_status text,
  -- Status på ev. återbetalning vid tvist. 'none' | 'requested' | 'refunded'
  ADD COLUMN IF NOT EXISTS refund_status text;

-- Begränsa till kända värden men tillåt NULL.
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('card', 'swish', 'klarna'));
