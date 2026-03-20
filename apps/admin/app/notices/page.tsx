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
  if (notice.scheduled_at != null && notice.published_at == null) return 'scheduled';
  return 'draft';
}

function formatDateTime(dt: string | null): string {
  if (!dt) return '-';
  return new Date(dt).toLocaleString('ko-KR', {
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
        .select('id, title, community_id, is_pinned, scheduled_at, published_at, created_at')
        .order('created_at', { ascending: false }),
      supabaseAdmin.from('communities').select('id, name'),
    ]);
    if (noticesRes.data) setNotices(noticesRes.data as Notice[]);
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
    return (
      <main className="p-8">
        <p className="text-muted-foreground">불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">공지 관리</h1>
        <Link href="/notices/new">
          <Button>새 공지 작성</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>커뮤니티</TableHead>
              <TableHead>고정</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>발행일시</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  공지가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              notices.map((notice) => {
                const status = getStatus(notice);
                return (
                  <TableRow key={notice.id}>
                    <TableCell className="max-w-xs">
                      <span className="truncate block" style={{ maxWidth: 300 }}>
                        {notice.title.slice(0, 50)}
                        {notice.title.length > 50 ? '...' : ''}
                      </span>
                    </TableCell>
                    <TableCell>{getCommunityName(notice.community_id)}</TableCell>
                    <TableCell>
                      {notice.is_pinned && (
                        <Badge variant="outline">고정</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {status === 'published' && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/40">
                          발행됨
                        </Badge>
                      )}
                      {status === 'scheduled' && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
                          예약됨
                        </Badge>
                      )}
                      {status === 'draft' && (
                        <Badge variant="secondary">초안</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDateTime(notice.published_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/notices/${notice.id}`}>
                          <Button variant="outline" size="sm">
                            수정
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
                            삭제
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>공지 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                이 공지를 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleDelete(notice.id)}
                              >
                                공지 삭제
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
    </main>
  );
}
