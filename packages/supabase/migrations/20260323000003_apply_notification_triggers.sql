-- Apply all notification triggers that were missing from production
-- These were in migrations 20260320200000, 20260320300000, 20260321000000
-- but those were marked as applied without actually running.
-- This migration extracts only the trigger functions and triggers (no extensions/queue/cron).

-- Also schedule the notice publisher cron job
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

-- ===================================================================
-- Notice triggers (from 20260320200000)
-- ===================================================================
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

-- ===================================================================
-- Creator post trigger (from 20260320300000)
-- ===================================================================
CREATE OR REPLACE FUNCTION trigger_notify_on_creator_post()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.author_role = 'creator' THEN
    PERFORM pgmq.send(
      'notify_queue',
      jsonb_build_object(
        'event_type', 'creator_post',
        'community_id', NEW.community_id::text,
        'data', jsonb_build_object(
          'title', 'New creator post',
          'body', LEFT(NEW.content, 100),
          'actor_id', NEW.user_id::text,
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

CREATE TRIGGER posts_creator_notify_trigger
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_on_creator_post();

-- ===================================================================
-- Comment trigger (from 20260320300000)
-- ===================================================================
CREATE OR REPLACE FUNCTION trigger_notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id uuid;
  v_post_community_id uuid;
BEGIN
  SELECT user_id, community_id INTO v_post_author_id, v_post_community_id
  FROM posts WHERE id = NEW.post_id;

  IF v_post_author_id IS NOT NULL AND v_post_author_id != NEW.user_id THEN
    PERFORM pgmq.send(
      'notify_queue',
      jsonb_build_object(
        'event_type', 'comment',
        'community_id', v_post_community_id::text,
        'data', jsonb_build_object(
          'title', 'New comment',
          'body', LEFT(NEW.content, 100),
          'actor_id', NEW.user_id::text,
          'deep_link', jsonb_build_object(
            'post_id', NEW.post_id::text,
            'community_id', v_post_community_id::text
          )
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER comments_notify_trigger
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_on_comment();

-- ===================================================================
-- Like trigger (from 20260320300000)
-- ===================================================================
CREATE OR REPLACE FUNCTION trigger_notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id uuid;
  v_post_community_id uuid;
BEGIN
  IF NEW.target_type = 'post' THEN
    SELECT user_id, community_id INTO v_post_author_id, v_post_community_id
    FROM posts WHERE id = NEW.target_id;

    IF v_post_author_id IS NOT NULL AND v_post_author_id != NEW.user_id THEN
      PERFORM pgmq.send(
        'notify_queue',
        jsonb_build_object(
          'event_type', 'like',
          'community_id', v_post_community_id::text,
          'data', jsonb_build_object(
            'title', 'Post liked',
            'body', '',
            'actor_id', NEW.user_id::text,
            'deep_link', jsonb_build_object(
              'post_id', NEW.target_id::text,
              'community_id', v_post_community_id::text
            )
          )
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER likes_notify_trigger
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_on_like();

-- ===================================================================
-- Member post trigger (from 20260321000000)
-- ===================================================================
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

-- Clean up diagnostic table
DROP TABLE IF EXISTS _trigger_check;
