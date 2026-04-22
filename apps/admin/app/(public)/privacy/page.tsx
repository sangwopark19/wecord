import Link from 'next/link';
import { PRIVACY_KO, PRIVACY_EN } from '@/lib/legal-content';

/**
 * /privacy — Server Component with KO (default) / EN toggle via ?lang=.
 * Plan ref: 07-03-PLAN.md Task 1, Step 3.
 */
export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const isEn = lang === 'en';
  const body = isEn ? PRIVACY_EN : PRIVACY_KO;
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
      <h1 className="text-2xl font-semibold mt-4">
        {isEn ? 'Privacy Policy' : '개인정보처리방침'}
      </h1>
      <p className="text-sm text-muted-foreground">
        {isEn ? 'Last updated: ' : '최종 개정일: '}2026-04-22
      </p>
      <div
        className="prose prose-invert mt-6 max-w-none"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </article>
  );
}
