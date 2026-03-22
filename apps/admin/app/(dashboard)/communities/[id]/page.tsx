'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CommunityData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  type: 'solo' | 'group';
  category: string | null;
  member_count: number;
}

export default function EditCommunityPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const communityId = params.id;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'solo' | 'group'>('solo');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCommunity() {
      const { data } = await supabaseAdmin
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single();
      if (data) {
        const c = data as CommunityData;
        setName(c.name);
        setSlug(c.slug);
        setDescription(c.description ?? '');
        setType(c.type);
        setCoverImageUrl(c.cover_image_url ?? '');
      }
      setLoading(false);
    }
    loadCommunity();
  }, [communityId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const { error: updateError } = await supabaseAdmin
        .from('communities')
        .update({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          type,
          cover_image_url: coverImageUrl.trim() || null,
        })
        .eq('id', communityId);
      if (updateError) throw updateError;
      router.push('/communities');
    } catch (err) {
      console.error('Failed to update community:', err);
      setError('Failed to update community. Please try again.');
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
        <Link href="/communities">
          <Button variant="ghost" size="sm">
            &larr; Back to List
          </Button>
        </Link>
        <h1 className="text-xl font-semibold leading-[1.2]">
          Edit Community: {name}
        </h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Community name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Slug *</label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="community-slug"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Community description"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <Select
            value={type}
            onValueChange={(v) => setType((v ?? 'solo') as 'solo' | 'group')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solo">Solo</SelectItem>
              <SelectItem value="group">Group</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cover Image URL</label>
          <Input
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href="/communities">
            <Button type="button" variant="outline">
              Discard Changes
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
