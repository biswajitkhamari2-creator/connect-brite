
CREATE OR REPLACE FUNCTION public.get_appreciation_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT appreciation_enabled FROM public.rewards_config LIMIT 1), false);
$$;

REVOKE ALL ON FUNCTION public.get_appreciation_enabled() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_appreciation_enabled() TO anon, authenticated;
