import Link from 'next/link';

/**
 * Public route group layout — apps/admin/app/(public)/.
 *
 * - NO auth guard (intentionally distinct from (dashboard)/layout.tsx).
 * - Anonymous users hit /privacy /terms /account-delete-request /support directly.
 * - All children are Server Components — no 'use client' here.
 *
 * Plan reference: 07-03-PLAN.md Task 1.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 bg-background text-foreground min-h-screen">
      <header className="flex items-center justify-between pb-6 border-b border-border">
        <Link href="/" className="text-lg font-semibold">
          Wecord
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/support">Support</Link>
        </nav>
      </header>
      <main className="pt-6">{children}</main>
      <footer className="mt-16 pt-6 border-t border-border text-sm text-muted-foreground flex flex-wrap gap-4">
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Service</Link>
        <Link href="/account-delete-request">Account deletion</Link>
        <Link href="/support">Support</Link>
      </footer>
    </div>
  );
}
