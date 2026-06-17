
-- Add enum value for open_for_bids
ALTER TYPE public.budget_type ADD VALUE IF NOT EXISTS 'open_for_bids';

-- Add budget hint column
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS budget_hint_sek integer;

-- Bid status enum
DO $$ BEGIN
  CREATE TYPE public.bid_status AS ENUM ('pending','accepted','rejected','withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Dispute status enum
DO $$ BEGIN
  CREATE TYPE public.dispute_status AS ENUM ('open','under_review','resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- BIDS TABLE
CREATE TABLE IF NOT EXISTS public.bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL,
  price_sek integer NOT NULL CHECK (price_sek > 0),
  proposed_time timestamptz,
  proposed_time_text text,
  message text,
  status public.bid_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, bidder_id)
);

CREATE INDEX IF NOT EXISTS bids_task_id_idx ON public.bids(task_id);
CREATE INDEX IF NOT EXISTS bids_bidder_id_idx ON public.bids(bidder_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bids TO authenticated;
GRANT ALL ON public.bids TO service_role;

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bidders manage own bids"
ON public.bids FOR ALL TO authenticated
USING (bidder_id = auth.uid())
WITH CHECK (bidder_id = auth.uid());

CREATE POLICY "Task owner can view bids on their tasks"
ON public.bids FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = bids.task_id AND t.customer_user_id = auth.uid()));

CREATE POLICY "Task owner can update bid status"
ON public.bids FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = bids.task_id AND t.customer_user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = bids.task_id AND t.customer_user_id = auth.uid()));

CREATE POLICY "Admins manage all bids"
ON public.bids FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_bids_updated_at BEFORE UPDATE ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DISPUTES TABLE
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  thread_id uuid REFERENCES public.chat_threads(id) ON DELETE SET NULL,
  raised_by uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status public.dispute_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS disputes_task_id_idx ON public.disputes(task_id);

GRANT SELECT, INSERT, UPDATE ON public.disputes TO authenticated;
GRANT ALL ON public.disputes TO service_role;

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task parties view disputes"
ON public.disputes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = disputes.task_id
      AND (t.customer_user_id = auth.uid() OR t.assigned_tasker_id = auth.uid())
  )
);

CREATE POLICY "Task parties create disputes"
ON public.disputes FOR INSERT TO authenticated
WITH CHECK (
  raised_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = disputes.task_id
      AND (t.customer_user_id = auth.uid() OR t.assigned_tasker_id = auth.uid())
  )
);

CREATE POLICY "Admins manage disputes"
ON public.disputes FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_disputes_updated_at BEFORE UPDATE ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- accept_bid RPC
CREATE OR REPLACE FUNCTION public.accept_bid(p_bid_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_id uuid;
  v_bidder uuid;
  v_price integer;
  v_customer uuid;
  v_thread_id uuid;
BEGIN
  SELECT b.task_id, b.bidder_id, b.price_sek
    INTO v_task_id, v_bidder, v_price
  FROM public.bids b WHERE b.id = p_bid_id;

  IF v_task_id IS NULL THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;

  SELECT t.customer_user_id INTO v_customer FROM public.tasks t WHERE t.id = v_task_id;
  IF v_customer <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to accept bid';
  END IF;

  UPDATE public.bids SET status = 'accepted', updated_at = now() WHERE id = p_bid_id;
  UPDATE public.bids SET status = 'rejected', updated_at = now()
   WHERE task_id = v_task_id AND id <> p_bid_id AND status = 'pending';

  UPDATE public.tasks
    SET assigned_tasker_id = v_bidder,
        budget_min_sek = v_price,
        budget_max_sek = v_price,
        status = 'assigned',
        updated_at = now()
   WHERE id = v_task_id;

  -- Ensure chat thread exists
  SELECT id INTO v_thread_id FROM public.chat_threads
   WHERE task_id = v_task_id
     AND customer_user_id = v_customer
     AND tasker_user_id = v_bidder
   LIMIT 1;

  IF v_thread_id IS NULL THEN
    INSERT INTO public.chat_threads (task_id, customer_user_id, tasker_user_id)
    VALUES (v_task_id, v_customer, v_bidder)
    RETURNING id INTO v_thread_id;
  END IF;

  RETURN v_thread_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_bid(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_bid(uuid) TO authenticated;
