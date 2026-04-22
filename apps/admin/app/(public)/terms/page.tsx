import Link from 'next/link';
import { TERMS_KO, TERMS_EN } from '@/lib/legal-content';

/**
 * /terms — Server Component with KO (default) / EN toggle via ?lang=.
 * Plan ref: 07-03-PLAN.md Task 1, Step 4.
 */
export default async function TermsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const isEn = lang === 'en';
  const body = isEn ? TERMS_EN : TERMS_KO;
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
        {isEn ? 'Terms of Service' : '서비스 이용약관'}
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
