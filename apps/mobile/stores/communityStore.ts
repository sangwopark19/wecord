import { create } from 'zustand';

interface CommunityState {
  activeCommunityId: string | null;
  activeCommunityType: 'solo' | 'group' | null;
  selectedArtistMemberId: string | null;
  setActiveCommunity: (id: string, type: 'solo' | 'group') => void;
  setSelectedArtistMember: (id: string | null) => void;
  clearCommunity: () => void;
}

export const useCommunityStore = create<CommunityState>((set) => ({
  activeCommunityId: null,
  activeCommunityType: null,
  selectedArtistMemberId: null,

  setActiveCommunity: (id, type) => {
    set({ activeCommunityId: id, activeCommunityType: type });
  },

  setSelectedArtistMember: (id) => {
    set({ selectedArtistMemberId: id });
  },

  clearCommunity: () => {
    set({
      activeCommunityId: null,
      activeCommunityType: null,
      selectedArtistMemberId: null,
    });
  },
}));
