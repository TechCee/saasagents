-- Fix typo: user_profiles column is organisation_id (RLS depended on broken function)
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1
$$;
