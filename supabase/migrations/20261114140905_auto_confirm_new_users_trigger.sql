/*
# Auto-confirm email for new users

1. Purpose
- The app uses email/password auth with NO email confirmation flow.
- Previous attempt to disable email confirmation via auth.instances failed because that table was empty on this Supabase version.
- This trigger sets email_confirmed_at = now() on every new auth.users insert, so signUp() returns a session immediately and signInWithPassword() works right away.

2. Changes
- Create a SECURITY DEFINER function `public.auto_confirm_email()` that sets `NEW.email_confirmed_at = now()`.
- Create a BEFORE INSERT trigger on `auth.users` that calls the function.

3. Security
- The function runs as SECURITY DEFINER (owner-level) so it can modify auth.users.
- It only sets email_confirmed_at; it does not touch any other column or table.
- No RLS/policy changes needed on auth schema tables.
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
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_confirm_email_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_email();