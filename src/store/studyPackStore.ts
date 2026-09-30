import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudyPackResult, StudyPackRecord } from '@api/generate';

/**
 * localStorage is ~5MB and a 30-card pack with long answers runs to tens of KB,
 * so history is capped and trimmed oldest-first to stay well inside budget.
 */
const MAX_HISTORY = 30;

interface StudyPackState {
  packs: Record<string, StudyPackResult>;
  currentSlug: string | null;
  history: StudyPackRecord[];
  setPack: (slug: string, pack: StudyPackResult) => void;
  getPack: (slug: string) => StudyPackResult | undefined;
  addRecord: (record: StudyPackRecord) => void;
  getRecord: (id: string) => StudyPackRecord | undefined;
  removeRecord: (id: string) => void;
  clearHistory: () => void;
  removePack: (slug: string) => void;
  clearCurrent: () => void;
}

export const useStudyPackStore = create<StudyPackState>()(
  persist(
    (set, get) => ({
      packs: {},
      currentSlug: null,
      history: [],
      setPack: (slug, pack) =>
        set((state) => ({ packs: { ...state.packs, [slug]: pack }, currentSlug: slug })),
      getPack: (slug) => get().packs[slug],
      addRecord: (record) =>
        set((state) => ({
          history: [record, ...state.history.filter((r) => r.id !== record.id)].slice(0, MAX_HISTORY),
        })),
      getRecord: (id) => get().history.find((r) => r.id === id),
      removeRecord: (id) => set((state) => ({ history: state.history.filter((r) => r.id !== id) })),
      clearHistory: () => set({ history: [] }),
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
      partialize: (state) => ({ packs: state.packs, history: state.history }),
      // A failed write (quota) must not break the running app.
      setItem: (name, value) => {
        try {
          localStorage.setItem(name, value);
        } catch {
          try {
            const parsed = JSON.parse(value) as { state?: { history?: StudyPackRecord[] } };
            const trimmed = { ...parsed, state: { ...parsed.state, history: (parsed.state?.history ?? []).slice(0, 5) } };
            localStorage.setItem(name, JSON.stringify(trimmed));
          } catch {
            /* give up silently — in-memory state is still correct */
          }
        }
      },
    }
  )
);
