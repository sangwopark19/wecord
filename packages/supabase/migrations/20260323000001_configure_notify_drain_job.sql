-- Enable required extensions for notification pipeline
-- pg_net: HTTP requests from postgres
-- pg_cron: scheduled job execution
-- pgmq: postgres message queue
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create notification queue (idempotent)
SELECT pgmq.create('notify_queue');

-- Store credentials in Supabase Vault (official recommended pattern)
-- See: https://supabase.com/docs/guides/functions/schedule-functions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'project_url') THEN
    PERFORM vault.create_secret(
      'https://pvhpchindstbzurgybni.supabase.co',
      'project_url'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'service_role_key') THEN
    PERFORM vault.create_secret(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2aHBjaGluZHN0Ynp1cmd5Ym5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwNzI3MCwiZXhwIjoyMDg5MzgzMjcwfQ.0_cyBFTn551tGq7nG3VxbHyqr0xyRKMJ8vGcrZi0l7A',
      'service_role_key'
    );
  END IF;
END;
$$;

-- Schedule drain job using Vault secrets (official pattern from Supabase docs)
SELECT cron.schedule(
  'drain-notify-queue',
  '5 seconds',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := msg.message,
      timeout_milliseconds := 5000
    ) as request_id
  from pgmq.read('notify_queue', 30, 10) as msg;
  $$
);

-- Clean up diagnostic table from previous migration attempt
DROP TABLE IF EXISTS _ext_check;
