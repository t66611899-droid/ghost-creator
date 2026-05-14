import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BusinessProfile } from '@/types/profile';
import { BLUBARBER_MISSIONS } from '../../lib/blubarber-missions';

export type VaultClipStatus = 'queued' | 'processing' | 'done' | 'error';

export interface VaultClip {
  id: string;
  name: string;
  size: number;        // bytes
  duration: number;   // seconds (0 until analyzed)
  status: VaultClipStatus;
  styleKey: string;   // active Blubarber style applied
  error?: string;
  thumbnail?: string; // data URL of captured thumbnail frame
  // Transient — not serialized (File object is not JSON-serializable)
  objectUrl?: string;
}

export type BlubarberPreset = 'barber' | 'gym' | 'hvac' | 'real-estate' | 'other';

// Transition speed per industry in seconds
export const PRESET_SPEED: Record<BlubarberPreset, number> = {
  barber: 0.12,
  gym: 0.08,
  hvac: 0.22,
  'real-estate': 0.28,
  other: 0.18,
};

// ─── Hard-coded default Blubarber profile ────────────────────────────────────

export const DEFAULT_BLUBARBER_PROFILE: BusinessProfile = {
  id: 'blubarber-default',
  businessName: 'Blubarber',
  industry: 'Barber',
  targetAudience: 'Men 18-45 who value craft, sharp lines, and unapologetic confidence',
  tone: 'Viral/Professional',
  language: 'en',
  createdAt: '2026-05-13T00:00:00.000Z',
  contentPlan: BLUBARBER_MISSIONS,
};

interface SuiteStore {
  // Navigation history stack
  navHistory: string[];
  pushNav: (path: string) => void;
  popNav: () => string | undefined;

  // ─── Active business profile (hard-coded Blubarber by default) ────────────
  profile: BusinessProfile;
  setProfile: (p: BusinessProfile) => void;

  // ─── Scroll offset (0..1) — single source of truth for R3F parallax ───────
  scrollOffset: number;
  setScrollOffset: (o: number) => void;

  // ─── Media Vault ──────────────────────────────────────────────────────────
  vaultClips: VaultClip[];
  addClip: (clip: VaultClip) => void;
  updateClip: (id: string, patch: Partial<VaultClip>) => void;
  removeClip: (id: string) => void;
  clearVault: () => void;

  // Active Blubarber preset
  blubarberPreset: BlubarberPreset;
  setBlubarberPreset: (p: BlubarberPreset) => void;

  // Currently previewing clip ID
  previewClipId: string | null;
  setPreviewClipId: (id: string | null) => void;

  // Global reset
  resetAll: () => void;
}

export const useSuiteStore = create<SuiteStore>()(
  persist(
    (set, get) => ({
      navHistory: [],
      pushNav: (path) =>
        set((s) => ({ navHistory: [...s.navHistory.slice(-19), path] })),
      popNav: () => {
        const history = get().navHistory;
        if (history.length === 0) return undefined;
        const prev = history[history.length - 1];
        set({ navHistory: history.slice(0, -1) });
        return prev;
      },

      profile: DEFAULT_BLUBARBER_PROFILE,
      setProfile: (p) => set({ profile: p }),

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

      blubarberPreset: 'barber',
      setBlubarberPreset: (p) => set({ blubarberPreset: p }),

      previewClipId: null,
      setPreviewClipId: (id) => set({ previewClipId: id }),

      resetAll: () =>
        set({
          navHistory: [],
          vaultClips: [],
          previewClipId: null,
          profile: DEFAULT_BLUBARBER_PROFILE,
          scrollOffset: 0,
        }),
    }),
    {
      name: 'ghost-suite-store',
      // Don't persist transient state
      partialize: (s) => ({
        navHistory: s.navHistory,
        profile: s.profile,
        blubarberPreset: s.blubarberPreset,
        vaultClips: s.vaultClips.map(({ objectUrl: _o, ...rest }) => rest),
      }),
    }
  )
);
