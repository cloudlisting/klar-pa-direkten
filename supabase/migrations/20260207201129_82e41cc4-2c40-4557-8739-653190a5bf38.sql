-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer', 'tasker');

-- Create task_status enum
CREATE TYPE public.task_status AS ENUM (
  'draft', 'published', 'in_bidding', 'assigned', 'in_progress', 
  'completed_pending_release', 'paid', 'cancelled', 'disputed'
);

-- Create budget_type enum
CREATE TYPE public.budget_type AS ENUM ('fixed', 'hourly');

-- Create offer_status enum
CREATE TYPE public.offer_status AS ENUM ('sent', 'withdrawn', 'accepted', 'rejected');

-- Create payment_status enum
CREATE TYPE public.payment_status AS ENUM (
  'not_started', 'authorized', 'held_in_escrow', 'released', 'refunded', 'failed'
);

-- Create verification_status enum
CREATE TYPE public.verification_status AS ENUM ('none', 'pending', 'verified');

-- Create report_status enum
CREATE TYPE public.report_status AS ENUM ('open', 'reviewing', 'closed');

-- Create report_target_type enum
CREATE TYPE public.report_target_type AS ENUM ('user', 'task', 'message');

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_deactivated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- USER_ROLES TABLE (for admin role)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- =============================================
-- TASKER_PROFILES TABLE
-- =============================================
CREATE TABLE public.tasker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  service_area_city TEXT,
  service_radius_km INTEGER DEFAULT 10,
  hourly_rate_sek INTEGER,
  verification_status verification_status NOT NULL DEFAULT 'none',
  avg_rating NUMERIC(2,1) DEFAULT 0,
  completed_tasks_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TASKS TABLE
-- =============================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  address_optional TEXT,
  is_remote_possible BOOLEAN DEFAULT false,
  budget_type budget_type NOT NULL DEFAULT 'fixed',
  budget_min_sek INTEGER,
  budget_max_sek INTEGER,
  preferred_date DATE,
  preferred_time TIME,
  status task_status NOT NULL DEFAULT 'draft',
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  assigned_tasker_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for tasks
CREATE INDEX idx_tasks_city ON public.tasks(city);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_customer ON public.tasks(customer_user_id);
CREATE INDEX idx_tasks_category ON public.tasks(category);

-- =============================================
-- TASK_PHOTOS TABLE
-- =============================================
CREATE TABLE public.task_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_photos_task ON public.task_photos(task_id);

-- =============================================
-- OFFERS TABLE
-- =============================================
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  tasker_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  price_sek INTEGER NOT NULL,
  message TEXT,
  availability_text TEXT,
  estimated_duration TEXT,
  status offer_status NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, tasker_user_id)
);

CREATE INDEX idx_offers_task ON public.offers(task_id);
CREATE INDEX idx_offers_tasker ON public.offers(tasker_user_id);

-- =============================================
-- CHAT_THREADS TABLE
-- =============================================
CREATE TABLE public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tasker_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, customer_user_id, tasker_user_id)
);

CREATE INDEX idx_chat_threads_task ON public.chat_threads(task_id);

-- =============================================
-- CHAT_MESSAGES TABLE
-- =============================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE NOT NULL,
  sender_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_chat_messages_thread ON public.chat_messages(thread_id);

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  payer_user_id UUID REFERENCES auth.users(id) NOT NULL,
  payee_user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount_sek INTEGER NOT NULL,
  platform_fee_sek INTEGER NOT NULL DEFAULT 0,
  status payment_status NOT NULL DEFAULT 'not_started',
  provider TEXT DEFAULT 'stripe',
  provider_reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_task ON public.payments(task_id);

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  reviewer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewee_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, reviewer_user_id)
);

CREATE INDEX idx_reviews_reviewee ON public.reviews(reviewee_user_id);

-- =============================================
-- REPORTS TABLE
-- =============================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_type report_target_type NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status report_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_reporter ON public.reports(reporter_user_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
$$;

-- Check if user has tasker profile
CREATE OR REPLACE FUNCTION public.is_tasker(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasker_profiles
    WHERE user_id = check_user_id
  );
$$;

-- Check if user can view a task
CREATE OR REPLACE FUNCTION public.can_view_task(check_task_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = check_task_id
    AND (
      t.customer_user_id = auth.uid() -- Owner
      OR public.is_admin(auth.uid()) -- Admin
      OR (t.status != 'draft' AND t.is_hidden = false) -- Published and not hidden
    )
  );
$$;

-- Check if user can access an offer
CREATE OR REPLACE FUNCTION public.can_access_offer(check_offer_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.offers o
    JOIN public.tasks t ON t.id = o.task_id
    WHERE o.id = check_offer_id
    AND (
      o.tasker_user_id = auth.uid() -- Offer owner
      OR t.customer_user_id = auth.uid() -- Task owner
      OR public.is_admin(auth.uid()) -- Admin
    )
  );
$$;

-- Check if user can access a chat thread
CREATE OR REPLACE FUNCTION public.can_access_thread(check_thread_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_threads ct
    WHERE ct.id = check_thread_id
    AND (
      ct.customer_user_id = auth.uid()
      OR ct.tasker_user_id = auth.uid()
      OR public.is_admin(auth.uid())
    )
  );
$$;

-- Check if user can access a payment
CREATE OR REPLACE FUNCTION public.can_access_payment(check_payment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.id = check_payment_id
    AND (
      p.payer_user_id = auth.uid()
      OR p.payee_user_id = auth.uid()
      OR public.is_admin(auth.uid())
    )
  );
$$;

-- =============================================
-- AUTO-UPDATE TIMESTAMPS TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasker_profiles_updated_at
  BEFORE UPDATE ON public.tasker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - PROFILES
-- =============================================
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- =============================================
-- RLS POLICIES - USER_ROLES
-- =============================================
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES - TASKER_PROFILES
-- =============================================
CREATE POLICY "Tasker profiles are viewable by authenticated users" ON public.tasker_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own tasker profile" ON public.tasker_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasker profile" ON public.tasker_profiles
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES - TASKS
-- =============================================
CREATE POLICY "Anyone can view published tasks" ON public.tasks
  FOR SELECT USING (public.can_view_task(id));

CREATE POLICY "Customers can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (customer_user_id = auth.uid());

CREATE POLICY "Customers can update own tasks" ON public.tasks
  FOR UPDATE USING (customer_user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Customers can delete draft tasks" ON public.tasks
  FOR DELETE USING (customer_user_id = auth.uid() AND status = 'draft');

-- =============================================
-- RLS POLICIES - TASK_PHOTOS
-- =============================================
CREATE POLICY "Photos viewable if task is viewable" ON public.task_photos
  FOR SELECT USING (public.can_view_task(task_id));

CREATE POLICY "Task owner can manage photos" ON public.task_photos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND customer_user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

-- =============================================
-- RLS POLICIES - OFFERS
-- =============================================
CREATE POLICY "Offer access based on role" ON public.offers
  FOR SELECT USING (public.can_access_offer(id));

CREATE POLICY "Taskers can create offers" ON public.offers
  FOR INSERT WITH CHECK (
    tasker_user_id = auth.uid() 
    AND public.is_tasker(auth.uid())
  );

CREATE POLICY "Taskers can update own offers" ON public.offers
  FOR UPDATE USING (
    tasker_user_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND customer_user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Taskers can withdraw own offers" ON public.offers
  FOR DELETE USING (tasker_user_id = auth.uid());

-- =============================================
-- RLS POLICIES - CHAT_THREADS
-- =============================================
CREATE POLICY "Participants can access threads" ON public.chat_threads
  FOR SELECT USING (public.can_access_thread(id));

CREATE POLICY "Participants can create threads" ON public.chat_threads
  FOR INSERT WITH CHECK (
    customer_user_id = auth.uid() OR tasker_user_id = auth.uid()
  );

-- =============================================
-- RLS POLICIES - CHAT_MESSAGES
-- =============================================
CREATE POLICY "Thread participants can read messages" ON public.chat_messages
  FOR SELECT USING (public.can_access_thread(thread_id));

CREATE POLICY "Thread participants can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_user_id = auth.uid() 
    AND public.can_access_thread(thread_id)
  );

CREATE POLICY "Sender can update own messages" ON public.chat_messages
  FOR UPDATE USING (sender_user_id = auth.uid());

-- =============================================
-- RLS POLICIES - PAYMENTS
-- =============================================
CREATE POLICY "Payment participants can view" ON public.payments
  FOR SELECT USING (public.can_access_payment(id));

CREATE POLICY "System can create payments" ON public.payments
  FOR INSERT WITH CHECK (payer_user_id = auth.uid());

CREATE POLICY "Admins can update payments" ON public.payments
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES - REVIEWS
-- =============================================
CREATE POLICY "Reviews are public" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Task participants can create review" ON public.reviews
  FOR INSERT WITH CHECK (
    reviewer_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
      AND t.status = 'paid'
      AND (t.customer_user_id = auth.uid() OR t.assigned_tasker_id = auth.uid())
    )
  );

-- Reviews cannot be updated or deleted
CREATE POLICY "Reviews are immutable" ON public.reviews
  FOR UPDATE USING (false);

CREATE POLICY "Reviews cannot be deleted" ON public.reviews
  FOR DELETE USING (false);

-- =============================================
-- RLS POLICIES - REPORTS
-- =============================================
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (reporter_user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (reporter_user_id = auth.uid());

CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- =============================================
-- ENABLE REALTIME FOR CHAT
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;