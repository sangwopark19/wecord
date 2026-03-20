-- Notification triggers using async pgmq fan-out
-- Per CONTEXT.md decision: all triggers use pgmq.send('notify_queue', ...)
-- which returns immediately (non-blocking). The drain job (from Plan 02 migration)
-- processes the queue and invokes the notify Edge Function.
-- This ensures post creation is NEVER blocked by notification delivery.

-- ===================================================================
-- Trigger for creator posts
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
-- Trigger for comments on posts (notify post author)
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
-- Trigger for likes on posts (notify post author)
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
