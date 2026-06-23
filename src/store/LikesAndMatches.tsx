import { Like, Match } from '@/types/likingAndMatching';
import { create } from 'zustand';

type LikesAndMatchesStore = {
    likes: Like[]
    matches: Match[]
    setLikes: (likes: Like[]) => void
    setMatches: (matches: Match[]) => void
};

const useLikesAndMatchesStore = create<LikesAndMatchesStore>((set) => ({
    likes: [],
    matches: [],
    setLikes: (likes: Like[]) => set(() => ({ likes })),
    setMatches: (matches: Match[]) => set(() => ({ matches })),
}));

export default useLikesAndMatchesStore;