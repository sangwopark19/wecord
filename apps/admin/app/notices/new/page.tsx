'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Community {
  id: string;
  name: string;
}

export default function NewNoticePage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communityId, setCommunityId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadCommunities() {
      const { data } = await supabaseAdmin.from('communities').select('id, name').order('name');
      if (data) setCommunities(data as Community[]);
    }
    loadCommunities();
  }, []);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!communityId) newErrors.community = '커뮤니티를 선택해주세요';
    if (!title.trim()) newErrors.title = '제목을 입력해주세요';
    if (!body.trim()) newErrors.body = '내용을 입력해주세요';
    if (isScheduled && !scheduledAt) newErrors.scheduledAt = '예약 발행 일시를 입력해주세요';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function uploadImages(): Promise<string[]> {
    const urls: string[] = [];
    for (const file of imageFiles) {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabaseAdmin.storage
        .from('notice-images')
        .upload(fileName, file);
      if (!error && data) {
        const { data: urlData } = supabaseAdmin.storage
          .from('notice-images')
          .getPublicUrl(data.path);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const uploadedUrls = imageFiles.length > 0 ? await uploadImages() : [];

      const insertData = {
        community_id: communityId,
        author_id: '00000000-0000-0000-0000-000000000000', // admin placeholder
        title: title.trim(),
        content: body.trim(),
        media_urls: uploadedUrls.length > 0 ? uploadedUrls : null,
        is_pinned: isPinned,
        scheduled_at: isScheduled ? scheduledAt : null,
        published_at: isScheduled ? null : new Date().toISOString(),
      };

      const { error } = await supabaseAdmin.from('notices').insert(insertData);
      if (error) throw error;

      router.push('/notices');
    } catch (err) {
      console.error('Failed to create notice:', err);
      setErrors({ submit: '공지 발행에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/notices">
          <Button variant="ghost" size="sm">← 목록으로</Button>
        </Link>
        <h1 className="text-2xl font-bold">새 공지 작성</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Community */}
        <div className="space-y-2">
          <label className="text-sm font-medium">커뮤니티</label>
          <Select value={communityId} onValueChange={(v) => setCommunityId(v ?? '')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="커뮤니티 선택" />
            </SelectTrigger>
            <SelectContent>
              {communities.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.community && (
            <p className="text-sm text-destructive">{errors.community}</p>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium">제목</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="공지 제목"
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
        </div>

        {/* Body */}
        <div className="space-y-2">
          <label className="text-sm font-medium">내용</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="공지 내용"
            rows={8}
          />
          {errors.body && (
            <p className="text-sm text-destructive">{errors.body}</p>
          )}
        </div>

        {/* Images */}
        <div className="space-y-2">
          <label className="text-sm font-medium">이미지 (선택)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer"
          />
          {imageFiles.length > 0 && (
            <p className="text-xs text-muted-foreground">{imageFiles.length}개 선택됨</p>
          )}
        </div>

        {/* Pin toggle */}
        <div className="flex items-center gap-3">
          <Switch
            checked={isPinned}
            onCheckedChange={setIsPinned}
            id="pin-switch"
          />
          <label htmlFor="pin-switch" className="text-sm font-medium cursor-pointer">
            고정 공지
          </label>
        </div>

        {/* Schedule toggle */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              checked={isScheduled}
              onCheckedChange={setIsScheduled}
              id="schedule-switch"
            />
            <label htmlFor="schedule-switch" className="text-sm font-medium cursor-pointer">
              예약 발행
            </label>
          </div>
          {isScheduled && (
            <div className="space-y-2">
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              {errors.scheduledAt && (
                <p className="text-sm text-destructive">{errors.scheduledAt}</p>
              )}
            </div>
          )}
        </div>

        {errors.submit && (
          <p className="text-sm text-destructive">{errors.submit}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? '발행 중...' : isScheduled ? '예약 발행' : '공지 발행'}
          </Button>
          <Link href="/notices">
            <Button type="button" variant="outline">
              취소
            </Button>
          </Link>
        </div>
      </form>
    </main>
  );
}
