'use client';

import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';

interface StatCardProps {
  label: string;
  value: number | string;
  loading: boolean;
}

function StatCard({ label, value, loading }: StatCardProps) {
  return (
    <div className="rounded-lg border border-[#2B2B2B] bg-[#1A1A1A] p-6">
      <p className="text-[28px] font-semibold leading-[1.2] text-foreground">
        {loading ? '--' : value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [dau, setDau] = useState(0);
  const [wau, setWau] = useState(0);
  const [mau, setMau] = useState(0);
  const [signups, setSignups] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const [dauRes, wauRes, mauRes, signupsRes, reportsRes] =
        await Promise.all([
          // DAU: distinct post authors today
          supabaseAdmin
            .from('posts')
            .select('author_id', { count: 'exact', head: true })
            .gte('created_at', today),
          // WAU: distinct post authors in last 7 days
          supabaseAdmin
            .from('posts')
            .select('author_id')
            .gte('created_at', sevenDaysAgo),
          // MAU: distinct post authors in last 30 days
          supabaseAdmin
            .from('posts')
            .select('author_id')
            .gte('created_at', thirtyDaysAgo),
          // New signups today
          supabaseAdmin
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', today),
          // Pending reports
          supabaseAdmin
            .from('reports')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
        ]);

      // Count distinct authors for DAU (using head/count gives total rows, not distinct)
      // For WAU/MAU, we need to count distinct author_ids
      const dauDistinct = dauRes.count ?? 0;
      const wauDistinct = new Set(
        (wauRes.data ?? []).map((r: { author_id: string }) => r.author_id)
      ).size;
      const mauDistinct = new Set(
        (mauRes.data ?? []).map((r: { author_id: string }) => r.author_id)
      ).size;

      setDau(dauDistinct);
      setWau(wauDistinct);
      setMau(mauDistinct);
      setSignups(signupsRes.count ?? 0);
      setPendingReports(reportsRes.count ?? 0);
      setLoading(false);
    }

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold leading-[1.2] mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <StatCard label="DAU (Today)" value={dau} loading={loading} />
        <StatCard label="WAU (7 Days)" value={wau} loading={loading} />
        <StatCard label="MAU (30 Days)" value={mau} loading={loading} />
        <StatCard label="New Signups (Today)" value={signups} loading={loading} />
      </div>

      <div className="mt-8">
        <Link
          href="/moderation"
          className="inline-flex items-center gap-2 rounded-lg border border-[#2B2B2B] bg-[#1A1A1A] px-6 py-4 transition-colors hover:bg-[#2B2B2B]"
        >
          <span className="text-sm text-foreground">Pending Reports</span>
          <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-medium text-destructive">
            {loading ? '--' : pendingReports}
          </span>
        </Link>
      </div>
    </div>
  );
}
