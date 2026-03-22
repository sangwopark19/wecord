'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RangePreset = 7 | 30 | 90;

interface DayCount {
  day: string;
  count: number;
}

interface ContentDayData {
  day: string;
  posts: number;
  comments: number;
  reports: number;
}

interface CommunityStats {
  community_id: string;
  community_name: string;
  member_count: number;
  post_count: number;
  comment_count: number;
  report_count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function groupByDay(
  rows: { created_at: string }[],
  startDate: Date,
  endDate: Date,
): Map<string, number> {
  const map = new Map<string, number>();
  // Initialize all days to 0
  const cur = new Date(startDate);
  while (cur <= endDate) {
    map.set(toDateStr(cur), 0);
    cur.setDate(cur.getDate() + 1);
  }
  for (const row of rows) {
    const day = row.created_at.split('T')[0];
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#2B2B2B] bg-[#1A1A1A] p-6">
      <p className="text-[28px] font-semibold leading-[1.2] text-foreground">
        {loading ? '--' : value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs font-normal text-muted-foreground">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty chart state
// ---------------------------------------------------------------------------

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangePreset>(30);
  const [loading, setLoading] = useState(true);

  // Stat cards
  const [dau, setDau] = useState(0);
  const [wau, setWau] = useState(0);
  const [mau, setMau] = useState(0);
  const [newSignups, setNewSignups] = useState(0);

  // Charts
  const [userActivityData, setUserActivityData] = useState<DayCount[]>([]);
  const [contentActivityData, setContentActivityData] = useState<ContentDayData[]>([]);

  // Community table
  const [communities, setCommunities] = useState<CommunityStats[]>([]);

  // -----------------------------------------------------------------------
  // Fetch
  // -----------------------------------------------------------------------

  const fetchData = useCallback(async (r: RangePreset) => {
    setLoading(true);

    const now = new Date();
    const today = toDateStr(now);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - r);
    const startStr = toDateStr(startDate);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      // ---------- Stat cards ----------
      const [dauRes, wauRes, mauRes, signupsRes] = await Promise.all([
        // DAU: active users today
        supabaseAdmin.rpc('get_daily_active_users', {
          start_date: today,
          end_date: today,
        }),
        // WAU: sum last 7 days
        supabaseAdmin.rpc('get_daily_active_users', {
          start_date: toDateStr(sevenDaysAgo),
          end_date: today,
        }),
        // MAU: sum last 30 days
        supabaseAdmin.rpc('get_daily_active_users', {
          start_date: toDateStr(thirtyDaysAgo),
          end_date: today,
        }),
        // Signups for selected range
        supabaseAdmin.rpc('get_daily_signups', {
          start_date: startStr,
          end_date: today,
        }),
      ]);

      // DAU = first row count (today only)
      const dauVal =
        (dauRes.data as DayCount[] | null)?.[0]?.count ?? 0;
      setDau(dauVal);

      // WAU = sum of daily counts over 7 days (approximation — distinct users may overlap days)
      const wauVal = ((wauRes.data as DayCount[] | null) ?? []).reduce(
        (sum, d) => sum + Number(d.count),
        0,
      );
      setWau(wauVal);

      // MAU = sum of daily counts over 30 days
      const mauVal = ((mauRes.data as DayCount[] | null) ?? []).reduce(
        (sum, d) => sum + Number(d.count),
        0,
      );
      setMau(mauVal);

      // Signups
      const signupsVal = ((signupsRes.data as DayCount[] | null) ?? []).reduce(
        (sum, d) => sum + Number(d.count),
        0,
      );
      setNewSignups(signupsVal);

      // ---------- User Activity Chart ----------
      const userActRes = await supabaseAdmin.rpc('get_daily_active_users', {
        start_date: startStr,
        end_date: today,
      });
      const rawUserAct = (userActRes.data as DayCount[] | null) ?? [];
      setUserActivityData(
        rawUserAct.map((d) => ({ day: d.day, count: Number(d.count) })),
      );

      // ---------- Content Activity Chart ----------
      const [postsRes, commentsRes, reportsRes] = await Promise.all([
        supabaseAdmin
          .from('posts')
          .select('created_at')
          .gte('created_at', startStr)
          .is('deleted_at', null),
        supabaseAdmin
          .from('comments')
          .select('created_at')
          .gte('created_at', startStr),
        supabaseAdmin
          .from('reports')
          .select('created_at')
          .gte('created_at', startStr),
      ]);

      const postsMap = groupByDay(postsRes.data ?? [], startDate, now);
      const commentsMap = groupByDay(commentsRes.data ?? [], startDate, now);
      const reportsMap = groupByDay(reportsRes.data ?? [], startDate, now);

      const contentData: ContentDayData[] = [];
      const cur = new Date(startDate);
      while (cur <= now) {
        const dayStr = toDateStr(cur);
        contentData.push({
          day: dayStr,
          posts: postsMap.get(dayStr) ?? 0,
          comments: commentsMap.get(dayStr) ?? 0,
          reports: reportsMap.get(dayStr) ?? 0,
        });
        cur.setDate(cur.getDate() + 1);
      }
      setContentActivityData(contentData);

      // ---------- Top Communities ----------
      const communityRes = await supabaseAdmin.rpc('get_community_stats');
      const allCommunities = (communityRes.data as CommunityStats[] | null) ?? [];
      setCommunities(allCommunities.slice(0, 10));
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const presets: RangePreset[] = [7, 30, 90];

  return (
    <div>
      {/* Header + Range Presets */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold leading-[1.2]">Analytics</h1>
        <div className="flex gap-2">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setRange(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                range === p
                  ? 'bg-[#00E5C3] text-black'
                  : 'border border-[#2B2B2B] bg-transparent text-foreground hover:bg-[#2B2B2B]'
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <StatCard label="DAU (Today)" value={dau} loading={loading} />
        <StatCard label="WAU (7 Days)" value={wau} loading={loading} />
        <StatCard label="MAU (30 Days)" value={mau} loading={loading} />
        <StatCard label={`New Signups (${range}d)`} value={newSignups} loading={loading} />
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* User Activity Chart */}
        <div className="rounded-lg border border-[#2B2B2B] bg-[#1A1A1A] p-6">
          <h2 className="mb-4 text-sm font-semibold">User Activity</h2>
          {!loading && userActivityData.length === 0 ? (
            <EmptyChart message="No data available for the selected period" />
          ) : loading ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                <XAxis dataKey="day" stroke="#999999" tick={{ fontSize: 12 }} />
                <YAxis stroke="#999999" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2B2B2B',
                    color: '#FFFFFF',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#00E5C3"
                  strokeWidth={2}
                  dot={false}
                  name="Active Users"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Content Activity Chart */}
        <div className="rounded-lg border border-[#2B2B2B] bg-[#1A1A1A] p-6">
          <h2 className="mb-4 text-sm font-semibold">Content Activity</h2>
          {!loading && contentActivityData.length === 0 ? (
            <EmptyChart message="No data available for the selected period" />
          ) : loading ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={contentActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                <XAxis dataKey="day" stroke="#999999" tick={{ fontSize: 12 }} />
                <YAxis stroke="#999999" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2B2B2B',
                    color: '#FFFFFF',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="posts"
                  stroke="#00E5C3"
                  strokeWidth={2}
                  dot={false}
                  name="Posts"
                />
                <Line
                  type="monotone"
                  dataKey="comments"
                  stroke="#666666"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Comments"
                />
                <Line
                  type="monotone"
                  dataKey="reports"
                  stroke="#E04848"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  dot={false}
                  name="Reports"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Communities Table */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Top Communities</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : communities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No data available for the selected period
          </p>
        ) : (
          <div className="rounded-lg border border-[#2B2B2B] bg-[#1A1A1A]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2B2B2B]">
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Community Name</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead className="text-right">Posts</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                  <TableHead className="text-right">Reports</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communities.map((c, idx) => (
                  <TableRow key={c.community_id} className="border-[#2B2B2B]">
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell>{c.community_name}</TableCell>
                    <TableCell className="text-right">
                      {c.member_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.post_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.comment_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.report_count.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
