CREATE TABLE promotion_banners (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url   text NOT NULL,
  link_url    text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE promotion_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banners_select_authenticated" ON promotion_banners
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "banners_admin_all" ON promotion_banners
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = (select auth.uid())
    AND raw_user_meta_data->>'role' = 'admin'
  ));

CREATE INDEX idx_banners_active_order ON promotion_banners(is_active, sort_order) WHERE is_active = true;
