REVOKE EXECUTE ON FUNCTION public.apply_referral_code(TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.apply_referral_code(TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, public;