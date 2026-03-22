'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface CreatorMemberData {
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

interface ArtistMember {
  id: string;
  community_id: string;
  user_id: string | null;
  display_name: string;
  profile_image_url: string | null;
  position: string | null;
  sort_order: number;
  created_at: string;
}

interface Community {
  id: string;
  name: string;
  type: 'solo' | 'group';
}

interface OtherMembership {
  id: string;
  community_id: string;
  role: string;
}

function formatDate(dt: string | null): string {
  if (!dt) return '-';
  return new Date(dt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function CreatorDetailPage() {
  const params = useParams<{ id: string }>();
  const memberId = params.id;

  const [creator, setCreator] = useState<CreatorMemberData | null>(null);
  const [artistMembers, setArtistMembers] = useState<ArtistMember[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [otherMemberships, setOtherMemberships] = useState<OtherMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingArtistId, setRemovingArtistId] = useState<string | null>(null);

  // Register artist member form
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerCommunityId, setRegisterCommunityId] = useState('');
  const [registerDisplayName, setRegisterDisplayName] = useState('');
  const [registerPosition, setRegisterPosition] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: creatorData } = await supabaseAdmin
        .from('community_members')
        .select('id, user_id, community_id, community_nickname, role, joined_at, profiles(nickname, avatar_url)')
        .eq('id', memberId)
        .single();

      if (!creatorData) {
        setLoading(false);
        return;
      }

      // Supabase returns profiles as array from join; normalize to single object
      const raw = creatorData as unknown as Record<string, unknown>;
      const profilesArr = raw.profiles as Array<{ nickname: string; avatar_url: string | null }> | null;
      const typed: CreatorMemberData = {
        ...(raw as unknown as CreatorMemberData),
        profiles: profilesArr?.[0] ?? null,
      };
      setCreator(typed);

      const [artistRes, communitiesRes, membershipsRes] = await Promise.all([
        supabaseAdmin
          .from('artist_members')
          .select('*')
          .eq('user_id', typed.user_id)
          .order('created_at', { ascending: false }),
        supabaseAdmin.from('communities').select('id, name, type').order('name'),
        supabaseAdmin
          .from('community_members')
          .select('id, community_id, role')
          .eq('user_id', typed.user_id),
      ]);

      if (artistRes.data) setArtistMembers(artistRes.data as ArtistMember[]);
      if (communitiesRes.data) setCommunities(communitiesRes.data as Community[]);
      if (membershipsRes.data) setOtherMemberships(membershipsRes.data as OtherMembership[]);
      setLoading(false);
    }
    loadData();
  }, [memberId]);

  function getCommunityName(communityId: string): string {
    return communities.find((c) => c.id === communityId)?.name ?? communityId;
  }

  async function handleRegisterArtist() {
    if (!registerCommunityId || !registerDisplayName.trim() || !creator) return;
    setRegistering(true);
    try {
      const { error } = await supabaseAdmin.from('artist_members').insert({
        community_id: registerCommunityId,
        user_id: creator.user_id,
        display_name: registerDisplayName.trim(),
        position: registerPosition.trim() || null,
      });
      if (error) throw error;

      setShowRegisterForm(false);
      setRegisterCommunityId('');
      setRegisterDisplayName('');
      setRegisterPosition('');

      // Refresh artist members
      const { data } = await supabaseAdmin
        .from('artist_members')
        .select('*')
        .eq('user_id', creator.user_id)
        .order('created_at', { ascending: false });
      if (data) setArtistMembers(data as ArtistMember[]);
    } catch (err) {
      console.error('Failed to register artist member:', err);
    } finally {
      setRegistering(false);
    }
  }

  async function handleRemoveArtist(artistId: string) {
    await supabaseAdmin.from('artist_members').delete().eq('id', artistId);
    setArtistMembers((prev) => prev.filter((a) => a.id !== artistId));
    setRemovingArtistId(null);
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (!creator) {
    return <p className="text-muted-foreground">Creator not found.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/creators">
          <Button variant="ghost" size="sm">
            &larr; Back to List
          </Button>
        </Link>
        <h1 className="text-xl font-semibold leading-[1.2]">
          Creator: {creator.profiles?.nickname ?? creator.community_nickname}
        </h1>
      </div>

      {/* Profile info */}
      <div className="mb-8 p-4 rounded-lg border border-border space-y-2">
        <h2 className="text-base font-medium">Profile</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Global Nickname:</span>{' '}
            {creator.profiles?.nickname ?? '-'}
          </div>
          <div>
            <span className="text-muted-foreground">Community Nickname:</span>{' '}
            {creator.community_nickname}
          </div>
          <div>
            <span className="text-muted-foreground">Community:</span>{' '}
            {getCommunityName(creator.community_id)}
          </div>
          <div>
            <span className="text-muted-foreground">Joined:</span>{' '}
            {formatDate(creator.joined_at)}
          </div>
        </div>
      </div>

      {/* Community assignments */}
      <div className="mb-8">
        <h2 className="text-base font-medium mb-4">Community Memberships</h2>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Community</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {otherMemberships.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{getCommunityName(m.community_id)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={m.role === 'creator' ? 'default' : 'outline'}
                    >
                      {m.role}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Artist member registrations */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium">Artist Member Registrations</h2>
          <Button
            size="sm"
            onClick={() => {
              setShowRegisterForm(!showRegisterForm);
              setRegisterDisplayName(creator.community_nickname);
            }}
          >
            Register as Artist Member
          </Button>
        </div>

        {showRegisterForm && (
          <div className="mb-4 p-4 rounded-lg border border-border space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Community</label>
              <Select
                value={registerCommunityId}
                onValueChange={(v) => setRegisterCommunityId(v ?? '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select community" />
                </SelectTrigger>
                <SelectContent>
                  {communities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={registerDisplayName}
                onChange={(e) => setRegisterDisplayName(e.target.value)}
                placeholder="Artist display name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Position (optional)</label>
              <Input
                value={registerPosition}
                onChange={(e) => setRegisterPosition(e.target.value)}
                placeholder="e.g. Vocalist, Illustrator"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRegisterArtist}
                disabled={registering || !registerCommunityId || !registerDisplayName.trim()}
              >
                {registering ? 'Registering...' : 'Register'}
              </Button>
              <Button variant="outline" onClick={() => setShowRegisterForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead>Community</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artistMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No artist member registrations.
                  </TableCell>
                </TableRow>
              ) : (
                artistMembers.map((am) => (
                  <TableRow key={am.id}>
                    <TableCell className="font-medium">
                      {am.display_name}
                    </TableCell>
                    <TableCell>{getCommunityName(am.community_id)}</TableCell>
                    <TableCell>{am.position ?? '-'}</TableCell>
                    <TableCell>{formatDate(am.created_at)}</TableCell>
                    <TableCell>
                      <AlertDialog
                        open={removingArtistId === am.id}
                        onOpenChange={(open) => {
                          if (!open) setRemovingArtistId(null);
                        }}
                      >
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setRemovingArtistId(am.id)}
                            />
                          }
                        >
                          Remove
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove Artist Member
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Remove &quot;{am.display_name}&quot; from artist members?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleRemoveArtist(am.id)}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
