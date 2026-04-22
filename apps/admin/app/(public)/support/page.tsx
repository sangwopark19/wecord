import Link from 'next/link';
import { SUPPORT_KO, SUPPORT_EN } from '@/lib/legal-content';

/**
 * /support — public Support page used as the App Store Connect /
 * Play Console "Support URL" field per [REVIEW HIGH] in 07-03-PLAN.md.
 *
 * MUST contain: visible mailto:support@wecord.app + escalation note +
 * FAQ stub. Replaces the deprecated mailto-only Support URL.
 *
 * Plan ref: 07-03-PLAN.md Task 1, Step 5b.
 */
export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const isEn = lang === 'en';
  const body = isEn ? SUPPORT_EN : SUPPORT_KO;
  return (
    <article>
      <nav className="flex justify-end gap-3 text-sm">
        <Link
          href="?lang=ko"
          className={!isEn ? 'font-bold text-foreground' : 'text-muted-foreground'}
        >
          KO
        </Link>
        <Link
          href="?lang=en"
          className={isEn ? 'font-bold text-foreground' : 'text-muted-foreground'}
        >
          EN
        </Link>
      </nav>
      <h1 className="text-2xl font-semibold mt-4">{isEn ? 'Support' : '고객 지원'}</h1>
      <p className="text-sm text-muted-foreground">
        {isEn
          ? 'We reply within 1–3 business days.'
          : '운영일 기준 1~3영업일 내 답변드립니다.'}
      </p>
      <div
        className="prose prose-invert mt-6 max-w-none"
        dangerouslySetInnerHTML={{ __html: body }}
      />
      <p className="mt-8 text-sm">
        <a href="mailto:support@wecord.app" className="underline text-primary">
          mailto:support@wecord.app
        </a>
      </p>
    </article>
  );
}
