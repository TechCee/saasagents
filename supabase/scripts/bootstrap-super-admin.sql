-- Bootstrap a Super Admin for Command Center (runs in Supabase SQL Editor as postgres / service role).
--
-- What it does:
-- 1. Ensures auth user exists for the email (bcrypt password + email provider identity).
-- 2. Ensures a dedicated org (slug: platform-super-admin, plan: enterprise) for current_org_id().
-- 3. Upserts public.user_profiles with role super_admin (sees all orgs per RLS).
--
-- Security: this file contains a plaintext password for convenience. Run once, then rotate the
-- password in Dashboard (Authentication → Users) and delete or scrub this script if the repo is shared.
--
-- Requires: extension pgcrypto (already enabled in migrations).
--
-- Auth note: GoTrue expects several auth.users token columns to be '' (empty string), not NULL.
-- If they are NULL, sign-in returns "Database error querying schema". We set them on insert/update.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $bootstrap$
DECLARE
  v_email            text := lower(trim('newsbreakdown@gmail.com'));
  v_password         text := 'Jiggaman587!';
  v_display_name     text := 'Platform Super Admin';
  v_org_name         text := 'Platform (Super Admin)';
  v_org_slug         text := 'platform-super-admin';
  v_user_id          uuid;
  v_org_id           uuid;
  v_encrypted_pw     text;
  v_identity_id      uuid;
BEGIN
  IF v_email = '' OR position('@' IN v_email) < 2 THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF length(v_password) < 6 THEN
    RAISE EXCEPTION 'Password too short';
  END IF;

  v_encrypted_pw := crypt(v_password, gen_salt('bf'));

  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change,
      email_change_token_new,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_email,
      v_encrypted_pw,
      now(),
      '',
      '',
      '',
      '',
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      '{}'::jsonb,
      now(),
      now()
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = v_encrypted_pw,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      confirmation_token = coalesce(confirmation_token, ''),
      recovery_token = coalesce(recovery_token, ''),
      email_change = coalesce(email_change, ''),
      email_change_token_new = coalesce(email_change_token_new, ''),
      raw_app_meta_data = coalesce(
        raw_app_meta_data,
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'))
      ),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities
    WHERE user_id = v_user_id AND provider = 'email'
  ) THEN
    v_identity_id := gen_random_uuid();
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_identity_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email',
      v_email,
      now(),
      now(),
      now()
    );
  END IF;

  SELECT id INTO v_org_id FROM public.organisations WHERE slug = v_org_slug LIMIT 1;
  IF v_org_id IS NULL THEN
    INSERT INTO public.organisations (name, slug, plan_tier)
    VALUES (v_org_name, v_org_slug, 'enterprise')
    RETURNING id INTO v_org_id;
  END IF;

  INSERT INTO public.org_spend_limits (organisation_id, daily_spend_limit_usd, monthly_spend_limit_usd)
  VALUES (v_org_id, 10000, 100000)
  ON CONFLICT (organisation_id) DO UPDATE SET
    daily_spend_limit_usd   = excluded.daily_spend_limit_usd,
    monthly_spend_limit_usd = excluded.monthly_spend_limit_usd,
    updated_at              = now();

  INSERT INTO public.user_profiles (id, organisation_id, role, display_name, email)
  VALUES (v_user_id, v_org_id, 'super_admin', v_display_name, v_email)
  ON CONFLICT (id) DO UPDATE SET
    organisation_id = excluded.organisation_id,
    role            = 'super_admin',
    display_name    = excluded.display_name,
    email           = excluded.email;

  RAISE NOTICE 'Super Admin ready: user_id=%, org_id=%, email=%', v_user_id, v_org_id, v_email;
END
$bootstrap$;
