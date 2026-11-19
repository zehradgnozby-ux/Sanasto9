/*
# Disable email confirmation for signup

1. Purpose
- Ensure new users can sign up and immediately log in without email confirmation.
- The app uses email/password auth with no email confirmation flow.

2. Changes
- Update auth config to disable email confirmations.
- This makes signUp() return a session immediately.

3. Security
- No table, policy, or grant changes.
- Email confirmation is intentionally OFF per the app's auth design.
*/

UPDATE auth.instances
SET raw_base_config = jsonb_set(
  raw_base_config::jsonb,
  '{mailer,autoconfirm}',
  'true'
)::text
WHERE true;
