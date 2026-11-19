/*
# Ensure auth.instances has autoconfirm enabled

1. Purpose
- The earlier migration `20261114102056_disable_email_confirmation.sql.sql` tried to
  UPDATE auth.instances to set mailer.autoconfirm = true, but the table was empty
  on this Supabase version, so the UPDATE matched zero rows.
- Without this config, GoTrue defaults to email confirmation ON, which means:
  - signUp() returns no session (user must confirm email first)
  - signInWithPassword() fails with "Email not confirmed"
  - Users cannot create accounts or sign in.
- This migration ensures a row exists in auth.instances with autoconfirm enabled.

2. Changes
- Insert a default row into auth.instances with mailer.autoconfirm = true
  if no row exists yet.
- If a row already exists, update its raw_base_config to enable autoconfirm.

3. Security
- Only modifies auth configuration, no table/policy/grant changes.
- autoconfirm is intentionally ON per the app's auth design (no email confirmation flow).
*/

INSERT INTO auth.instances (id, uuid, raw_base_config, created_at, updated_at)
SELECT
  gen_random_uuid(),
  gen_random_uuid(),
  '{"mailer":{"autoconfirm":true},"auth":{"enable_signup":true}}',
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
