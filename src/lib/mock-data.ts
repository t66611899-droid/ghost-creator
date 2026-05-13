export type Niche = 'barber' | 'gym';

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'processing';

export type Platform = 'tiktok' | 'instagram' | 'youtube';

export interface ReviewProject {
  id: string;
  niche: Niche;
  businessName: string;
  ownerName: string;
  ownerInitials: string;
  title: string;
  description: string;
  captionPreview: string;
  status: ReviewStatus;
  duration: number;
  originalDuration: number;
  compressionRatio: number;
  timeSaved: number;
  engagementScore: number;
  platforms: Platform[];
  thumbnailGradient: { from: string; to: string };
  createdAt: string;
  reviewer?: string;
  hookStrength: number;
  retentionEstimate: number;
}

export interface DashboardStats {
  totalProjects: number;
  pending: number;
  approved: number;
  rejected: number;
  processing: number;
  avgCompressionRatio: number;
  totalTimeSavedMinutes: number;
  avgEngagementScore: number;
  weeklyDelta: number;
}

export const MOCK_PROJECTS: ReviewProject[] = [
  {
    id: 'rev_01_barber_fade',
    niche: 'barber',
    businessName: 'Fade Masters Barbershop',
    ownerName: 'Marcus Johnson',
    ownerInitials: 'MJ',
    title: '5 Mistakes That Ruin a Skin Fade',
    description: 'Behind-the-chair walkthrough of the fade tapers most barbers get wrong.',
    captionPreview: 'Most barbers skip this step — and that’s why the fade looks blurry.',
    status: 'pending',
    duration: 47,
    originalDuration: 84,
    compressionRatio: 0.44,
    timeSaved: 37,
    engagementScore: 92,
    platforms: ['tiktok', 'instagram'],
    thumbnailGradient: { from: '#f97316', to: '#a855f7' },
    createdAt: '2026-05-10T09:12:00.000Z',
    hookStrength: 88,
    retentionEstimate: 71,
  },
  {
    id: 'rev_02_barber_beard',
    niche: 'barber',
    businessName: 'The Sharp Line',
    ownerName: 'Tony Rivera',
    ownerInitials: 'TR',
    title: 'Why a Bad Beard Trim Aged You 5 Years',
    description: 'Client transformation showing how a clean line lifts the jaw.',
    captionPreview: 'You’re not bad at growing a beard. You’re bad at shaping it.',
    status: 'approved',
    duration: 38,
    originalDuration: 71,
    compressionRatio: 0.46,
    timeSaved: 33,
    engagementScore: 87,
    platforms: ['tiktok', 'instagram', 'youtube'],
    thumbnailGradient: { from: '#0ea5e9', to: '#1e293b' },
    createdAt: '2026-05-10T07:42:00.000Z',
    reviewer: 'Omer',
    hookStrength: 81,
    retentionEstimate: 68,
  },
  {
    id: 'rev_03_barber_shave',
    niche: 'barber',
    businessName: 'King’s Cuts',
    ownerName: 'Devon Smalls',
    ownerInitials: 'DS',
    title: 'Old School Hot Towel Shave (ASMR)',
    description: 'Slow shave POV — designed for retention on TikTok and Reels.',
    captionPreview: 'When was the last time you let someone do this for you?',
    status: 'processing',
    duration: 58,
    originalDuration: 96,
    compressionRatio: 0.4,
    timeSaved: 38,
    engagementScore: 78,
    platforms: ['tiktok', 'youtube'],
    thumbnailGradient: { from: '#fb7185', to: '#7c2d12' },
    createdAt: '2026-05-10T05:20:00.000Z',
    hookStrength: 74,
    retentionEstimate: 82,
  },
  {
    id: 'rev_04_barber_transformation',
    niche: 'barber',
    businessName: 'Crown & Comb',
    ownerName: 'Reggie Brooks',
    ownerInitials: 'RB',
    title: 'Buzz Cut to Pompadour in 12 Minutes',
    description: 'Time-lapse client transformation with on-screen captions.',
    captionPreview: 'He walked in saying “surprise me.” So I did.',
    status: 'pending',
    duration: 54,
    originalDuration: 102,
    compressionRatio: 0.47,
    timeSaved: 48,
    engagementScore: 95,
    platforms: ['tiktok', 'instagram'],
    thumbnailGradient: { from: '#facc15', to: '#dc2626' },
    createdAt: '2026-05-09T22:08:00.000Z',
    hookStrength: 91,
    retentionEstimate: 76,
  },
  {
    id: 'rev_05_gym_deadlift',
    niche: 'gym',
    businessName: 'Iron Forge Athletics',
    ownerName: 'Sarah Mitchell',
    ownerInitials: 'SM',
    title: 'Deadlift Form Check — Most People Get This Wrong',
    description: 'Coaching cue overlay highlighting hip hinge vs. squat-style pull.',
    captionPreview: 'Your back isn’t weak. Your setup is.',
    status: 'pending',
    duration: 42,
    originalDuration: 78,
    compressionRatio: 0.46,
    timeSaved: 36,
    engagementScore: 89,
    platforms: ['tiktok', 'instagram', 'youtube'],
    thumbnailGradient: { from: '#22c55e', to: '#0f172a' },
    createdAt: '2026-05-10T08:55:00.000Z',
    hookStrength: 86,
    retentionEstimate: 74,
  },
  {
    id: 'rev_06_gym_glutes',
    niche: 'gym',
    businessName: 'Pulse Fitness Studio',
    ownerName: 'Diego Vargas',
    ownerInitials: 'DV',
    title: '30-Day Glute Plan — Real Client Results',
    description: 'Side-by-side before/after with the exact lift selection used.',
    captionPreview: 'No machines. No supplements. Just these four lifts.',
    status: 'approved',
    duration: 49,
    originalDuration: 88,
    compressionRatio: 0.44,
    timeSaved: 39,
    engagementScore: 93,
    platforms: ['tiktok', 'instagram'],
    thumbnailGradient: { from: '#ec4899', to: '#6366f1' },
    createdAt: '2026-05-10T06:30:00.000Z',
    reviewer: 'Omer',
    hookStrength: 90,
    retentionEstimate: 79,
  },
  {
    id: 'rev_07_gym_squat',
    niche: 'gym',
    businessName: 'Apex Performance',
    ownerName: 'Amari Black',
    ownerInitials: 'AB',
    title: 'Why Your Squat Stopped Growing',
    description: 'Three programming mistakes that quietly stall lower-body growth.',
    captionPreview: 'You don’t need a new program. You need to fix this one.',
    status: 'rejected',
    duration: 61,
    originalDuration: 110,
    compressionRatio: 0.44,
    timeSaved: 49,
    engagementScore: 64,
    platforms: ['youtube'],
    thumbnailGradient: { from: '#64748b', to: '#0b1120' },
    createdAt: '2026-05-09T18:14:00.000Z',
    reviewer: 'Omer',
    hookStrength: 58,
    retentionEstimate: 52,
  },
  {
    id: 'rev_08_gym_hiit',
    niche: 'gym',
    businessName: 'Sweat Lab',
    ownerName: 'Mia Chen',
    ownerInitials: 'MC',
    title: 'Morning HIIT Under 12 Minutes',
    description: 'Apartment-friendly bodyweight circuit, no equipment, captioned.',
    captionPreview: 'If you have 12 minutes, you have time for this.',
    status: 'processing',
    duration: 44,
    originalDuration: 81,
    compressionRatio: 0.46,
    timeSaved: 37,
    engagementScore: 81,
    platforms: ['tiktok', 'instagram'],
    thumbnailGradient: { from: '#06b6d4', to: '#7c3aed' },
    createdAt: '2026-05-10T04:02:00.000Z',
    hookStrength: 77,
    retentionEstimate: 70,
  },
];

export type HookType = 'contrarian' | 'educational' | 'story';

export interface ViralHook {
  type: HookType;
  label: string;
  tagline: string;
  hookLine: string;
  predictedScore: number;
  retention: number;
  reach: string;
  accent: { from: string; to: string };
}

export const VIRAL_HOOKS: ViralHook[] = [
  {
    type: 'contrarian',
    label: 'Contrarian',
    tagline: 'Pattern interrupt — flips a common belief',
    hookLine: 'Everyone tells you to fade higher. They’re wrong — and here’s why.',
    predictedScore: 94,
    retention: 78,
    reach: '210K – 480K',
    accent: { from: '#f97316', to: '#a855f7' },
  },
  {
    type: 'educational',
    label: 'Educational',
    tagline: 'Promise a clear lesson in under a minute',
    hookLine: '3 deadlift cues that fix 90% of back pain — without lowering the weight.',
    predictedScore: 87,
    retention: 71,
    reach: '120K – 290K',
    accent: { from: '#22c55e', to: '#0ea5e9' },
  },
  {
    type: 'story',
    label: 'Story',
    tagline: 'Hooked narrative with a payoff',
    hookLine: 'He walked in saying “surprise me.” 12 minutes later, he didn’t recognize himself.',
    predictedScore: 91,
    retention: 82,
    reach: '180K – 410K',
    accent: { from: '#ec4899', to: '#6366f1' },
  },
];

export type PresetKey = 'barber' | 'gym' | 'realestate';

export interface StylePreset {
  key: PresetKey;
  label: string;
  description: string;
  caption: string;
  palette: { from: string; to: string };
  fontWeight: string;
  vibe: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    key: 'barber',
    label: 'Barber',
    description: 'Heavy bold caption, warm grade, fast cuts',
    caption: 'BOLD ITALIC · 96pt · Drop shadow',
    palette: { from: '#f97316', to: '#7c2d12' },
    fontWeight: '800',
    vibe: 'Street · Confident',
  },
  {
    key: 'gym',
    label: 'Gym',
    description: 'High-contrast captions, punchy cues, glow accents',
    caption: 'EXTRABOLD · 88pt · Cyan glow',
    palette: { from: '#22c55e', to: '#0f172a' },
    fontWeight: '800',
    vibe: 'Energetic · Athletic',
  },
  {
    key: 'realestate',
    label: 'Real Estate',
    description: 'Cinematic crops, calm pacing, serif lower-thirds',
    caption: 'SEMIBOLD · 64pt · Slow fade',
    palette: { from: '#0ea5e9', to: '#1e293b' },
    fontWeight: '600',
    vibe: 'Cinematic · Premium',
  },
];

export function getMockProjects(): ReviewProject[] {
  return MOCK_PROJECTS;
}

export function getMockProjectsByNiche(niche: Niche | 'all'): ReviewProject[] {
  if (niche === 'all') return MOCK_PROJECTS;
  return MOCK_PROJECTS.filter((p) => p.niche === niche);
}

export function getMockStats(projects: ReviewProject[] = MOCK_PROJECTS): DashboardStats {
  const total = projects.length || 1;
  const totalSecondsSaved = projects.reduce((sum, p) => sum + p.timeSaved, 0);
  const avgComp =
    projects.reduce((sum, p) => sum + p.compressionRatio, 0) / total;
  const avgEng =
    projects.reduce((sum, p) => sum + p.engagementScore, 0) / total;

  return {
    totalProjects: projects.length,
    pending: projects.filter((p) => p.status === 'pending').length,
    approved: projects.filter((p) => p.status === 'approved').length,
    rejected: projects.filter((p) => p.status === 'rejected').length,
    processing: projects.filter((p) => p.status === 'processing').length,
    avgCompressionRatio: Number(avgComp.toFixed(2)),
    totalTimeSavedMinutes: Number((totalSecondsSaved / 60).toFixed(1)),
    avgEngagementScore: Math.round(avgEng),
    weeklyDelta: 18,
  };
}
