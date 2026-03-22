'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      if (!user || user.user_metadata?.role !== 'admin') {
        router.replace('/login');
        return;
      }
      setAuthorized(true);
    }
    checkAuth();
  }, [router]);

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">{children}</main>
    </div>
  );
}
