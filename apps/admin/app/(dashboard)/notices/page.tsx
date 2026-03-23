'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
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

interface Notice {
  id: string;
  title: string;
  community_id: string;
  is_pinned: boolean;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
}

interface Community {
  id: string;
  name: string;
}

function getStatus(notice: Notice): 'published' | 'scheduled' | 'draft' {
  if (notice.published_at != null) return 'published';
  if (notice.scheduled_at != null && notice.published_at == null)
    return 'scheduled';
  return 'draft';
}

function formatDateTime(dt: string | null): string {
  if (!dt) return '-';
  return new Date(dt).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchData() {
    const [noticesRes, communitiesRes] = await Promise.all([
      supabaseAdmin
        .from('notices')
        .select(
          'id, title, community_id, is_pinned, scheduled_at, published_at, created_at'
        )
        .order('created_at', { ascending: false }),
      supabaseAdmin.from('communities').select('id, name'),
    ]);

    let fetchedNotices = (noticesRes.data ?? []) as Notice[];

    // Auto-publish scheduled notices whose scheduled_at is in the past
    const now = new Date().toISOString();
    const pastScheduled = fetchedNotices.filter(
      (n) => n.scheduled_at && !n.published_at && n.scheduled_at <= now
    );
    if (pastScheduled.length > 0) {
      const ids = pastScheduled.map((n) => n.id);
      await supabaseAdmin
        .from('notices')
        .update({ published_at: now })
        .in('id', ids);
      fetchedNotices = fetchedNotices.map((n) =>
        ids.includes(n.id) ? { ...n, published_at: now } : n
      );
    }

    setNotices(fetchedNotices);
    if (communitiesRes.data) setCommunities(communitiesRes.data as Community[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function getCommunityName(communityId: string): string {
    return communities.find((c) => c.id === communityId)?.name ?? communityId;
  }

  async function handleDelete(noticeId: string) {
    await supabaseAdmin.from('notices').delete().eq('id', noticeId);
    setNotices((prev) => prev.filter((n) => n.id !== noticeId));
    setDeletingId(null);
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold leading-[1.2]">Notices</h1>
        <Link href="/notices/new">
          <Button>Create Notice</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Community</TableHead>
              <TableHead>Pinned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No notices found.
                </TableCell>
              </TableRow>
            ) : (
              notices.map((notice) => {
                const status = getStatus(notice);
                return (
                  <TableRow key={notice.id}>
                    <TableCell className="max-w-xs">
                      <span
                        className="truncate block"
                        style={{ maxWidth: 300 }}
                      >
                        {notice.title.slice(0, 50)}
                        {notice.title.length > 50 ? '...' : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getCommunityName(notice.community_id)}
                    </TableCell>
                    <TableCell>
                      {notice.is_pinned && (
                        <Badge variant="outline">Pinned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {status === 'published' && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/40">
                          Published
                        </Badge>
                      )}
                      {status === 'scheduled' && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
                          Scheduled
                        </Badge>
                      )}
                      {status === 'draft' && (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDateTime(notice.published_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/notices/${notice.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <AlertDialog
                          open={deletingId === notice.id}
                          onOpenChange={(open) => {
                            if (!open) setDeletingId(null);
                          }}
                        >
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeletingId(notice.id)}
                              />
                            }
                          >
                            Delete
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Notice</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this notice?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleDelete(notice.id)}
                              >
                                Delete Notice
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
