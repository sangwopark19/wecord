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

interface CreatorMember {
  id: string;
  user_id: string;
  community_id: string;
  community_nickname: string;
  role: string;
  joined_at: string;
  profiles: {
    nickname: string;
    avatar_url: string | null;
  } | null;
}

interface Community {
  id: string;
  name: string;
}

interface ProfileSearchResult {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
}

function formatDate(dt: string | null): string {
  if (!dt) return '-';
  return new Date(dt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<CreatorMember[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Add creator form
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileSearchResult[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [adding, setAdding] = useState(false);

  async function fetchData() {
    const [creatorsRes, communitiesRes] = await Promise.all([
      supabaseAdmin
        .from('community_members')
        .select('id, user_id, community_id, community_nickname, role, joined_at, profiles(nickname, avatar_url)')
        .eq('role', 'creator')
        .order('joined_at', { ascending: false }),
      supabaseAdmin.from('communities').select('id, name').order('name'),
    ]);
    if (creatorsRes.data) {
      // Supabase returns profiles as array from join; normalize to single object
      const normalized = (creatorsRes.data as unknown[]).map((item: unknown) => {
        const row = item as Record<string, unknown>;
        const profilesArr = row.profiles as Array<{ nickname: string; avatar_url: string | null }> | null;
        return {
          ...row,
          profiles: profilesArr?.[0] ?? null,
        } as CreatorMember;
      });
      setCreators(normalized);
    }
    if (communitiesRes.data) setCommunities(communitiesRes.data as Community[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function getCommunityName(communityId: string): string {
    return communities.find((c) => c.id === communityId)?.name ?? communityId;
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('user_id, nickname, avatar_url')
      .ilike('nickname', `%${searchQuery.trim()}%`)
      .limit(10);
    if (data) setSearchResults(data as ProfileSearchResult[]);
  }

  async function handleAddCreator() {
    if (!selectedUserId || !selectedCommunityId) return;
    setAdding(true);
    try {
      // Check if already a member
      const { data: existing } = await supabaseAdmin
        .from('community_members')
        .select('id, role')
        .eq('user_id', selectedUserId)
        .eq('community_id', selectedCommunityId)
        .single();

      if (existing) {
        // Update existing membership to creator role
        await supabaseAdmin
          .from('community_members')
          .update({ role: 'creator' })
          .eq('id', existing.id);
      } else {
        // Insert new membership with creator role
        const selectedProfile = searchResults.find((p) => p.user_id === selectedUserId);
        await supabaseAdmin.from('community_members').insert({
          user_id: selectedUserId,
          community_id: selectedCommunityId,
          community_nickname: selectedProfile?.nickname ?? 'Creator',
          role: 'creator',
        });
      }

      setShowAddForm(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUserId('');
      setSelectedCommunityId('');
      await fetchData();
    } catch (err) {
      console.error('Failed to add creator:', err);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveCreator(memberId: string) {
    await supabaseAdmin
      .from('community_members')
      .update({ role: 'member' })
      .eq('id', memberId);
    setCreators((prev) => prev.filter((c) => c.id !== memberId));
    setRemovingId(null);
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold leading-[1.2]">Creators</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          Add Creator
        </Button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 rounded-lg border border-border space-y-4">
          <h2 className="text-base font-medium">Add Creator</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">Search User by Nickname</label>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by nickname..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select User</label>
              <Select
                value={selectedUserId}
                onValueChange={(v) => setSelectedUserId(v ?? '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {searchResults.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.nickname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Community</label>
            <Select
              value={selectedCommunityId}
              onValueChange={(v) => setSelectedCommunityId(v ?? '')}
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
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAddCreator}
              disabled={adding || !selectedUserId || !selectedCommunityId}
            >
              {adding ? 'Adding...' : 'Add as Creator'}
            </Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nickname</TableHead>
              <TableHead>Community Nickname</TableHead>
              <TableHead>Community</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creators.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No creators found.
                </TableCell>
              </TableRow>
            ) : (
              creators.map((creator) => (
                <TableRow key={creator.id}>
                  <TableCell className="font-medium">
                    {creator.profiles?.nickname ?? '-'}
                  </TableCell>
                  <TableCell>{creator.community_nickname}</TableCell>
                  <TableCell>
                    {getCommunityName(creator.community_id)}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/40">
                      Creator
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(creator.joined_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/creators/${creator.id}`}>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </Link>
                      <AlertDialog
                        open={removingId === creator.id}
                        onOpenChange={(open) => {
                          if (!open) setRemovingId(null);
                        }}
                      >
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setRemovingId(creator.id)}
                            />
                          }
                        >
                          Remove
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove Creator Role
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will change the role back to member.
                              The user will remain in the community.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleRemoveCreator(creator.id)}
                            >
                              Remove Creator
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
