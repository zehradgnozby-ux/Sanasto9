/*
# Consolidate auth auto-confirm setup (permanent fix for project import)

## Purpose
When this project is imported into a new Bolt instance, a fresh Supabase project
is provisioned and all migration files are replayed. Several earlier auth-related
migrations had a `.sql.sql` double extension and may not have been recognized by
the replay system, leaving the new database without proper auth configuration:

  - Email confirmation stayed ON (signUp returns no session)
  - The trigger only set email_confirmed_at but not confirmed_at
  - signInWithPassword() failed with "Email not confirmed"

This single migration consolidates all auth setup into one idempotent file with
the correct `.sql` extension so it is always replayed correctly.

## Changes

### 1. Auto-confirm trigger function
- Create or replace `public.auto_confirm_email()` as a SECURITY DEFINER trigger
  function that sets BOTH `email_confirmed_at` and `confirmed_at` to `now()` on
  every new `auth.users` row.
- This ensures signUp() returns a session immediately and signInWithPassword()
  works right away, regardless of the GoTrue autoconfirm config.

### 2. Auto-confirm trigger
- Drop and recreate the BEFORE INSERT trigger on `auth.users`.

### 3. GoTrue auth config
- Ensure `auth.instances` has `mailer.autoconfirm` set to `true` and
  `auth.enable_signup` set to `true`.
- If no row exists in `auth.instances`, insert one with the correct config.
- If a row exists, update its config to enable autoconfirm and signup.

### 4. Revoke direct function access
- Revoke EXECUTE on the trigger function from PUBLIC, anon, and authenticated
  so it can only be called by the database trigger, not by API clients.

## Security
- The trigger function is SECURITY DEFINER and only modifies confirmation
  timestamp columns on auth.users.
- EXECUTE is revoked from all roles; the function is only invoked by the trigger.
- No RLS or policy changes on application tables.
- autoconfirm is intentionally ON and signup is intentionally enabled.
*/

-- 1. Drop existing trigger and function (idempotent)
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_email() CASCADE;

-- 2. Create the trigger function that auto-confirms new users
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
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

-- 3. Create the BEFORE INSERT trigger on auth.users
CREATE TRIGGER auto_confirm_email_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_email();

-- 4. Ensure auth.instances has autoconfirm enabled and signup enabled
INSERT INTO auth.instances (id, uuid, raw_base_config, created_at, updated_at)
SELECT
  gen_random_uuid(),
  gen_random_uuid(),
  '{"auth":{"enable_signup":true},"mailer":{"autoconfirm":true}}',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM auth.instances);

UPDATE auth.instances
SET
  raw_base_config = jsonb_set(
    COALESCE(raw_base_config::jsonb, '{}'::jsonb),
    '{mailer,autoconfirm}',
    'true'
  )::text,
  updated_at = now()
WHERE EXISTS (SELECT 1 FROM auth.instances);

UPDATE auth.instances
SET
  raw_base_config = jsonb_set(
    COALESCE(raw_base_config::jsonb, '{}'::jsonb),
    '{auth,enable_signup}',
    'true'
  )::text,
  updated_at = now()
WHERE EXISTS (SELECT 1 FROM auth.instances);

-- 5. Revoke direct function access (only the trigger should call it)
REVOKE EXECUTE ON FUNCTION public.auto_confirm_email() FROM PUBLIC, anon, authenticated;
