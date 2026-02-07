-- Create function to check if tasker can instant accept
CREATE OR REPLACE FUNCTION public.tasker_can_instant_accept(
  p_task_id uuid,
  p_tasker_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM tasks t
    JOIN tasker_profiles tp ON tp.user_id = p_tasker_user_id
    WHERE t.id = p_task_id
      AND t.status = 'instant_open'
      AND t.auto_accept_price_sek IS NOT NULL
      AND (
        tp.service_area_city IS NULL 
        OR tp.service_area_city = t.city
      )
  ) INTO v_result;
  RETURN v_result;
END;
$$;