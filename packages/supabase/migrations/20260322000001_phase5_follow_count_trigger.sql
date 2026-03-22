-- Auto-update community_members.follower_count and following_count on community_follows changes
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_members SET following_count = following_count + 1 WHERE id = NEW.follower_cm_id;
    UPDATE community_members SET follower_count = follower_count + 1 WHERE id = NEW.following_cm_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_members SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_cm_id;
    UPDATE community_members SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_cm_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_follow_counts
AFTER INSERT OR DELETE ON community_follows
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();
