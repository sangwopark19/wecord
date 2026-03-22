'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface MemberRow {
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
  type: 'solo' | 'group';
}

interface Stats {
  total: number;
  memberCount: number;
  creatorCount: number;
  adminCount: number;
  activeCount: number;
}

function formatDate(dt: string | null): string {
  if (!dt) return '-';
  return new Date(dt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  creator: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  member: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
};

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    memberCount: 0,
    creatorCount: 0,
    adminCount: 0,
    activeCount: 0,
  });
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    let query = supabaseAdmin
      .from('community_members')
      .select('id, user_id, community_id, community_nickname, role, joined_at, profiles(nickname, avatar_url)')
      .order('joined_at', { ascending: false })
      .limit(50);

    if (selectedCommunity) {
      query = query.eq('community_id', selectedCommunity);
    }

    const { data } = await query;
    if (data) {
      // Normalize profiles from array to single object
      const normalized = (data as unknown[]).map((item: unknown) => {
        const row = item as Record<string, unknown>;
        const profilesArr = row.profiles as Array<{ nickname: string; avatar_url: string | null }> | null;
        return {
          ...row,
          profiles: profilesArr?.[0] ?? null,
        } as MemberRow;
      });

      // Filter by search query (client-side for nickname search)
      const filtered = searchQuery.trim()
        ? normalized.filter(
            (m) =>
              m.community_nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (m.profiles?.nickname ?? '').toLowerCase().includes(searchQuery.toLowerCase())
          )
        : normalized;

      setMembers(filtered);

      // Compute stats
      const total = filtered.length;
      const memberCount = filtered.filter((m) => m.role === 'member').length;
      const creatorCount = filtered.filter((m) => m.role === 'creator').length;
      const adminCount = filtered.filter((m) => m.role === 'admin').length;

      setStats({ total, memberCount, creatorCount, adminCount, activeCount: 0 });
    }
    setLoading(false);
  }, [selectedCommunity, searchQuery]);

  useEffect(() => {
    supabaseAdmin
      .from('communities')
      .select('id, name, type')
      .order('name')
      .then(({ data }) => {
        if (data) setCommunities(data as Community[]);
      });
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Fetch active members count (posted in last 7 days)
  useEffect(() => {
    async function fetchActiveCount() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      let query = supabaseAdmin
        .from('posts')
        .select('author_id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo);

      if (selectedCommunity) {
        query = query.eq('community_id', selectedCommunity);
      }

      const { count } = await query;
      setStats((prev) => ({ ...prev, activeCount: count ?? 0 }));
    }
    fetchActiveCount();
  }, [selectedCommunity]);

  function getCommunityName(communityId: string): string {
    return communities.find((c) => c.id === communityId)?.name ?? communityId;
  }

  function getCommunityType(communityId: string): string {
    return communities.find((c) => c.id === communityId)?.type ?? 'solo';
  }

  async function handleRegisterArtist(member: MemberRow) {
    setRegisteringId(member.id);
    try {
      const { error } = await supabaseAdmin.from('artist_members').insert({
        community_id: member.community_id,
        user_id: member.user_id,
        display_name: member.community_nickname,
      });
      if (error) throw error;
      setRegisteringId(null);
    } catch (err) {
      console.error('Failed to register artist member:', err);
      setRegisteringId(null);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold leading-[1.2] mb-6">Members</h1>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="p-3 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">Total Members</p>
          <p className="text-xl font-semibold">{stats.total}</p>
        </div>
        <div className="p-3 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">Members</p>
          <p className="text-xl font-semibold">{stats.memberCount}</p>
        </div>
        <div className="p-3 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">Creators</p>
          <p className="text-xl font-semibold">{stats.creatorCount}</p>
        </div>
        <div className="p-3 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">Admins</p>
          <p className="text-xl font-semibold">{stats.adminCount}</p>
        </div>
        <div className="p-3 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">Active (7d)</p>
          <p className="text-xl font-semibold">{stats.activeCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="w-64">
          <Select
            value={selectedCommunity}
            onValueChange={(v) => setSelectedCommunity(v ?? '')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Communities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Communities</SelectItem>
              {communities.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by nickname..."
          className="w-64"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nickname</TableHead>
                <TableHead>Community</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No members found.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div>
                        <span>{member.community_nickname}</span>
                        {member.profiles?.nickname && member.profiles.nickname !== member.community_nickname && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({member.profiles.nickname})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCommunityName(member.community_id)}
                    </TableCell>
                    <TableCell>
                      <Badge className={ROLE_BADGE_STYLES[member.role] ?? ''}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(member.joined_at)}</TableCell>
                    <TableCell>
                      {member.role === 'creator' &&
                        getCommunityType(member.community_id) === 'group' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={registeringId === member.id}
                            onClick={() => handleRegisterArtist(member)}
                          >
                            {registeringId === member.id
                              ? 'Registering...'
                              : 'Register Artist Member'}
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
