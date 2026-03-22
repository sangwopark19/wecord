'use client';

import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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

interface Banner {
  id: string;
  image_url: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
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

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Create/edit form state
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formLinkUrl, setFormLinkUrl] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);

  async function fetchBanners() {
    const { data } = await supabaseAdmin
      .from('promotion_banners')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setBanners(data as Banner[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchBanners();
  }, []);

  function resetForm() {
    setFormImageUrl('');
    setFormLinkUrl('');
    setFormSortOrder(0);
    setFormIsActive(true);
    setEditingId(null);
    setShowCreateForm(false);
  }

  function startEdit(banner: Banner) {
    setFormImageUrl(banner.image_url);
    setFormLinkUrl(banner.link_url);
    setFormSortOrder(banner.sort_order);
    setFormIsActive(banner.is_active);
    setEditingId(banner.id);
    setShowCreateForm(true);
  }

  async function handleCreate() {
    if (!formImageUrl.trim() || !formLinkUrl.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabaseAdmin.from('promotion_banners').insert({
        image_url: formImageUrl.trim(),
        link_url: formLinkUrl.trim(),
        sort_order: formSortOrder,
        is_active: formIsActive,
      });
      if (error) throw error;
      resetForm();
      await fetchBanners();
    } catch (err) {
      console.error('Failed to create banner:', err);
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate() {
    if (!editingId || !formImageUrl.trim() || !formLinkUrl.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabaseAdmin
        .from('promotion_banners')
        .update({
          image_url: formImageUrl.trim(),
          link_url: formLinkUrl.trim(),
          sort_order: formSortOrder,
          is_active: formIsActive,
        })
        .eq('id', editingId);
      if (error) throw error;
      resetForm();
      await fetchBanners();
    } catch (err) {
      console.error('Failed to update banner:', err);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(banner: Banner) {
    const newActive = !banner.is_active;
    await supabaseAdmin
      .from('promotion_banners')
      .update({ is_active: newActive })
      .eq('id', banner.id);
    setBanners((prev) =>
      prev.map((b) => (b.id === banner.id ? { ...b, is_active: newActive } : b))
    );
  }

  async function handleDelete(id: string) {
    await supabaseAdmin.from('promotion_banners').delete().eq('id', id);
    setBanners((prev) => prev.filter((b) => b.id !== id));
    setDeletingId(null);
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold leading-[1.2]">Banners</h1>
        <Button
          onClick={() => {
            if (showCreateForm) {
              resetForm();
            } else {
              setShowCreateForm(true);
            }
          }}
        >
          Create Banner
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-6 p-4 rounded-lg border border-border space-y-4">
          <h2 className="text-base font-medium">
            {editingId ? 'Edit Banner' : 'New Banner'}
          </h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL *</label>
            <Input
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              placeholder="https://example.com/banner.jpg"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Link URL *</label>
            <Input
              value={formLinkUrl}
              onChange={(e) => setFormLinkUrl(e.target.value)}
              placeholder="https://example.com/target"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Order</label>
              <Input
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
                id="form-active-switch"
              />
              <label
                htmlFor="form-active-switch"
                className="text-sm font-medium cursor-pointer"
              >
                Active
              </label>
            </div>
          </div>
          {formImageUrl.trim() && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview</label>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formImageUrl}
                alt="Banner preview"
                className="w-full max-w-md h-24 object-cover rounded-lg border border-border"
              />
            </div>
          )}
          <div className="flex gap-3">
            <Button
              onClick={editingId ? handleUpdate : handleCreate}
              disabled={creating}
            >
              {creating
                ? 'Saving...'
                : editingId
                  ? 'Save Changes'
                  : 'Create'}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Link URL</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No banners found.
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.image_url}
                      alt="Banner"
                      className="w-24 h-12 object-cover rounded border border-border"
                    />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <a
                      href={banner.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:underline truncate block"
                      style={{ maxWidth: 200 }}
                    >
                      {banner.link_url}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={banner.is_active}
                      onCheckedChange={() => handleToggleActive(banner)}
                    />
                  </TableCell>
                  <TableCell>{banner.sort_order}</TableCell>
                  <TableCell>{formatDate(banner.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(banner)}
                      >
                        Edit
                      </Button>
                      <AlertDialog
                        open={deletingId === banner.id}
                        onOpenChange={(open) => {
                          if (!open) setDeletingId(null);
                        }}
                      >
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingId(banner.id)}
                            />
                          }
                        >
                          Delete
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this banner?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDelete(banner.id)}
                            >
                              Delete Banner
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
