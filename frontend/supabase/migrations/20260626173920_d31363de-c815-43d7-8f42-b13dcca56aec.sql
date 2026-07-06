
REVOKE ALL ON FUNCTION public.sync_defaulter_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_defaulter_status() TO service_role;
