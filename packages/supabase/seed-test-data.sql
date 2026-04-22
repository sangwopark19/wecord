-- ============================================================
-- Phase 3 UAT Test Data
-- Run in Supabase SQL Editor (runs as postgres, bypasses RLS)
-- ============================================================

-- Your user ID
DO $$
DECLARE
  my_uid UUID := '0d535925-fd2f-4b98-8b16-1e182fe07bfb';

  -- Community IDs
  c_bts UUID := gen_random_uuid();
  c_ive UUID := gen_random_uuid();
  c_novel UUID := gen_random_uuid();

  -- Fake user IDs (not real auth users, just for content)
  fan1 UUID := gen_random_uuid();
  fan2 UUID := gen_random_uuid();
  creator1 UUID := gen_random_uuid();
  creator2 UUID := gen_random_uuid();

  -- Community member IDs
  cm_me_bts UUID := gen_random_uuid();
  cm_fan1_bts UUID := gen_random_uuid();
  cm_fan2_bts UUID := gen_random_uuid();
  cm_creator1_bts UUID := gen_random_uuid();
  cm_creator2_bts UUID := gen_random_uuid();
  cm_me_ive UUID := gen_random_uuid();

  -- Artist member IDs
  am1 UUID := gen_random_uuid();
  am2 UUID := gen_random_uuid();
  am3 UUID := gen_random_uuid();

  -- Post IDs
  p1 UUID := gen_random_uuid();
  p2 UUID := gen_random_uuid();
  p3 UUID := gen_random_uuid();
  p4 UUID := gen_random_uuid();
  p5 UUID := gen_random_uuid();
  p6 UUID := gen_random_uuid();
  p7 UUID := gen_random_uuid();
  p8 UUID := gen_random_uuid();

  -- Comment IDs
  cmt1 UUID := gen_random_uuid();
  cmt2 UUID := gen_random_uuid();
  cmt3 UUID := gen_random_uuid();
  cmt4 UUID := gen_random_uuid();

BEGIN

-- ========== COMMUNITIES ==========
INSERT INTO communities (id, slug, name, description, cover_image_url, type, category, member_count)
VALUES
  (c_bts, 'bts-army', 'BTS ARMY', 'BTS 글로벌 팬 커뮤니티. 방탄소년단의 모든 것을 공유해요!', NULL, 'group', 'bl', 4),
  (c_ive, 'ive-dive', 'IVE DIVE', 'IVE 공식 팬 커뮤니티', NULL, 'group', 'gl', 1),
  (c_novel, 'romance-readers', '로맨스 소설 동호회', '로맨스 소설 리뷰와 추천을 나누는 공간', NULL, 'solo', 'novel', 0)
ON CONFLICT (slug) DO NOTHING;

-- ========== FAKE PROFILES (for fake users to satisfy FK) ==========
INSERT INTO profiles (user_id, global_nickname, language, onboarding_completed)
VALUES
  (fan1, 'FanUser1', 'ko', true),
  (fan2, 'FanUser2', 'en', true),
  (creator1, 'CreatorRM', 'ko', true),
  (creator2, 'CreatorJK', 'ko', true)
ON CONFLICT (user_id) DO NOTHING;

-- ========== ARTIST MEMBERS (BTS group) ==========
INSERT INTO artist_members (id, community_id, user_id, display_name, profile_image_url, position, sort_order)
VALUES
  (am1, c_bts, creator1, 'RM', NULL, '리더 / 래퍼', 1),
  (am2, c_bts, creator2, '정국', NULL, '보컬 / 막내', 2),
  (am3, c_bts, NULL, '뷔', NULL, '보컬', 3)
ON CONFLICT DO NOTHING;

-- ========== COMMUNITY MEMBERS ==========
-- You as member of BTS community
INSERT INTO community_members (id, user_id, community_id, community_nickname, role)
VALUES
  (cm_me_bts, my_uid, c_bts, 'User#1234', 'member'),
  (cm_fan1_bts, fan1, c_bts, 'ArmyForever', 'member'),
  (cm_fan2_bts, fan2, c_bts, 'BangtanLover', 'member'),
  (cm_creator1_bts, creator1, c_bts, 'RM_Official', 'creator'),
  (cm_creator2_bts, creator2, c_bts, 'JK_Official', 'creator'),
  (cm_me_ive, my_uid, c_ive, 'User#5678', 'member')
ON CONFLICT DO NOTHING;

-- ========== POSTS (Fan posts in BTS) ==========
INSERT INTO posts (id, community_id, author_id, author_role, content, post_type, like_count, comment_count, created_at)
VALUES
  (p1, c_bts, fan1, 'fan',
   '오늘 방탄 콘서트 다녀왔는데 진짜 미쳤어요 ㅠㅠ 세트리스트 역대급이었음!! 다들 가세요 제발',
   'text', 15, 2, NOW() - INTERVAL '2 hours'),
  (p2, c_bts, fan2, 'fan',
   '새 앨범 타이틀곡 뮤비 해석 정리했습니다. 이스터에그가 장난 아니네요... 특히 2분 34초 장면에서 Wings 앨범 컨셉과 연결되는 부분이 소름',
   'text', 42, 1, NOW() - INTERVAL '5 hours'),
  (p3, c_bts, my_uid, 'fan',
   '입덕한 지 3개월 됐는데 이제 탈덕 불가능인 거 같아요 ㅋㅋㅋ 최애는 정국!',
   'text', 8, 0, NOW() - INTERVAL '1 hour'),
  (p4, c_bts, fan1, 'fan',
   '아미들 다음 달 팬미팅 신청 다들 하셨나요? 지금 안 하면 마감됩니다!',
   'text', 3, 0, NOW() - INTERVAL '30 minutes'),
  (p5, c_bts, fan2, 'fan',
   '정국 오늘 라이브 본 사람?? 요리하면서 팬들이랑 대화한 거 너무 힐링이었다',
   'text', 25, 0, NOW() - INTERVAL '8 hours')
ON CONFLICT DO NOTHING;

-- ========== POSTS (Creator posts in BTS) ==========
INSERT INTO posts (id, community_id, author_id, artist_member_id, author_role, content, post_type, like_count, comment_count, created_at)
VALUES
  (p6, c_bts, creator1, am1, 'creator',
   '아미 여러분 안녕하세요 RM입니다. 새 솔로 앨범 작업 중인데 아미들이 듣고 싶은 장르가 있다면 댓글로 알려주세요!',
   'text', 120, 2, NOW() - INTERVAL '3 hours'),
  (p7, c_bts, creator2, am2, 'creator',
   '오늘 연습 끝나고 한강 산책했어요 🌙 날씨 좋아서 기분 최고! 아미들도 좋은 하루 보내세요',
   'text', 89, 0, NOW() - INTERVAL '6 hours'),
  (p8, c_bts, creator1, am1, 'creator',
   '독서 추천: 최근에 읽은 책 중에 "소년이 온다" 정말 좋았어요. 아미들도 한번 읽어보세요.',
   'text', 55, 0, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- ========== COMMENTS ==========
-- Comments on fan post p1
INSERT INTO comments (id, post_id, author_id, content, author_role, created_at)
VALUES
  (cmt1, p1, fan2, 'ㅋㅋㅋ 나도 갔는데 진짜 레전드였음!! 앵콜 때 울 뻔했어', 'fan', NOW() - INTERVAL '1 hour 30 minutes'),
  (cmt2, p1, my_uid, '부럽다 ㅠㅠ 다음에는 꼭 갈 거야', 'fan', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- Comment on fan post p2
INSERT INTO comments (id, post_id, author_id, content, author_role, created_at)
VALUES
  (cmt3, p2, fan1, '와 정리 감사합니다! 2분 34초 그 장면 저도 봤는데 소름이었어요', 'fan', NOW() - INTERVAL '4 hours')
ON CONFLICT DO NOTHING;

-- Creator comment on creator post p6 + fan reply
INSERT INTO comments (id, post_id, author_id, artist_member_id, content, author_role, is_creator_reply, created_at)
VALUES
  (cmt4, p6, creator1, am1, '참고로 힙합 + 재즈 느낌으로 가고 있어요 😊', 'creator', true, NOW() - INTERVAL '2 hours 30 minutes')
ON CONFLICT DO NOTHING;

-- ========== LIKES (from you) ==========
INSERT INTO likes (user_id, target_type, target_id)
VALUES
  (my_uid, 'post', p1),
  (my_uid, 'post', p6)
ON CONFLICT DO NOTHING;

RAISE NOTICE '✅ Seed data inserted successfully!';
RAISE NOTICE 'Communities: BTS ARMY (group), IVE DIVE (group), 로맨스 소설 동호회 (solo)';
RAISE NOTICE 'You are a member of BTS ARMY and IVE DIVE';
RAISE NOTICE 'BTS has 5 fan posts, 3 creator posts, 4 comments';

END $$;

-- ============================================================
-- wecord.html Variation A — HALO8 / YUNA / VERSE seed data
-- Mirrors the A-style screenshot content for visual QA.
-- Safe to re-run: uses ON CONFLICT DO NOTHING.
-- ============================================================

DO $$
DECLARE
  my_uid UUID := '0d535925-fd2f-4b98-8b16-1e182fe07bfb';

  -- Communities
  c_halo8 UUID := gen_random_uuid();
  c_yuna  UUID := gen_random_uuid();
  c_verse UUID := gen_random_uuid();

  -- Fake creator user IDs
  u_halo_jia UUID := gen_random_uuid();
  u_halo_rin UUID := gen_random_uuid();
  u_halo_mi  UUID := gen_random_uuid();
  u_yuna     UUID := gen_random_uuid();
  u_verse_a  UUID := gen_random_uuid();
  u_verse_b  UUID := gen_random_uuid();

  -- Fake fan user IDs (JP/KR/EN handles from the A screenshot)
  u_soyeon   UUID := gen_random_uuid();
  u_mina     UUID := gen_random_uuid();
  u_halogirl UUID := gen_random_uuid();
  u_niko     UUID := gen_random_uuid();
  u_rina     UUID := gen_random_uuid();
  u_eve      UUID := gen_random_uuid();
  u_wxr      UUID := gen_random_uuid();
  u_inara    UUID := gen_random_uuid();
  u_spicey   UUID := gen_random_uuid();
  u_miss     UUID := gen_random_uuid();
  u_mina_ar  UUID := gen_random_uuid();
  u_bri      UUID := gen_random_uuid();

  -- Artist member IDs
  am_halo_jia UUID := gen_random_uuid();
  am_halo_rin UUID := gen_random_uuid();
  am_halo_mi  UUID := gen_random_uuid();
  am_yuna     UUID := gen_random_uuid();
  am_verse_a  UUID := gen_random_uuid();
  am_verse_b  UUID := gen_random_uuid();

  -- Community member IDs
  cm_me_halo UUID := gen_random_uuid();
  cm_me_yuna UUID := gen_random_uuid();
  cm_me_verse UUID := gen_random_uuid();
  cm_jia UUID := gen_random_uuid();
  cm_rin UUID := gen_random_uuid();
  cm_yuna UUID := gen_random_uuid();

  -- Creator post IDs
  ap1 UUID := gen_random_uuid();
  ap2 UUID := gen_random_uuid();
  ap3 UUID := gen_random_uuid();
  ap4 UUID := gen_random_uuid();
  ap_yuna UUID := gen_random_uuid();

  -- Fan post IDs
  fp1 UUID := gen_random_uuid();
  fp2 UUID := gen_random_uuid();
  fp3 UUID := gen_random_uuid();
  fp4 UUID := gen_random_uuid();
  fp5 UUID := gen_random_uuid();
  fp6 UUID := gen_random_uuid();
  fp7 UUID := gen_random_uuid();

  -- Comment IDs (on ap1)
  k1 UUID := gen_random_uuid();
  k2 UUID := gen_random_uuid();
  k3 UUID := gen_random_uuid();
  k4 UUID := gen_random_uuid();
  k5 UUID := gen_random_uuid();

  -- Banner IDs
  b1 UUID := gen_random_uuid();
  b2 UUID := gen_random_uuid();
  b3 UUID := gen_random_uuid();

BEGIN

-- ========== COMMUNITIES (Variation A artists) ==========
INSERT INTO communities (id, slug, name, description, cover_image_url, type, category, member_count)
VALUES
  (c_halo8, 'halo8', 'HALO8',
   '[HALO8] SERENADE — Official fan community. Nagoya tour kickoff live now.',
   'https://picsum.photos/seed/halo8-cover/1200/900',
   'group', 'gl', 1245000),
  (c_yuna, 'yuna', 'YUNA',
   'YUNA — new single "Mirror" out now. Solo artist official community.',
   'https://picsum.photos/seed/yuna-cover/1200/900',
   'solo', 'gl', 821000),
  (c_verse, 'verse', 'VERSE',
   'VERSE — Fan Meeting 2026 · Seoul. Official group community.',
   'https://picsum.photos/seed/verse-cover/1200/900',
   'group', 'bl', 534000)
ON CONFLICT (slug) DO NOTHING;

-- ========== FAKE PROFILES ==========
INSERT INTO profiles (user_id, global_nickname, language, onboarding_completed)
VALUES
  (u_halo_jia, 'jia',     'ja', true),
  (u_halo_rin, 'rin',     'ja', true),
  (u_halo_mi,  'mi',      'ja', true),
  (u_yuna,     'YUNA',    'ko', true),
  (u_verse_a,  'VerseA',  'ko', true),
  (u_verse_b,  'VerseB',  'ko', true),
  (u_soyeon,   'soyeon',  'ko', true),
  (u_mina,     'mina_x',  'en', true),
  (u_halogirl, 'halogirl','ja', true),
  (u_niko,     'niko',    'en', true),
  (u_rina,     'rina',    'ja', true),
  (u_eve,      'eve',     'en', true),
  (u_wxr,      'wxR0pa3089','en', true),
  (u_inara,    'inara',   'en', true),
  (u_spicey,   'Spiceyk', 'en', true),
  (u_miss,     'miss',    'en', true),
  (u_mina_ar,  'مينا',    'en', true),
  (u_bri,      ':bri:',   'en', true)
ON CONFLICT (user_id) DO NOTHING;

-- ========== ARTIST MEMBERS ==========
INSERT INTO artist_members (id, community_id, user_id, display_name, profile_image_url, position, sort_order)
VALUES
  (am_halo_jia, c_halo8, u_halo_jia, 'JIA', 'https://picsum.photos/seed/halo8-jia/400/400',  'Leader / Vocal',  1),
  (am_halo_rin, c_halo8, u_halo_rin, 'RIN', 'https://picsum.photos/seed/halo8-rin/400/400',  'Main Vocal',       2),
  (am_halo_mi,  c_halo8, u_halo_mi,  'MI',  'https://picsum.photos/seed/halo8-mi/400/400',   'Rapper / Dancer',  3),
  (am_yuna,     c_yuna,  u_yuna,     'YUNA','https://picsum.photos/seed/yuna-pfp/400/400',   'Solo Artist',      1),
  (am_verse_a,  c_verse, u_verse_a,  'KAI', 'https://picsum.photos/seed/verse-kai/400/400',  'Leader',           1),
  (am_verse_b,  c_verse, u_verse_b,  'NOA', 'https://picsum.photos/seed/verse-noa/400/400',  'Vocal',            2)
ON CONFLICT DO NOTHING;

-- ========== COMMUNITY MEMBERS (me + fans + creators) ==========
INSERT INTO community_members (id, user_id, community_id, community_nickname, role)
VALUES
  -- me
  (cm_me_halo,  my_uid,      c_halo8, 'User#HALO',  'member'),
  (cm_me_yuna,  my_uid,      c_yuna,  'User#YUNA',  'member'),
  (cm_me_verse, my_uid,      c_verse, 'User#VERSE', 'member'),
  -- creators
  (cm_jia,      u_halo_jia,  c_halo8, 'JIA',        'creator'),
  (cm_rin,      u_halo_rin,  c_halo8, 'RIN',        'creator'),
  (cm_yuna,     u_yuna,      c_yuna,  'YUNA',       'creator'),
  -- fans (HALO8)
  (gen_random_uuid(), u_soyeon,   c_halo8, 'soyeon',   'member'),
  (gen_random_uuid(), u_mina,     c_halo8, 'mina_x',   'member'),
  (gen_random_uuid(), u_halogirl, c_halo8, 'halogirl', 'member'),
  (gen_random_uuid(), u_niko,     c_halo8, 'niko',     'member'),
  (gen_random_uuid(), u_rina,     c_halo8, 'rina',     'member'),
  (gen_random_uuid(), u_eve,      c_halo8, 'eve',      'member'),
  (gen_random_uuid(), u_wxr,      c_halo8, 'wxR0pa3089','member'),
  (gen_random_uuid(), u_inara,    c_halo8, 'inara',    'member'),
  (gen_random_uuid(), u_spicey,   c_halo8, 'Spiceyk',  'member'),
  (gen_random_uuid(), u_miss,     c_halo8, 'miss',     'member'),
  (gen_random_uuid(), u_mina_ar,  c_halo8, 'مينا',     'member'),
  (gen_random_uuid(), u_bri,      c_halo8, ':bri:',    'member')
ON CONFLICT DO NOTHING;

-- ========== CREATOR POSTS (HALO8 — JP; mirrors A Artist tab) ==========
INSERT INTO posts (id, community_id, author_id, artist_member_id, author_role, content, media_urls, post_type, like_count, comment_count, created_at)
VALUES
  (ap1, c_halo8, u_halo_jia, am_halo_jia, 'creator',
   E'昨日はツアー初日名古屋ありがとうございました🫶\n目元にシールを貼りました🦋みんなの顔最後までしっかり見えたよ👀',
   ARRAY['https://picsum.photos/seed/halo8-tour-day1/1200/800'],
   'text', 12400, 2104, NOW() - INTERVAL '3 days 4 hours'),

  (ap2, c_halo8, u_halo_rin, am_halo_rin, 'creator',
   'もう寝るー？',
   NULL,
   'text', 9500, 260, NOW() - INTERVAL '6 days 2 hours'),

  (ap3, c_halo8, u_halo_mi, am_halo_mi, 'creator',
   E'新曲「Mirror」のパフォーマンスビデオもう見ましたか？\nこんな帽子初めて被りました☺️',
   ARRAY['https://picsum.photos/seed/halo8-mirror-mv/1200/800'],
   'text', 8300, 150, NOW() - INTERVAL '7 days 2 hours'),

  (ap4, c_halo8, u_halo_jia, am_halo_jia, 'creator',
   'iPod🍎',
   ARRAY['https://picsum.photos/seed/halo8-ipod/1200/800'],
   'text', 9000, 130, NOW() - INTERVAL '11 days 5 hours'),

  (ap_yuna, c_yuna, u_yuna, am_yuna, 'creator',
   E'New single "Mirror" is out 🪞 thank you for listening.\n新曲「Mirror」リリースしました🌸',
   ARRAY['https://picsum.photos/seed/yuna-mirror-art/1200/1200'],
   'text', 6800, 420, NOW() - INTERVAL '18 hours')
ON CONFLICT DO NOTHING;

-- ========== FAN POSTS (HALO8 — EN/JP mix; mirrors A Fan tab) ==========
INSERT INTO posts (id, community_id, author_id, author_role, content, media_urls, post_type, like_count, comment_count, created_at)
VALUES
  (fp1, c_halo8, u_eve, 'fan',
   'hot af',
   NULL,
   'text', 1, 15, NOW() - INTERVAL '4 hours 1 minute'),

  (fp2, c_halo8, u_wxr, 'fan',
   'hy bad baby',
   NULL,
   'text', 2, 4, NOW() - INTERVAL '4 hours 20 minutes'),

  (fp3, c_halo8, u_inara, 'fan',
   'can this usermiranmf stop posting pics or i might block',
   ARRAY['https://picsum.photos/seed/halo8-fan-inara/1200/800'],
   'text', 3, 6, NOW() - INTERVAL '4 hours 32 minutes'),

  (fp4, c_halo8, u_eve, 'fan',
   'yo gng',
   NULL,
   'text', 4, 3, NOW() - INTERVAL '5 hours 42 minutes'),

  (fp5, c_halo8, u_spicey, 'fan',
   E'yoo I''m back 😈',
   NULL,
   'text', 2, 0, NOW() - INTERVAL '6 hours 1 minute'),

  (fp6, c_halo8, u_miss, 'fan',
   'sab so gye?',
   NULL,
   'text', 1, 0, NOW() - INTERVAL '6 hours 10 minutes'),

  (fp7, c_halo8, u_mina_ar, 'fan',
   E'oh how i love this pfp and un , so mad over this 🤦🏽‍♀️💯',
   NULL,
   'text', 5, 2, NOW() - INTERVAL '6 hours 32 minutes')
ON CONFLICT DO NOTHING;

-- ========== COMMENTS on ap1 (mirrors A Post Detail) ==========
INSERT INTO comments (id, post_id, author_id, content, author_role, like_count, created_at)
VALUES
  (k1, ap1, u_soyeon,   E'これ最高すぎる🥹 live でまた聞きたい',                            'fan', 214, NOW() - INTERVAL '2 hours'),
  (k2, ap1, u_mina,     'tears. every time.',                                          'fan', 189, NOW() - INTERVAL '2 hours 5 minutes'),
  (k3, ap1, u_halogirl, E'シール可愛すぎ🦋🦋🦋',                                         'fan',  92, NOW() - INTERVAL '3 hours'),
  (k4, ap1, u_niko,     E'FROM BRAZIL 🇧🇷 we love u',                                  'fan',  54, NOW() - INTERVAL '4 hours'),
  (k5, ap1, u_rina,     'ok who else cried',                                           'fan',  38, NOW() - INTERVAL '4 hours 10 minutes')
ON CONFLICT DO NOTHING;

-- ========== LIKES (me liked top HALO8 posts) ==========
INSERT INTO likes (user_id, target_type, target_id)
VALUES
  (my_uid, 'post',    ap1),
  (my_uid, 'post',    ap3),
  (my_uid, 'comment', k1)
ON CONFLICT DO NOTHING;

-- ========== PROMOTION BANNERS (Home carousel) ==========
INSERT INTO promotion_banners (id, image_url, link_url, sort_order, is_active)
VALUES
  (b1, 'https://picsum.photos/seed/halo8-banner/1200/720', '/(community)/' || c_halo8::text, 1, true),
  (b2, 'https://picsum.photos/seed/yuna-banner/1200/720',  '/(community)/' || c_yuna::text,  2, true),
  (b3, 'https://picsum.photos/seed/verse-banner/1200/720', '/(community)/' || c_verse::text, 3, true)
ON CONFLICT DO NOTHING;

-- ========== NOTIFICATIONS (mirrors A Notifications screen) ==========
INSERT INTO notifications (user_id, type, title, body, data, is_read, created_at)
VALUES
  (my_uid, 'live',
   'HALO8 just went live',
   'We on Fire — Official Listening Party',
   jsonb_build_object('community_id', c_halo8::text, 'nickname', 'HALO8'),
   false, NOW() - INTERVAL '2 minutes'),

  (my_uid, 'creator_post',
   'YUNA posted a new moment',
   E'新曲「Mirror」のパフォーマンスビデオ…',
   jsonb_build_object('community_id', c_yuna::text, 'post_id', ap_yuna::text, 'nickname', 'YUNA'),
   false, NOW() - INTERVAL '12 minutes'),

  (my_uid, 'like',
   'noa liked your comment',
   E'on "目元にシールを貼りました🦋…"',
   jsonb_build_object('community_id', c_halo8::text, 'post_id', ap1::text, 'nickname', 'noa'),
   false, NOW() - INTERVAL '1 hour'),

  (my_uid, 'comment',
   'soyeon replied',
   'same i was so dead at 2:30 🥹',
   jsonb_build_object('community_id', c_halo8::text, 'post_id', ap1::text, 'nickname', 'soyeon'),
   true, NOW() - INTERVAL '2 hours'),

  (my_uid, 'creator_post',
   'VERSE posted a new moment',
   'tour rehearsal day 4',
   jsonb_build_object('community_id', c_verse::text, 'nickname', 'VERSE'),
   true, NOW() - INTERVAL '3 hours'),

  (my_uid, 'notice',
   'Fan Meeting tickets open',
   'HALO8 · Tomorrow 10AM KST',
   jsonb_build_object('community_id', c_halo8::text),
   true, NOW() - INTERVAL '5 hours')
ON CONFLICT DO NOTHING;

RAISE NOTICE '✅ Variation A seed inserted!';
RAISE NOTICE 'Communities: HALO8 (1.24M · group), YUNA (821K · solo), VERSE (534K · group)';
RAISE NOTICE 'HALO8: 5 creator posts (JP), 7 fan posts (EN/JP), 5 comments on tour post';
RAISE NOTICE '3 promotion banners, 6 notifications on your timeline';

END $$;
