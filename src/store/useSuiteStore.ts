import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VaultClipStatus = 'queued' | 'processing' | 'done' | 'error';

export interface VaultClip {
  id: string;
  name: string;
  size: number;        // bytes
  duration: number;    // seconds (0 until analyzed)
  status: VaultClipStatus;
  error?: string;
  thumbnail?: string;  // data URL of captured thumbnail frame
  // Transient — not serialized (File and ObjectURL cannot be persisted)
  objectUrl?: string;
}

interface SuiteStore {
  // Scroll offset (0..1) — single source of truth for R3F parallax
  scrollOffset: number;
  setScrollOffset: (o: number) => void;

  // Media Vault
  vaultClips: VaultClip[];
  addClip: (clip: VaultClip) => void;
  updateClip: (id: string, patch: Partial<VaultClip>) => void;
  removeClip: (id: string) => void;
  clearVault: () => void;

  // Currently previewing clip ID
  previewClipId: string | null;
  setPreviewClipId: (id: string | null) => void;

  // Global reset
  resetAll: () => void;
}

export const useSuiteStore = create<SuiteStore>()(
  persist(
    (set) => ({
      scrollOffset: 0,
      setScrollOffset: (o) => set({ scrollOffset: o }),

      vaultClips: [],
      addClip: (clip) => set((s) => ({ vaultClips: [...s.vaultClips, clip] })),
      updateClip: (id, patch) =>
        set((s) => ({
          vaultClips: s.vaultClips.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeClip: (id) => set((s) => ({ vaultClips: s.vaultClips.filter((c) => c.id !== id) })),
      clearVault: () => set({ vaultClips: [], previewClipId: null }),

      previewClipId: null,
      setPreviewClipId: (id) => set({ previewClipId: id }),

      resetAll: () =>
        set({
          vaultClips: [],
          previewClipId: null,
          scrollOffset: 0,
        }),
    }),
    {
      name: 'blubarber-store',
      // Don't persist transient state (objectUrls, scrollOffset)
      partialize: (s) => ({
        vaultClips: s.vaultClips.map(({ objectUrl: _o, ...rest }) => rest),
      }),
    }
  )
);
