-- Profile-level services (what a tasker usually helps with)
CREATE TABLE public.tasker_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  price_sek integer,
  price_type text NOT NULL DEFAULT 'from' CHECK (price_type IN ('fixed','from')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tasker_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasker_services TO authenticated;
GRANT ALL ON public.tasker_services TO service_role;

ALTER TABLE public.tasker_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active tasker services"
  ON public.tasker_services FOR SELECT
  USING (is_active = true OR user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Tasker manages own services"
  ON public.tasker_services FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage tasker services"
  ON public.tasker_services FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER tasker_services_updated_at
  BEFORE UPDATE ON public.tasker_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tasker_services_user ON public.tasker_services(user_id);
CREATE INDEX idx_tasker_services_category ON public.tasker_services(category) WHERE is_active = true;

-- Public service listings (taskers offering help in the marketplace)
CREATE TABLE public.service_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tasker_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  city text,
  price_sek integer NOT NULL,
  price_type text NOT NULL DEFAULT 'from' CHECK (price_type IN ('fixed','from')),
  cover_image_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.service_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_listings TO authenticated;
GRANT ALL ON public.service_listings TO service_role;

ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active service listings"
  ON public.service_listings FOR SELECT
  USING (status = 'active' OR tasker_user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Tasker manages own listings"
  ON public.service_listings FOR ALL
  USING (tasker_user_id = auth.uid())
  WITH CHECK (tasker_user_id = auth.uid());

CREATE POLICY "Admin can manage service listings"
  ON public.service_listings FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER service_listings_updated_at
  BEFORE UPDATE ON public.service_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_service_listings_status ON public.service_listings(status, created_at DESC);
CREATE INDEX idx_service_listings_category ON public.service_listings(category) WHERE status = 'active';
CREATE INDEX idx_service_listings_city ON public.service_listings(city) WHERE status = 'active';
CREATE INDEX idx_service_listings_tasker ON public.service_listings(tasker_user_id);

-- Track which service a task was ordered from
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS source_service_listing_id uuid REFERENCES public.service_listings(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS source_tasker_service_id uuid REFERENCES public.tasker_services(id) ON DELETE SET NULL;
