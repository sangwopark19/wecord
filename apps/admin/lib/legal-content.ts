/**
 * Legal content for the apps/admin public route group.
 *
 * Surface points (rendered as Server Components in apps/admin/app/(public)/):
 *   - /privacy                  → PRIVACY_KO / PRIVACY_EN
 *   - /terms                    → TERMS_KO / TERMS_EN
 *   - /account-delete-request   → ACCOUNT_DELETE_KO / ACCOUNT_DELETE_EN
 *   - /support                  → SUPPORT_KO / SUPPORT_EN
 *
 * Plan reference: 07-03-PLAN.md Task 1 (REVIEW HIGH — Support URL,
 * REVIEW UPDATE — Privacy/Terms data map). Acceptance grep contracts:
 *   PRIVACY_*  must include: "Supabase", "Expo Push", "Google Translate",
 *                            "OpenAI Moderation", "account-delete-request"
 *   SUPPORT_*  must include: visible mailto link, FAQ stub
 *
 * IMPORTANT: This is the placeholder body. Real launch text MUST be reviewed
 * by counsel before deployment to Cloudflare Pages — see Plan 07-03 Task 2
 * checkpoint. The structure below reflects the actual data map (processors,
 * UGC moderation workflow, retention window, deletion paths) so the lawyer
 * adapts copy, not architecture.
 */

export const PRIVACY_KO: string = `
  <h2>1. 수집하는 개인정보 항목</h2>
  <p><b>필수:</b> 이메일 주소, 이름(글로벌 닉네임), 생년월일(연령 확인)</p>
  <p><b>선택:</b> 프로필 사진, 자기소개, 선호 언어</p>
  <p><b>자동 수집:</b> 기기 식별자(푸시 토큰), 커뮤니티 내 닉네임, 게시글/댓글/좋아요, 기기 OS/버전</p>

  <h2>2. 개인정보의 수집·이용 목적</h2>
  <p>계정 인증, 커뮤니티 서비스 제공, 푸시 알림, 콘텐츠 번역, 콘텐츠 모더레이션, 고객지원, 법적 의무 이행</p>

  <h2>3. 개인정보 처리 위탁 (3rd-party processors)</h2>
  <table>
    <thead><tr><th>수탁사</th><th>목적</th><th>데이터 유형</th><th>위치</th></tr></thead>
    <tbody>
      <tr><td>Supabase Inc.</td><td>인증, DB, 스토리지, Realtime, Edge Functions</td><td>계정, 프로필, 게시글, 댓글, 이미지</td><td>ap-northeast-2 (Seoul, 대한민국)</td></tr>
      <tr><td>Expo Push (Apple APNs / Google FCM 중계)</td><td>푸시 알림 토큰 중계</td><td>기기 푸시 토큰</td><td>글로벌</td></tr>
      <tr><td>Google LLC (Google Translate API)</td><td>게시글/댓글 자동번역</td><td>게시글/댓글 본문 (번역 요청 시)</td><td>글로벌</td></tr>
      <tr><td>OpenAI OpCo LLC (OpenAI Moderation API)</td><td>유해 콘텐츠 자동 분류</td><td>게시글/댓글 본문 (작성 시)</td><td>미국</td></tr>
    </tbody>
  </table>
  <p>EU/EEA 거주 이용자의 개인정보는 ap-northeast-2(대한민국)로 국외 이전되며, 표준계약조항(SCCs)에 근거합니다.</p>

  <h2>4. UGC 콘텐츠 모더레이션</h2>
  <p>이용자가 작성한 게시글·댓글은 금칙어 필터 + OpenAI Moderation API로 비동기 검사됩니다. 위반 콘텐츠는 관리자 검토 후 경고 → 7일 정지 → 30일 정지 → 영구정지 단계의 제재가 적용됩니다.</p>

  <h2>5. 개인정보 보유 기간</h2>
  <p>활성 계정: 이용 기간 동안 보유. 탈퇴 시: 프로필/커뮤니티 가입/좋아요/팔로우 즉시 삭제, 게시글/댓글 본문은 즉시 익명화(soft-delete + PII scrub) 후 30일 이내 저장소 객체(이미지/동영상) 완전 삭제. 법령상 보존 의무가 있는 기록은 해당 기간 동안 보관.</p>

  <h2>6. 이용자의 권리</h2>
  <p>조회·수정·삭제 요청권을 언제든 행사할 수 있습니다. 아래 방법을 이용하세요.</p>

  <h2 id="deletion">7. 계정 삭제 방법</h2>
  <p><b>앱 내:</b> 더보기 → 설정 → 계정 삭제 (3단계 확인, 'DELETE' 타이핑). 즉시 처리됩니다.</p>
  <p><b>웹:</b> <a href="/account-delete-request">계정 삭제 요청 페이지</a>에서 요청.</p>
  <p><b>Apple 로그인 사용자:</b> 삭제 시 Apple Sign in with Apple refresh token을 Apple에 revoke 요청합니다.</p>

  <h2>8. 문의</h2>
  <p>support@wecord.app · <a href="/support">고객 지원 페이지</a></p>

  <h2>9. 방침 변경</h2>
  <p>본 방침은 2026-04-22부터 시행됩니다. 중요한 변경 시 앱 내 공지로 안내합니다.</p>
`;

export const PRIVACY_EN: string = `
  <h2>1. Personal Information We Collect</h2>
  <p><b>Required:</b> Email address, name (global nickname), date of birth (age verification)</p>
  <p><b>Optional:</b> Profile photo, bio, preferred language</p>
  <p><b>Automatically collected:</b> Device identifier (push token), community nickname, posts/comments/likes, device OS/version</p>

  <h2>2. Purpose of Collection</h2>
  <p>Account authentication, community service delivery, push notifications, content translation, content moderation, customer support, legal compliance</p>

  <h2>3. Third-party Processors</h2>
  <table>
    <thead><tr><th>Processor</th><th>Purpose</th><th>Data Types</th><th>Location</th></tr></thead>
    <tbody>
      <tr><td>Supabase Inc.</td><td>Auth, Database, Storage, Realtime, Edge Functions</td><td>Account, profile, posts, comments, images</td><td>ap-northeast-2 (Seoul, Republic of Korea)</td></tr>
      <tr><td>Expo Push (relay to Apple APNs / Google FCM)</td><td>Push notification token relay</td><td>Device push token</td><td>Global</td></tr>
      <tr><td>Google LLC (Google Translate API)</td><td>Post/comment auto-translation</td><td>Post/comment body (on translate request)</td><td>Global</td></tr>
      <tr><td>OpenAI OpCo LLC (OpenAI Moderation API)</td><td>Automated harmful-content classification</td><td>Post/comment body (on submission)</td><td>United States</td></tr>
    </tbody>
  </table>
  <p>For users in the EU/EEA, personal data is transferred to ap-northeast-2 (Republic of Korea) under Standard Contractual Clauses (SCCs).</p>

  <h2>4. UGC Content Moderation</h2>
  <p>User-generated posts and comments are asynchronously screened by a banned-word filter and the OpenAI Moderation API. Violating content is reviewed by administrators and may result in graduated sanctions: warning → 7-day suspension → 30-day suspension → permanent ban.</p>

  <h2>5. Retention</h2>
  <p>Active accounts: retained while in use. On account deletion: profile / community memberships / likes / follows are deleted immediately; post and comment bodies are anonymized (soft-delete with PII scrub) immediately and storage objects (images/video) purged within 30 days. Records subject to legal retention are kept for the required period.</p>

  <h2>6. Your Rights</h2>
  <p>You may request access, correction, or deletion of your personal data at any time using the methods below.</p>

  <h2 id="deletion">7. How to Delete Your Account</h2>
  <p><b>In-app:</b> More → Settings → Delete account (3-step confirmation, type 'DELETE'). Processed immediately.</p>
  <p><b>Web:</b> Submit a request via <a href="/account-delete-request">our account deletion request page</a>.</p>
  <p><b>Apple Sign-In users:</b> on deletion we send a refresh-token revoke request to Apple.</p>

  <h2>8. Contact</h2>
  <p>support@wecord.app · <a href="/support">Support Center</a></p>

  <h2>9. Changes to This Policy</h2>
  <p>This policy is effective from 2026-04-22. Material changes will be announced in-app.</p>
`;

export const TERMS_KO: string = `
  <h2>1. 서비스 이용</h2>
  <p>Wecord(이하 "서비스")는 K-pop 팬덤 커뮤니티 플랫폼입니다. 만 17세 이상부터 이용 가능합니다.</p>

  <h2>2. 계정</h2>
  <p>이용자는 정확한 정보로 계정을 등록·관리할 책임이 있습니다. 계정은 양도·공유할 수 없습니다.</p>

  <h2>3. 이용자가 게시한 콘텐츠 (UGC)</h2>
  <p>이용자가 게시한 모든 콘텐츠의 저작권은 이용자에게 있습니다. 단, 서비스 운영에 필요한 범위(저장, 표시, 다국어 번역, 모더레이션)에서 무상·전 세계·비독점 라이선스를 회사에 부여합니다.</p>

  <h2>4. 금지 행위</h2>
  <ul>
    <li>타인의 명예훼손, 혐오 표현, 차별, 폭력 조장</li>
    <li>음란물·아동 성착취·약물 권장</li>
    <li>스팸, 사기, 피싱, 멀웨어 유포</li>
    <li>저작권 침해, 상표 침해</li>
    <li>서비스 자동화 도구(봇/스크래퍼) 무단 사용</li>
    <li>타 이용자 신고 시스템 악용 또는 허위 신고</li>
  </ul>

  <h2>5. 모더레이션 및 제재</h2>
  <p>회사는 UGC를 자동·수동으로 검토하며, 약관 위반 시 경고 → 7일 정지 → 30일 정지 → 영구정지 순으로 제재할 수 있습니다.</p>

  <h2>6. 계정 정지·해지</h2>
  <p>이용자는 언제든 계정을 삭제할 수 있습니다(개인정보처리방침 §7 참조). 회사는 약관 중대 위반 시 사전 통지 없이 계정을 해지할 수 있습니다.</p>

  <h2>7. 책임의 제한</h2>
  <p>서비스는 "있는 그대로" 제공되며, 천재지변·외부 서비스 장애·이용자 콘텐츠로 인한 손해에 대해 회사는 법령상 허용 범위 내에서 책임을 지지 않습니다.</p>

  <h2>8. 준거법 및 분쟁 해결</h2>
  <p>본 약관은 대한민국 법에 따라 해석되며, 분쟁 발생 시 서울중앙지방법원을 1심 관할로 합니다.</p>

  <h2>9. 약관 변경</h2>
  <p>회사는 본 약관을 변경할 수 있으며, 변경 시 앱 내 공지로 30일 전 안내합니다.</p>

  <p>시행일: 2026-04-22</p>
`;

export const TERMS_EN: string = `
  <h2>1. Service</h2>
  <p>Wecord (the "Service") is a K-pop fan community platform. Use is restricted to users aged 17+.</p>

  <h2>2. Account</h2>
  <p>You are responsible for registering and maintaining your account with accurate information. Accounts may not be transferred or shared.</p>

  <h2>3. User-Generated Content (UGC)</h2>
  <p>You retain copyright in all content you post. You grant the company a free, worldwide, non-exclusive license to use that content solely for operating the Service (storage, display, multilingual translation, moderation).</p>

  <h2>4. Prohibited Conduct</h2>
  <ul>
    <li>Defamation, hate speech, discrimination, incitement to violence</li>
    <li>Sexually explicit material, child sexual exploitation, drug promotion</li>
    <li>Spam, fraud, phishing, malware distribution</li>
    <li>Copyright or trademark infringement</li>
    <li>Unauthorized use of automation tools (bots/scrapers)</li>
    <li>Abuse or false use of the report system</li>
  </ul>

  <h2>5. Moderation and Sanctions</h2>
  <p>We review UGC automatically and manually; violations may result in graduated sanctions: warning → 7-day suspension → 30-day suspension → permanent ban.</p>

  <h2>6. Termination</h2>
  <p>You may delete your account at any time (see Privacy Policy §7). We may terminate accounts without prior notice for material violations.</p>

  <h2>7. Limitation of Liability</h2>
  <p>The Service is provided "as is". To the extent permitted by law, we are not liable for damages arising from force majeure, third-party service outages, or user content.</p>

  <h2>8. Governing Law</h2>
  <p>These Terms are governed by the laws of the Republic of Korea. The Seoul Central District Court has exclusive jurisdiction over the first instance of any dispute.</p>

  <h2>9. Changes</h2>
  <p>We may change these Terms with 30 days' in-app notice.</p>

  <p>Effective: 2026-04-22</p>
`;

export const ACCOUNT_DELETE_KO: string = `
  <h2>계정 삭제 안내</h2>
  <p>Wecord 계정은 두 가지 방법으로 삭제할 수 있습니다.</p>

  <h2>방법 1: 앱 내 즉시 삭제 (권장)</h2>
  <ol>
    <li>앱 실행 후 <b>더보기 → 설정 → 계정 삭제</b></li>
    <li>경고 화면 → '계속' 탭</li>
    <li>확인 화면에서 <b>DELETE</b> 입력 → '삭제' 탭</li>
    <li>처리 완료 후 자동 로그아웃됩니다.</li>
  </ol>
  <p>처리 시간: 즉시.</p>

  <h2>방법 2: 웹 요청 (앱 접근이 어려울 때)</h2>
  <ol>
    <li>가입에 사용한 이메일로 <a href="mailto:support@wecord.app?subject=DELETE%20MY%20ACCOUNT">support@wecord.app</a>에 메일을 보내주세요.</li>
    <li>제목: <b>DELETE MY ACCOUNT</b></li>
    <li>본문: 가입 이메일 + 가입 시 사용한 OAuth 제공자(Google / Apple)</li>
    <li>본인 확인을 위한 인증 메일을 답신해 드립니다 (1영업일 이내).</li>
    <li>인증 회신 후 7일 이내 처리됩니다.</li>
  </ol>

  <h2>삭제되는 데이터</h2>
  <ul>
    <li>프로필, 닉네임, 아바타, 자기소개, 생년월일, 선호 언어</li>
    <li>커뮤니티 가입 정보, 좋아요, 팔로우</li>
    <li>푸시 알림 토큰</li>
    <li>업로드한 이미지/동영상 (Storage)</li>
    <li>Apple 로그인 사용자: Apple refresh token revoke 요청</li>
  </ul>

  <h2>익명화되는 데이터 (스레드 무결성 유지)</h2>
  <ul>
    <li>게시글·댓글 본문 → 즉시 빈 문자열로 치환 (작성자 ID 제거)</li>
  </ul>

  <p>문의: <a href="mailto:support@wecord.app">support@wecord.app</a></p>
`;

export const ACCOUNT_DELETE_EN: string = `
  <h2>Delete Your Account</h2>
  <p>You can delete your Wecord account in two ways.</p>

  <h2>Option 1: In-App Deletion (Recommended)</h2>
  <ol>
    <li>Open the app → <b>More → Settings → Delete account</b></li>
    <li>Warning screen → tap 'Continue'</li>
    <li>Type <b>DELETE</b> on the confirmation screen → tap 'Delete'</li>
    <li>You will be logged out automatically.</li>
  </ol>
  <p>Processing time: immediate.</p>

  <h2>Option 2: Web Request (if app access is unavailable)</h2>
  <ol>
    <li>From the email you signed up with, write to <a href="mailto:support@wecord.app?subject=DELETE%20MY%20ACCOUNT">support@wecord.app</a>.</li>
    <li>Subject: <b>DELETE MY ACCOUNT</b></li>
    <li>Body: signup email + OAuth provider (Google / Apple)</li>
    <li>We reply with a verification email within 1 business day.</li>
    <li>After your verification reply, we complete deletion within 7 days.</li>
  </ol>

  <h2>Data Removed</h2>
  <ul>
    <li>Profile, nickname, avatar, bio, date of birth, language preference</li>
    <li>Community memberships, likes, follows</li>
    <li>Push notification tokens</li>
    <li>Uploaded images and videos (Storage)</li>
    <li>For Apple Sign-In users: refresh token revocation requested</li>
  </ul>

  <h2>Anonymized Data (Thread Integrity)</h2>
  <ul>
    <li>Post and comment bodies → immediately replaced with empty string (author ID removed)</li>
  </ul>

  <p>Contact: <a href="mailto:support@wecord.app">support@wecord.app</a></p>
`;

export const SUPPORT_KO: string = `
  <h2>문의 채널</h2>
  <p>이메일: <a href="mailto:support@wecord.app">support@wecord.app</a></p>
  <p>영업일 기준 1~3일 내 답변드립니다.</p>

  <h2>자주 묻는 질문</h2>

  <h3>계정을 복구하려면?</h3>
  <p>로그인 이메일을 <a href="mailto:support@wecord.app">support@wecord.app</a>으로 보내주세요. 본인 확인 후 안내해드립니다.</p>

  <h3>계정을 삭제하려면?</h3>
  <p>앱 <b>더보기 → 설정 → 계정 삭제</b>에서 즉시 삭제할 수 있습니다. 앱 접근이 어려우면 <a href="/account-delete-request">계정 삭제 요청 페이지</a>로 요청하세요.</p>

  <h3>커뮤니티 규정을 위반하는 게시글을 봤어요.</h3>
  <p>게시글 우측 상단 <b>⋯</b> 메뉴에서 '신고'를 선택해주세요. 신고 사유는 혐오 / 스팸 / 폭력 / 저작권 / 기타 5가지로 분류됩니다. 운영팀이 자동·수동 검토 후 처리합니다.</p>

  <h3>결제 기능이 있나요?</h3>
  <p>v1.0(MVP)에서는 결제 기능을 제공하지 않습니다. Shop 탭은 외부 상점(x-square.kr) 둘러보기 전용입니다.</p>

  <h3>DM은 언제 사용할 수 있나요?</h3>
  <p>DM(다이렉트 메시지)은 v1.1에서 출시 예정입니다. DM 탭에서 '알림 받기'를 등록하시면 출시 시 알려드립니다.</p>

  <h3>다국어 지원 범위는 어떻게 되나요?</h3>
  <p>한국어, 영어, 태국어, 중국어(간체), 일본어 5개 언어를 지원합니다. 게시글 자동 번역은 Google Translate API를 사용합니다.</p>

  <h2>관련 페이지</h2>
  <ul>
    <li><a href="/privacy">개인정보처리방침</a></li>
    <li><a href="/terms">서비스 이용약관</a></li>
    <li><a href="/account-delete-request">계정 삭제 요청</a></li>
  </ul>
`;

export const SUPPORT_EN: string = `
  <h2>Contact Channels</h2>
  <p>Email: <a href="mailto:support@wecord.app">support@wecord.app</a></p>
  <p>We reply within 1–3 business days.</p>

  <h2>Frequently Asked Questions</h2>

  <h3>How do I recover my account?</h3>
  <p>Email <a href="mailto:support@wecord.app">support@wecord.app</a> from your registered address. We will guide you after identity verification.</p>

  <h3>How do I delete my account?</h3>
  <p>In the app, go to <b>More → Settings → Delete account</b> for immediate deletion. If app access is unavailable, use the <a href="/account-delete-request">web deletion request page</a>.</p>

  <h3>I saw a post that violates community rules.</h3>
  <p>Tap the <b>⋯</b> menu on the post and select 'Report'. Reasons are categorized into 5: hate / spam / violence / copyright / other. Our team reviews reports automatically and manually.</p>

  <h3>Are payments supported?</h3>
  <p>v1.0 (MVP) does not include payments. The Shop tab is browse-only access to an external store (x-square.kr).</p>

  <h3>When will DM be available?</h3>
  <p>Direct Messages are scheduled for v1.1. Tap 'Notify Me' in the DM tab and we'll let you know at launch.</p>

  <h3>What languages are supported?</h3>
  <p>Korean, English, Thai, Chinese (Simplified), Japanese — 5 languages. Auto-translation uses the Google Translate API.</p>

  <h2>Related Pages</h2>
  <ul>
    <li><a href="/privacy">Privacy Policy</a></li>
    <li><a href="/terms">Terms of Service</a></li>
    <li><a href="/account-delete-request">Account Deletion Request</a></li>
  </ul>
`;
