-- Create pgmq queue for notification events
SELECT pgmq.create('notify_queue');

-- pg_cron job: every minute, publish notices whose scheduled_at has passed
SELECT cron.schedule(
  'publish-scheduled-notices',
  '* * * * *',
  $$
  UPDATE notices
  SET published_at = NOW()
  WHERE scheduled_at <= NOW()
    AND published_at IS NULL
    AND scheduled_at IS NOT NULL;
  $$
);

-- Trigger function: when a notice transitions from unpublished to published, enqueue to pgmq
CREATE OR REPLACE FUNCTION trigger_notify_on_notice_publish()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.published_at IS NULL AND NEW.published_at IS NOT NULL THEN
    PERFORM pgmq.send(
      'notify_queue',
      jsonb_build_object(
        'event_type', 'notice',
        'community_id', NEW.community_id::text,
        'data', jsonb_build_object(
          'title', NEW.title,
          'body', LEFT(NEW.content, 100),
          'deep_link', jsonb_build_object('notice_id', NEW.id::text, 'community_id', NEW.community_id::text)
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notice_publish_trigger
  AFTER UPDATE ON notices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_on_notice_publish();

-- Trigger function: on INSERT when published_at is set immediately (non-scheduled notices)
CREATE OR REPLACE FUNCTION trigger_notify_on_notice_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.published_at IS NOT NULL THEN
    PERFORM pgmq.send(
      'notify_queue',
      jsonb_build_object(
        'event_type', 'notice',
        'community_id', NEW.community_id::text,
        'data', jsonb_build_object(
          'title', NEW.title,
          'body', LEFT(NEW.content, 100),
          'deep_link', jsonb_build_object('notice_id', NEW.id::text, 'community_id', NEW.community_id::text)
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notice_insert_trigger
  AFTER INSERT ON notices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_on_notice_insert();

-- pg_cron drain job: every 5 seconds, read from pgmq and invoke notify Edge Function
-- This is the async consumer that processes queued notification events.
-- DB triggers use pgmq.send() (non-blocking); this drain job does the actual HTTP fan-out.
SELECT cron.schedule(
  'drain-notify-queue',
  '5 seconds',
  $$
  DO $$
  DECLARE
    v_msg RECORD;
    v_functions_url TEXT;
    v_service_key TEXT;
  BEGIN
    v_functions_url := COALESCE(
      current_setting('app.supabase_functions_url', true),
      'http://localhost:54321/functions/v1'
    );
    v_service_key := COALESCE(
      current_setting('app.service_role_key', true),
      ''
    );

    -- Read up to 10 messages per drain cycle with 30s visibility timeout
    FOR v_msg IN SELECT * FROM pgmq.read('notify_queue', 30, 10) LOOP
      PERFORM net.http_post(
        url := v_functions_url || '/notify',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || v_service_key,
          'Content-Type', 'application/json'
        ),
        body := v_msg.message
      );
      -- Archive processed message (removes from active queue)
      PERFORM pgmq.archive('notify_queue', v_msg.msg_id);
    END LOOP;
  END;
  $$;
  $$
);
