// ─── Industry taxonomy ────────────────────────────────────────────────────────

export type Industry = 'Barber' | 'Gym' | 'HVAC' | 'Real Estate' | 'Other';

export type ContentLanguage = 'he' | 'en' | 'he+en';

export type Tone =
  | 'Bold & Confident'
  | 'Friendly & Warm'
  | 'Educational & Expert'
  | 'Hype & Energy'
  | 'Luxury & Aspirational';

// ─── 30-day roadmap mission ───────────────────────────────────────────────────

export interface ContentMission {
  day: number;
  missionTitle: string;
  /** The exact on-camera script — Hebrew is stored as UTF-8 Unicode */
  hookScript: string;
  /** Camera angles, movements, framing, and visual cues */
  directorNotes: string;
}

// ─── Business profile ─────────────────────────────────────────────────────────

export interface BusinessProfile {
  id: string;
  businessName: string;
  industry: Industry;
  targetAudience: string;
  tone: Tone;
  language: ContentLanguage;
  /** ISO date string when profile was created */
  createdAt: string;
  /** Generated 30-day content roadmap */
  contentPlan: ContentMission[];
}

// ─── Industry → style key mapping ────────────────────────────────────────────

export const INDUSTRY_STYLE_MAP: Record<Industry, string> = {
  Barber: 'barber',
  Gym: 'gym',
  HVAC: 'hvac',
  'Real Estate': 'minimal',
  Other: 'vibrant',
};

// ─── LocalStorage key ────────────────────────────────────────────────────────

export const PROFILE_STORAGE_KEY = 'ghost_profile';
