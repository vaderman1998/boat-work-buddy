REVOKE ALL ON FUNCTION public.is_demo_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_demo_user() TO authenticated, service_role;