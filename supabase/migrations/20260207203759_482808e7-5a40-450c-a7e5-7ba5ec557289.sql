-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_city ON public.tasks(city);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_customer_user_id ON public.tasks(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_tasker_id ON public.tasks(assigned_tasker_id);

CREATE INDEX IF NOT EXISTS idx_offers_task_id ON public.offers(task_id);
CREATE INDEX IF NOT EXISTS idx_offers_tasker_user_id ON public.offers(tasker_user_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);

CREATE INDEX IF NOT EXISTS idx_chat_threads_task_id ON public.chat_threads(task_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_customer_user_id ON public.chat_threads(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_tasker_user_id ON public.chat_threads(tasker_user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON public.chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_user_id ON public.chat_messages(sender_user_id);

CREATE INDEX IF NOT EXISTS idx_payments_task_id ON public.payments(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer_user_id ON public.payments(payer_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee_user_id ON public.payments(payee_user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_task_id ON public.reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_user_id ON public.reviews(reviewee_user_id);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_user_id ON public.reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

CREATE INDEX IF NOT EXISTS idx_tasker_profiles_user_id ON public.tasker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tasker_profiles_service_area_city ON public.tasker_profiles(service_area_city);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);