-- member_post notification trigger
-- Closes NOTF-05 gap: the notify Edge Function already handles member_post events
-- with follower filtering via community_follows table, but no trigger was emitting
-- member_post events to the pgmq queue. This migration adds that missing trigger.
--
-- CRITICAL: member_user_id must be set in the payload — the notify Edge Function
-- uses this field to filter push notification recipients to only followers of the
-- specific member who posted (via community_follows table).

CREATE OR REPLACE FUNCTION trigger_notify_on_member_post()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.author_role = 'member' THEN
    PERFORM pgmq.send(
      'notify_queue',
      jsonb_build_object(
        'event_type', 'member_post',
        'community_id', NEW.community_id::text,
        'data', jsonb_build_object(
          'title', 'New member post',
          'body', LEFT(NEW.content, 100),
          'actor_id', NEW.user_id::text,
          'member_user_id', NEW.user_id::text,
          'deep_link', jsonb_build_object(
            'post_id', NEW.id::text,
            'community_id', NEW.community_id::text
          )
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER posts_member_notify_trigger
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_on_member_post();
