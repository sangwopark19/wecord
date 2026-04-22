import Link from 'next/link';
import { ACCOUNT_DELETE_KO, ACCOUNT_DELETE_EN } from '@/lib/legal-content';

/**
 * /account-delete-request — public web deletion request page.
 *
 * Required by Google Play DMA (Data Safety form lists this URL as the
 * "users can request deletion off-app" path) and referenced by Apple
 * Guideline 4.8 sect. 2.
 *
 * MUST contain: visible mailto link to support@wecord.app and the literal
 * substring "DELETE MY ACCOUNT" (subject template).
 *
 * Plan ref: 07-03-PLAN.md Task 1, Step 5.
 */
export default async function AccountDeleteRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const isEn = lang === 'en';
  const body = isEn ? ACCOUNT_DELETE_EN : ACCOUNT_DELETE_KO;
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
        {isEn ? 'Delete account' : '계정 삭제'}
      </h1>
      <p className="text-sm text-muted-foreground">
        {isEn ? 'Last updated: ' : '최종 개정일: '}2026-04-22
      </p>
      <div
        className="prose prose-invert mt-6 max-w-none"
        dangerouslySetInnerHTML={{ __html: body }}
      />
      <p className="mt-8 text-sm">
        <a
          href="mailto:support@wecord.app?subject=DELETE%20MY%20ACCOUNT"
          className="underline text-primary"
        >
          mailto:support@wecord.app
        </a>
      </p>
    </article>
  );
}
