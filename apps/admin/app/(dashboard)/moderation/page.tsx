'use client';

import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { supabaseBrowser } from '@/lib/supabase-browser';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SidePanel } from '@/components/SidePanel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportGroup {
  target_type: 'post' | 'comment';
  target_id: string;
  report_count: number;
  reasons: string[];
  latest_report_at: string;
  status: 'pending' | 'reviewed' | 'actioned';
  content?: string;
  author_id?: string;
  individual_reports?: Array<{ reason: string; created_at: string }>;
  sanctions?: Array<{
    type: string;
    reason: string;
    created_at: string;
    expires_at: string | null;
  }>;
}

type SanctionType = 'warning' | '7day_ban' | '30day_ban' | 'permanent_ban';

const SANCTION_LABELS: Record<SanctionType, string> = {
  warning: 'Warning',
  '7day_ban': '7-Day Ban',
  '30day_ban': '30-Day Ban',
  permanent_ban: 'Permanent Ban',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dt: string): string {
  return new Date(dt).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
          Pending
        </Badge>
      );
    case 'reviewed':
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">
          Reviewed
        </Badge>
      );
    case 'actioned':
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/40">
          Actioned
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function computeExpiresAt(type: SanctionType): string | null {
  if (type === 'warning' || type === 'permanent_ban') return null;
  const now = new Date();
  if (type === '7day_ban') {
    now.setDate(now.getDate() + 7);
  } else if (type === '30day_ban') {
    now.setDate(now.getDate() + 30);
  }
  return now.toISOString();
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ModerationPage() {
  const [reportGroups, setReportGroups] = useState<ReportGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportGroup | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);

  // Sanction form state
  const [sanctionType, setSanctionType] = useState<SanctionType | null>(null);
  const [sanctionReason, setSanctionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // ------------------------------------------------------------------
  // Fetch report queue
  // ------------------------------------------------------------------

  async function fetchReports() {
    setLoading(true);
    const { data: rawReports } = await supabaseAdmin
      .from('reports')
      .select('target_type, target_id, reason, status, created_at')
      .order('created_at', { ascending: false });

    if (!rawReports || rawReports.length === 0) {
      setReportGroups([]);
      setLoading(false);
      return;
    }

    // Aggregate by (target_type, target_id)
    const groupMap = new Map<string, ReportGroup>();
    for (const r of rawReports) {
      const key = `${r.target_type}:${r.target_id}`;
      const existing = groupMap.get(key);
      if (existing) {
        existing.report_count += 1;
        if (!existing.reasons.includes(r.reason)) {
          existing.reasons.push(r.reason);
        }
        if (new Date(r.created_at) > new Date(existing.latest_report_at)) {
          existing.latest_report_at = r.created_at;
        }
        // Use the most actionable status
        if (r.status === 'pending' && existing.status !== 'pending') {
          existing.status = 'pending';
        }
      } else {
        groupMap.set(key, {
          target_type: r.target_type as 'post' | 'comment',
          target_id: r.target_id,
          report_count: 1,
          reasons: [r.reason],
          latest_report_at: r.created_at,
          status: r.status as 'pending' | 'reviewed' | 'actioned',
        });
      }
    }

    // Fetch content previews
    const groups = Array.from(groupMap.values());
    const postIds = groups
      .filter((g) => g.target_type === 'post')
      .map((g) => g.target_id);
    const commentIds = groups
      .filter((g) => g.target_type === 'comment')
      .map((g) => g.target_id);

    if (postIds.length > 0) {
      const { data: posts } = await supabaseAdmin
        .from('posts')
        .select('id, content, author_id')
        .in('id', postIds);
      if (posts) {
        for (const p of posts) {
          const g = groups.find(
            (g) => g.target_type === 'post' && g.target_id === p.id
          );
          if (g) {
            g.content = p.content;
            g.author_id = p.author_id;
          }
        }
      }
    }

    if (commentIds.length > 0) {
      const { data: comments } = await supabaseAdmin
        .from('comments')
        .select('id, content, author_id')
        .in('id', commentIds);
      if (comments) {
        for (const c of comments) {
          const g = groups.find(
            (g) => g.target_type === 'comment' && g.target_id === c.id
          );
          if (g) {
            g.content = c.content;
            g.author_id = c.author_id;
          }
        }
      }
    }

    // Sort by report count descending
    groups.sort((a, b) => b.report_count - a.report_count);
    setReportGroups(groups);
    setLoading(false);
  }

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------
  // Open side panel with full details
  // ------------------------------------------------------------------

  async function openReport(group: ReportGroup) {
    setSelectedReport(group);
    setPanelLoading(true);
    setSanctionType(null);
    setSanctionReason('');
    setFeedback(null);

    // Fetch individual reports
    const { data: reports } = await supabaseAdmin
      .from('reports')
      .select('reason, created_at')
      .eq('target_type', group.target_type)
      .eq('target_id', group.target_id)
      .order('created_at', { ascending: false });

    // Fetch sanctions for this content's author
    let sanctions: ReportGroup['sanctions'] = [];
    if (group.author_id) {
      const { data: sanctionData } = await supabaseAdmin
        .from('user_sanctions')
        .select('type, reason, created_at, expires_at')
        .eq('user_id', group.author_id)
        .order('created_at', { ascending: false });
      if (sanctionData) {
        sanctions = sanctionData;
      }
    }

    setSelectedReport({
      ...group,
      individual_reports: reports ?? [],
      sanctions,
    });
    setPanelLoading(false);
  }

  // ------------------------------------------------------------------
  // Apply sanction
  // ------------------------------------------------------------------

  async function handleApplySanction() {
    if (!selectedReport || !sanctionType || !sanctionReason.trim()) return;
    setActionLoading(true);

    const {
      data: { user },
    } = await supabaseBrowser.auth.getUser();

    await supabaseAdmin.from('user_sanctions').insert({
      user_id: selectedReport.author_id!,
      type: sanctionType,
      reason: sanctionReason.trim(),
      issued_by: user!.id,
      expires_at: computeExpiresAt(sanctionType),
    });

    // Update all reports for this target to actioned
    await supabaseAdmin
      .from('reports')
      .update({
        status: 'actioned',
        action_taken: sanctionType,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('target_type', selectedReport.target_type)
      .eq('target_id', selectedReport.target_id);

    setActionLoading(false);
    setFeedback('Sanction applied successfully');
    setSanctionType(null);
    setSanctionReason('');
    await fetchReports();

    // Re-fetch sanctions for updated display
    if (selectedReport.author_id) {
      const { data: sanctionData } = await supabaseAdmin
        .from('user_sanctions')
        .select('type, reason, created_at, expires_at')
        .eq('user_id', selectedReport.author_id)
        .order('created_at', { ascending: false });
      setSelectedReport((prev) =>
        prev ? { ...prev, status: 'actioned', sanctions: sanctionData ?? [] } : null
      );
    }
  }

  // ------------------------------------------------------------------
  // Delete content (soft delete)
  // ------------------------------------------------------------------

  async function handleDeleteContent() {
    if (!selectedReport) return;
    setActionLoading(true);

    const {
      data: { user },
    } = await supabaseBrowser.auth.getUser();

    const table =
      selectedReport.target_type === 'post' ? 'posts' : 'comments';
    await supabaseAdmin
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', selectedReport.target_id);

    // Update reports
    await supabaseAdmin
      .from('reports')
      .update({
        status: 'actioned',
        action_taken: 'deleted',
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('target_type', selectedReport.target_type)
      .eq('target_id', selectedReport.target_id);

    setActionLoading(false);
    setFeedback('Content has been deleted');
    await fetchReports();
    setSelectedReport((prev) =>
      prev ? { ...prev, status: 'actioned' } : null
    );
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div>
      <h1 className="text-[20px] font-semibold leading-[1.2] mb-6">
        Moderation
      </h1>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Latest Report</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportGroups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  <p className="font-medium">No pending reports</p>
                  <p className="text-sm mt-1">
                    All reports have been reviewed. Check back later.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              reportGroups.map((group) => (
                <TableRow
                  key={`${group.target_type}:${group.target_id}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openReport(group)}
                >
                  <TableCell>{getStatusBadge(group.status)}</TableCell>
                  <TableCell className="max-w-xs">
                    <span
                      className="truncate block text-sm"
                      style={{ maxWidth: 300 }}
                    >
                      {(group.content ?? 'Content unavailable').slice(0, 80)}
                      {(group.content?.length ?? 0) > 80 ? '...' : ''}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {group.target_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/40">
                      {group.report_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(group.latest_report_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReport(group);
                      }}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Side Panel */}
      <SidePanel
        open={selectedReport !== null}
        onClose={() => {
          setSelectedReport(null);
          setFeedback(null);
        }}
        title="Report Details"
      >
        {panelLoading ? (
          <p className="text-muted-foreground">Loading details...</p>
        ) : selectedReport ? (
          <div className="space-y-6">
            {/* Feedback */}
            {feedback && (
              <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-400">
                {feedback}
              </div>
            )}

            {/* Content Preview */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Reported Content ({selectedReport.target_type})
              </h3>
              <div className="rounded-lg border border-border bg-black/30 p-4 text-sm whitespace-pre-wrap">
                {selectedReport.content ?? 'Content unavailable'}
              </div>
            </div>

            {/* Individual Reports */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Reports ({selectedReport.individual_reports?.length ?? selectedReport.report_count})
              </h3>
              <div className="space-y-2">
                {(selectedReport.individual_reports ?? []).map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                  >
                    <Badge variant="outline" className="capitalize">
                      {r.reason}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Take Action */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Take Action</h3>

              {/* Sanction Type */}
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Sanction Type
                </label>
                <Select
                  value={sanctionType ?? ''}
                  onValueChange={(val: string | null) =>
                    setSanctionType((val ?? '') as SanctionType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select sanction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="7day_ban">7-Day Ban</SelectItem>
                    <SelectItem value="30day_ban">30-Day Ban</SelectItem>
                    <SelectItem value="permanent_ban">Permanent Ban</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Reason (required)
                </label>
                <Textarea
                  value={sanctionReason}
                  onChange={(e) => setSanctionReason(e.target.value)}
                  placeholder="Explain the reason for this sanction..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Apply Sanction */}
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        disabled={
                          !sanctionType ||
                          !sanctionReason.trim() ||
                          actionLoading
                        }
                        className="bg-[#00E5C3] text-black hover:bg-[#00E5C3]/80"
                      />
                    }
                  >
                    Apply Sanction
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apply Sanction</AlertDialogTitle>
                      <AlertDialogDescription>
                        Apply {sanctionType ? SANCTION_LABELS[sanctionType] : ''}{' '}
                        sanction to this user? They will be notified.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleApplySanction}>
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Delete Content */}
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="destructive"
                        disabled={actionLoading}
                      />
                    }
                  >
                    Delete Content
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Content</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this content? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={handleDeleteContent}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Sanction History */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Sanction History</h3>
              {(selectedReport.sanctions ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No previous sanctions for this user.
                </p>
              ) : (
                <div className="space-y-2">
                  {(selectedReport.sanctions ?? []).map((s, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge
                          className={
                            s.type === 'warning'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-red-500/20 text-red-400 border-red-500/40'
                          }
                        >
                          {SANCTION_LABELS[s.type as SanctionType] ?? s.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(s.created_at)}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{s.reason}</p>
                      {s.expires_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expires: {formatDate(s.expires_at)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-4">
                To appeal this sanction, contact support@wecord.app
              </p>
            </div>
          </div>
        ) : null}
      </SidePanel>
    </div>
  );
}
