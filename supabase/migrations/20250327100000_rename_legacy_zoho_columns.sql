-- If an older copy of the schema used Zoho-specific names, rename to internal-CRM-neutral names.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'zoho_sending_email'
  ) THEN
    ALTER TABLE public.products RENAME COLUMN zoho_sending_email TO outbound_sender_email;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'zoho_contact_id'
  ) THEN
    ALTER TABLE public.contacts RENAME COLUMN zoho_contact_id TO external_contact_ref;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'zoho_lead_id'
  ) THEN
    ALTER TABLE public.leads RENAME COLUMN zoho_lead_id TO external_lead_ref;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'zoho_webhook_log'
  ) THEN
    ALTER TABLE public.zoho_webhook_log RENAME TO external_sync_webhook_log;
  END IF;
END $$;
