-- Add instant_open to task_status enum
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'instant_open' AFTER 'published';