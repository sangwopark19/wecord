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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  type: 'solo' | 'group';
  category: string | null;
  member_count: number;
  created_at: string;
}

function formatDate(dt: string | null): string {
  if (!dt) return '-';
  return new Date(dt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<'solo' | 'group'>('solo');
  const [newCoverImageUrl, setNewCoverImageUrl] = useState('');

  async function fetchCommunities() {
    const { data } = await supabaseAdmin
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCommunities(data as Community[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchCommunities();
  }, []);

  async function handleCreate() {
    if (!newName.trim() || !newSlug.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabaseAdmin.from('communities').insert({
        name: newName.trim(),
        slug: newSlug.trim(),
        description: newDescription.trim() || null,
        type: newType,
        cover_image_url: newCoverImageUrl.trim() || null,
      });
      if (error) throw error;
      setNewName('');
      setNewSlug('');
      setNewDescription('');
      setNewType('solo');
      setNewCoverImageUrl('');
      setShowCreateForm(false);
      await fetchCommunities();
    } catch (err) {
      console.error('Failed to create community:', err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    await supabaseAdmin.from('communities').delete().eq('id', id);
    setCommunities((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold leading-[1.2]">Communities</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          Create Community
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-6 p-4 rounded-lg border border-border space-y-4">
          <h2 className="text-base font-medium">New Community</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setNewSlug(generateSlug(e.target.value));
                }}
                placeholder="Community name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug *</label>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="community-slug"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Community description"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={newType}
                onValueChange={(v) => setNewType((v ?? 'solo') as 'solo' | 'group')}
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
                value={newCoverImageUrl}
                onChange={(e) => setNewCoverImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {communities.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No communities found.
                </TableCell>
              </TableRow>
            ) : (
              communities.map((community) => (
                <TableRow key={community.id}>
                  <TableCell className="font-medium">
                    {community.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {community.slug}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={community.type === 'group' ? 'default' : 'outline'}
                    >
                      {community.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{community.member_count}</TableCell>
                  <TableCell>{formatDate(community.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/communities/${community.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <AlertDialog
                        open={deletingId === community.id}
                        onOpenChange={(open) => {
                          if (!open) setDeletingId(null);
                        }}
                      >
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingId(community.id)}
                            />
                          }
                        >
                          Delete
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Community
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{community.name}&quot;?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDelete(community.id)}
                            >
                              Delete Community
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
