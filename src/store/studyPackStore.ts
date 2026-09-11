import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudyPackResult } from '@api/generate';

interface StudyPackState {
  packs: Record<string, StudyPackResult>;
  currentSlug: string | null;
  setPack: (slug: string, pack: StudyPackResult) => void;
  getPack: (slug: string) => StudyPackResult | undefined;
  removePack: (slug: string) => void;
  clearCurrent: () => void;
}

export const useStudyPackStore = create<StudyPackState>()(
  persist(
    (set, get) => ({
      packs: {},
      currentSlug: null,
      setPack: (slug, pack) =>
        set((state) => ({ packs: { ...state.packs, [slug]: pack }, currentSlug: slug })),
      getPack: (slug) => get().packs[slug],
      removePack: (slug) =>
        set((state) => {
          const packs = { ...state.packs };
          delete packs[slug];
          return { packs };
        }),
      clearCurrent: () => set({ currentSlug: null }),
    }),
    {
      name: 'sw_packs_v1',
      partialize: (state) => ({ packs: state.packs }),
    }
  )
);
