/*
# Fix auto-confirm trigger to also set confirmed_at

1. Purpose
- The previous trigger only set `email_confirmed_at` but not `confirmed_at`.
- GoTrue's signInWithPassword checks `confirmed_at` (not just `email_confirmed_at`)
  when autoconfirm is OFF in auth.instances config.
- Since auth.instances is empty on this Supabase version, autoconfirm defaults to OFF,
  so signUp() returns no session and signInWithPassword() fails with "Email not confirmed".
- This updated trigger sets BOTH `email_confirmed_at` and `confirmed_at` so that
  new users are fully confirmed at signup time and can sign in immediately.

2. Changes
- Replace `public.auto_confirm_email()` function to also set `NEW.confirmed_at = now()`.
- The existing trigger `auto_confirm_email_trigger` automatically uses the updated function.

3. Security
- SECURITY DEFINER function, only modifies confirmation timestamp columns.
- No RLS/policy changes.
- No new grants needed (trigger runs as table owner).
*/

DROP FUNCTION IF EXISTS public.auto_confirm_email() CASCADE;
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;

CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := now();
  END IF;
  IF NEW.confirmed_at IS NULL THEN
    NEW.confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_confirm_email_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_email();
