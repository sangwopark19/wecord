'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

interface NoticeData {
  id: string;
  community_id: string;
  author_id: string;
  title: string;
  content: string;
  media_urls: string[] | null;
  is_pinned: boolean;
  scheduled_at: string | null;
  published_at: string | null;
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return '';
  // Convert ISO to datetime-local format (YYYY-MM-DDTHH:mm)
  return iso.slice(0, 16);
}

export default function EditNoticePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const noticeId = params.id;

  const [communities, setCommunities] = useState<Community[]>([]);
  const [communityId, setCommunityId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);
  const [isAlreadyPublished, setIsAlreadyPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      const [noticeRes, communitiesRes] = await Promise.all([
        supabaseAdmin.from('notices').select('*').eq('id', noticeId).single(),
        supabaseAdmin.from('communities').select('id, name').order('name'),
      ]);

      if (communitiesRes.data)
        setCommunities(communitiesRes.data as Community[]);

      if (noticeRes.data) {
        const n = noticeRes.data as NoticeData;
        setCommunityId(n.community_id);
        setTitle(n.title);
        setBody(n.content);
        setIsPinned(n.is_pinned);
        setExistingMediaUrls(n.media_urls ?? []);
        setIsAlreadyPublished(n.published_at != null);
        if (n.scheduled_at) {
          setIsScheduled(true);
          setScheduledAt(toDatetimeLocalValue(n.scheduled_at));
        }
      }
      setLoading(false);
    }
    loadData();
  }, [noticeId]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!communityId) newErrors.community = 'Please select a community';
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!body.trim()) newErrors.body = 'Content is required';
    if (isScheduled && !scheduledAt)
      newErrors.scheduledAt = 'Scheduled date is required';
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
      const newUrls = imageFiles.length > 0 ? await uploadImages() : [];
      const allUrls = [...existingMediaUrls, ...newUrls];

      const updateData = {
        community_id: communityId,
        title: title.trim(),
        content: body.trim(),
        media_urls: allUrls.length > 0 ? allUrls : null,
        is_pinned: isPinned,
        scheduled_at: isScheduled ? scheduledAt : null,
      };

      const { error } = await supabaseAdmin
        .from('notices')
        .update(updateData)
        .eq('id', noticeId);
      if (error) throw error;

      router.push('/notices');
    } catch (err) {
      console.error('Failed to update notice:', err);
      setErrors({ submit: 'Failed to update notice. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/notices">
          <Button variant="ghost" size="sm">
            &larr; Back to List
          </Button>
        </Link>
        <h1 className="text-xl font-semibold leading-[1.2]">Edit Notice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Community */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Community</label>
          <Select
            value={communityId}
            onValueChange={(v) => setCommunityId(v ?? '')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select community" />
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
          <label className="text-sm font-medium">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notice title"
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
        </div>

        {/* Body */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Content</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notice content"
            rows={8}
          />
          {errors.body && (
            <p className="text-sm text-destructive">{errors.body}</p>
          )}
        </div>

        {/* Existing images */}
        {existingMediaUrls.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Existing Images</label>
            <div className="flex flex-wrap gap-2">
              {existingMediaUrls.map((url, i) => (
                <div key={i} className="relative">
                  <img
                    src={url}
                    alt={`Image ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New images */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Add New Images (optional)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) =>
              setImageFiles(Array.from(e.target.files ?? []))
            }
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer"
          />
          {imageFiles.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {imageFiles.length} selected
            </p>
          )}
        </div>

        {/* Pin toggle */}
        <div className="flex items-center gap-3">
          <Switch
            checked={isPinned}
            onCheckedChange={setIsPinned}
            id="pin-switch"
          />
          <label
            htmlFor="pin-switch"
            className="text-sm font-medium cursor-pointer"
          >
            Pin Notice
          </label>
        </div>

        {/* Schedule toggle */}
        {!isAlreadyPublished && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch
                checked={isScheduled}
                onCheckedChange={setIsScheduled}
                id="schedule-switch"
              />
              <label
                htmlFor="schedule-switch"
                className="text-sm font-medium cursor-pointer"
              >
                Schedule Publication
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
                  <p className="text-sm text-destructive">
                    {errors.scheduledAt}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {errors.submit && (
          <p className="text-sm text-destructive">{errors.submit}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting
              ? 'Saving...'
              : isAlreadyPublished
                ? 'Save Changes'
                : isScheduled
                  ? 'Schedule Notice'
                  : 'Publish Notice'}
          </Button>
          <Link href="/notices">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
