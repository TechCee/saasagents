-- Command Center v5.1 — consolidated schema (phases 1–12)
-- Enables: organisations, products, contacts/dedup, branding, suppressions, sequences, memories, channel intel, GDPR, spend tracking

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- ——— Helpers ———
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1
$$;

-- ——— Core tenant ———
CREATE TABLE IF NOT EXISTS public.organisations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  plan_tier   text NOT NULL DEFAULT 'starter' CHECK (plan_tier IN ('starter','growth','agency','enterprise')),
  settings    jsonb NOT NULL DEFAULT '{}'::jsonb,
  cancelled_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id       uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  stripe_customer_id    text,
  stripe_subscription_id text,
  status                text NOT NULL DEFAULT 'inactive',
  created_at            timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.org_spend_limits (
  organisation_id         uuid PRIMARY KEY REFERENCES public.organisations(id) ON DELETE CASCADE,
  daily_spend_limit_usd   numeric(12,4) NOT NULL DEFAULT 5,
  monthly_spend_limit_usd numeric(12,4) NOT NULL DEFAULT 100,
  agents_paused           boolean NOT NULL DEFAULT false,
  updated_at              timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  role             text NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin','admin','member','viewer')),
  display_name     text,
  email            text,
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_org ON public.user_profiles(organisation_id);

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_spend_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY orgs_select ON public.organisations FOR SELECT
  USING (id = public.current_org_id() OR EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role = 'super_admin'
  ));

CREATE POLICY subs_org ON public.subscriptions FOR ALL
  USING (organisation_id = public.current_org_id());

CREATE POLICY spend_org ON public.org_spend_limits FOR ALL
  USING (organisation_id = public.current_org_id());

CREATE POLICY profiles_self ON public.user_profiles FOR SELECT USING (id = auth.uid() OR organisation_id = public.current_org_id());
CREATE POLICY profiles_update_self ON public.user_profiles FOR UPDATE USING (id = auth.uid());

-- ——— Products & branding ———
CREATE TABLE IF NOT EXISTS public.products (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id    uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name               text NOT NULL,
  slug               text NOT NULL,
  outbound_sender_email text,
  daily_send_limit   integer NOT NULL DEFAULT 20,
  warming_start_date date,
  created_at         timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, slug)
);

CREATE TABLE IF NOT EXISTS public.product_branding (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id     uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  product_id          uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
  primary_color       text NOT NULL DEFAULT '#1E3A5F',
  secondary_color     text NOT NULL DEFAULT '#0099BB',
  background_color    text NOT NULL DEFAULT '#F8FAFC',
  text_color          text NOT NULL DEFAULT '#1E293B',
  header_logo_url     text,
  header_logo_width   integer NOT NULL DEFAULT 160,
  font_family         text NOT NULL DEFAULT 'Arial, Helvetica, sans-serif',
  button_style        text NOT NULL DEFAULT 'rounded'
    CHECK (button_style IN ('rounded','square','pill')),
  footer_company_name text,
  footer_address      text,
  footer_links_json   jsonb NOT NULL DEFAULT '[]'::jsonb,
  social_links_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  email_signature     text,
  preview_text_prefix text,
  channel_scout_auto_lead_threshold numeric(5,2),
  channel_scout_auto_lead_enabled    boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT NOW(),
  updated_at          timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_product_branding_updated
  BEFORE UPDATE ON public.product_branding
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.contacts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  email            text NOT NULL,
  first_name       text,
  last_name        text,
  company          text,
  job_title        text,
  external_contact_ref  text,
  opted_out        boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, email)
);

CREATE INDEX IF NOT EXISTS idx_contacts_org_email ON public.contacts(organisation_id, lower(email));

CREATE TABLE IF NOT EXISTS public.leads (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  contact_id       uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  email            text NOT NULL,
  first_name       text,
  last_name        text,
  company          text,
  job_title        text,
  status           text NOT NULL DEFAULT 'new' CHECK (status IN (
    'new','contacted','replied','opted_out','invalid','qualified','lost','erased'
  )),
  score            integer,
  external_lead_ref     text,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_product ON public.leads(product_id);
CREATE INDEX IF NOT EXISTS idx_leads_org_email ON public.leads(organisation_id, lower(email));

CREATE TABLE IF NOT EXISTS public.email_suppressions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  email            text NOT NULL,
  reason           text NOT NULL CHECK (reason IN (
    'hard_bounce','soft_bounce','unsubscribed',
    'spam_complaint','manual','gdpr_erasure'
  )),
  suppressed_at    timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, email)
);

CREATE INDEX IF NOT EXISTS idx_suppressions_org ON public.email_suppressions(organisation_id);
CREATE INDEX IF NOT EXISTS idx_suppressions_email ON public.email_suppressions(lower(email));

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  product_id        uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  subject           text NOT NULL DEFAULT '',
  preview_text      text NOT NULL DEFAULT '',
  body_html         text,
  body_structured   jsonb,
  status            text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','pending_approval','scheduled','sending','sent','rejected','revision_requested'
  )),
  from_address      text,
  scheduled_send_at timestamptz,
  revision_note     text,
  recipient_lead_ids uuid[] DEFAULT '{}',
  ab_variant        text,
  created_at        timestamptz NOT NULL DEFAULT NOW(),
  updated_at        timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_email_campaigns_updated
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.email_sequences (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  campaign_id      uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  name             text NOT NULL,
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  sequence_id       uuid NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  step_order        integer NOT NULL,
  delay_hours       integer NOT NULL DEFAULT 48,
  tone_notes        text,
  created_at        timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_sequence_enrolments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  sequence_id      uuid NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  lead_id          uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  current_step     integer NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'active' CHECK (status IN (
    'active','completed','paused','unsubscribed','replied','bounced'
  )),
  next_send_at     timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title            text NOT NULL,
  slug             text NOT NULL,
  body_md          text,
  status           text NOT NULL DEFAULT 'draft',
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, slug)
);

CREATE TABLE IF NOT EXISTS public.agent_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  product_id        uuid REFERENCES public.products(id) ON DELETE SET NULL,
  agent_type        text NOT NULL,
  status            text NOT NULL DEFAULT 'success' CHECK (status IN ('success','error','skipped')),
  payload           jsonb,
  error_message     text,
  input_tokens      integer DEFAULT 0,
  output_tokens     integer DEFAULT 0,
  estimated_cost_usd numeric(10,6) DEFAULT 0,
  consecutive_errors integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_org_time ON public.agent_logs(organisation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_standups (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  agent_type       text NOT NULL,
  plan_text        text,
  actual_text      text,
  standup_date     date NOT NULL DEFAULT (timezone('utc', now()))::date,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, agent_type, standup_date)
);

CREATE TABLE IF NOT EXISTS public.agent_schedules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  product_id       uuid REFERENCES public.products(id) ON DELETE CASCADE,
  agent_type       text NOT NULL,
  cron_expr        text NOT NULL,
  next_run_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.seo_reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  report_week      date NOT NULL,
  summary          jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.seo_recommendations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title            text NOT NULL,
  detail           text,
  status           text NOT NULL DEFAULT 'open',
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.seo_backlink_targets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  domain           text NOT NULL,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_agents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name             text NOT NULL,
  config           jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_outputs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  custom_agent_id  uuid NOT NULL REFERENCES public.custom_agents(id) ON DELETE CASCADE,
  output           jsonb NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agent_memories (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  product_id       uuid REFERENCES public.products(id) ON DELETE SET NULL,
  agent_type       text NOT NULL,
  source           text NOT NULL,
  content          text NOT NULL,
  importance       integer NOT NULL DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  embedding        vector(1536),
  metadata         jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_memories_org ON public.agent_memories(organisation_id);

CREATE TABLE IF NOT EXISTS public.memory_feedback (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  memory_id        uuid REFERENCES public.agent_memories(id) ON DELETE SET NULL,
  decision         text NOT NULL,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.channel_intelligence (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  channel          text NOT NULL,
  external_id      text,
  username         text,
  title            text,
  excerpt          text,
  url              text,
  relevance_score  numeric(6,2),
  category         text,
  raw              jsonb,
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_intel_product ON public.channel_intelligence(product_id);

CREATE TABLE IF NOT EXISTS public.gdpr_erasure_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  email_hash       text NOT NULL,
  requested_by     uuid REFERENCES auth.users(id),
  erased_at        timestamptz NOT NULL DEFAULT NOW()
);

-- Optional: inbound events from email provider or legacy external systems (not required for internal CRM)
CREATE TABLE IF NOT EXISTS public.external_sync_webhook_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
  event_type       text,
  payload          jsonb NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.super_admin_audit_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id    uuid NOT NULL REFERENCES auth.users(id),
  target_org_id    uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
  started_at       timestamptz NOT NULL DEFAULT NOW(),
  ended_at         timestamptz,
  actions          jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- ——— Product count vs plan (trigger) ———
CREATE OR REPLACE FUNCTION public.enforce_product_plan_limit()
RETURNS TRIGGER AS $$
DECLARE
  cnt integer;
  lim integer;
  tier text;
BEGIN
  SELECT plan_tier INTO tier FROM public.organisations WHERE id = NEW.organisation_id;
  lim := CASE tier
    WHEN 'starter' THEN 2
    WHEN 'growth' THEN 10
    WHEN 'agency' THEN 50
    ELSE 9999
  END;
  SELECT count(*) INTO cnt FROM public.products WHERE organisation_id = NEW.organisation_id;
  IF cnt >= lim THEN
    RAISE EXCEPTION 'Product limit exceeded for plan %', tier;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_plan ON public.products;
CREATE TRIGGER trg_products_plan
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_product_plan_limit();

-- ——— RLS: org-scoped tables ———
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_org ON public.products FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.product_branding ENABLE ROW LEVEL SECURITY;
CREATE POLICY branding_org ON public.product_branding FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacts_org ON public.contacts FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_org ON public.leads FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY suppressions_org ON public.email_suppressions FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY campaigns_org ON public.email_campaigns FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY seq_org ON public.email_sequences FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY seqsteps_org ON public.email_sequence_steps FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.email_sequence_enrolments ENABLE ROW LEVEL SECURITY;
CREATE POLICY enrol_org ON public.email_sequence_enrolments FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY blog_org ON public.blog_posts FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY agentlogs_org ON public.agent_logs FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.agent_standups ENABLE ROW LEVEL SECURITY;
CREATE POLICY standups_org ON public.agent_standups FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.agent_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY schedules_org ON public.agent_schedules FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.seo_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY seorep_org ON public.seo_reports FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.seo_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY seorec_org ON public.seo_recommendations FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.seo_backlink_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY backlinks_org ON public.seo_backlink_targets FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.custom_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY cagents_org ON public.custom_agents FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.custom_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY cout_org ON public.custom_outputs FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY memories_org ON public.agent_memories FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.memory_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY memfeed_org ON public.memory_feedback FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.channel_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY intel_org ON public.channel_intelligence FOR ALL USING (organisation_id = public.current_org_id());

ALTER TABLE public.gdpr_erasure_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY gdpr_org ON public.gdpr_erasure_log FOR ALL USING (organisation_id = public.current_org_id());

-- ——— Operational views ———
CREATE OR REPLACE VIEW public.follow_ups_due AS
SELECT *
FROM public.email_sequence_enrolments
WHERE status = 'active'
  AND next_send_at IS NOT NULL
  AND next_send_at <= NOW();
