'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Scissors, ChevronRight, ChevronLeft, Sparkles, Loader2, Check, Globe } from 'lucide-react';
import type { BusinessProfile, ContentMission, ContentLanguage, Industry, Tone } from '@/types/profile';
import { PROFILE_STORAGE_KEY } from '@/types/profile';
import type { AnalysisResult } from '../../../lib/strategy/plan-generator';

// ─── 3D Neural Globe — SSR disabled ──────────────────────────────────────────
const NeuralGlobe = dynamic(
  () => import('@/components/3d/NeuralGlobe'),
  { ssr: false, loading: () => <div style={{ width: 260, height: 260 }} /> }
);

// ─── UI strings ───────────────────────────────────────────────────────────────

const UI = {
  en: {
    toggle: 'עברית',
    stage1Title: 'Tell us about your business.',
    stage1Sub: 'What do you do, and what makes you unique?',
    stage1Placeholder:
      "e.g. I run a barbershop in South London. We specialise in skin fades and beard grooming for men aged 18-35 who care about looking sharp. My vibe is confident and premium.",
    stage1Cta: 'Analyze Strategy',
    analyzing: 'Strategy Calculating…',
    analyzingSub: 'Brain Engine · reading your business…',
    stage2Title: 'Your AI Strategy Profile',
    stage2Sub: 'We read your description and built this. Approve or adjust before generating.',
    labelBusiness: 'Business Name',
    labelIndustry: 'Industry',
    labelAudience: 'Target Audience',
    labelTone: 'Brand Tone',
    labelLanguage: 'Script Language',
    back: 'Back',
    buildCta: 'Build My 30-Day Roadmap',
    generating: 'Generating 30 missions…',
    previewTitle: 'Your first mission is ready.',
    openDashboard: 'Open Command Center',
    day1: 'Day 1',
    hookScript: 'Hook Script',
    directorNotes: 'Director Notes',
  },
  he: {
    toggle: 'English',
    stage1Title: 'ספר לנו על העסק שלך.',
    stage1Sub: 'מה אתה עושה ומה מייחד אותך?',
    stage1Placeholder:
      'לדוגמה: אני ספר בתל אביב עם 8 שנות ניסיון. מתמחה בעיצוב פיידים ולוק מושלם לגברים בגילאי 18-35. הסגנון שלי בוטח ופרימיום.',
    stage1Cta: 'נתח אסטרטגיה',
    analyzing: '…מחשב אסטרטגיה',
    analyzingSub: '…מנוע המוח · קורא את העסק שלך',
    stage2Title: 'פרופיל האסטרטגיה שלך',
    stage2Sub: 'קראנו את התיאור שלך ובנינו את זה. אשר או ערוך לפני הגנרציה.',
    labelBusiness: 'שם העסק',
    labelIndustry: 'תחום',
    labelAudience: 'קהל יעד',
    labelTone: 'טון המותג',
    labelLanguage: 'שפת הסקריפט',
    back: 'חזרה',
    buildCta: 'בנה את מפת הדרכים שלי ל-30 יום',
    generating: '…מייצר 30 משימות',
    previewTitle: '!המשימה הראשונה שלך מוכנה',
    openDashboard: 'פתח מרכז הפיקוד',
    day1: 'יום 1',
    hookScript: 'סקריפט הפתיחה',
    directorNotes: 'הוראות בימוי',
  },
} as const;

type UILang = 'en' | 'he';

type Stage = 'intake' | 'analyzing' | 'confirm' | 'generating' | 'preview';

const LANGUAGE_OPTIONS: { value: ContentLanguage; labelEn: string; labelHe: string; sub: string }[] = [
  { value: 'en', labelEn: 'English', labelHe: 'אנגלית', sub: 'LTR · Latin script' },
  { value: 'he', labelEn: 'עברית (Hebrew)', labelHe: 'עברית', sub: 'RTL · כתב עברי' },
  { value: 'he+en', labelEn: 'Bilingual', labelHe: 'דו-לשוני', sub: 'Hebrew + English' },
];

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="rounded-xl border border-[#1e1e1e] bg-[#0d0d0d] p-4 flex flex-col gap-2">
      <div className="h-2 w-20 rounded bg-[#1e1e1e] animate-pulse" />
      <div className="h-4 w-48 rounded bg-[#1a1a1a] animate-pulse" />
    </div>
  );
}

function AnalyzingSkeleton({ ui }: { ui: (typeof UI)[UILang] }) {
  return (
    <motion.div
      key="analyzing"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="w-full max-w-md flex flex-col items-center gap-6"
    >
      {/* Neural Map Globe */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <NeuralGlobe size={260} />
          {/* Scanning label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#ea580c]/10 border border-[#ea580c]/20 backdrop-blur-sm"
          >
            <span className="text-[9px] font-bold text-[#ea580c] uppercase tracking-widest font-mono">
              Scanning…
            </span>
          </motion.div>
        </div>
        <p className="font-black text-lg mt-4">{ui.analyzing}</p>
        <p className="text-xs text-[#444] font-mono">{ui.analyzingSub}</p>
      </div>

      {/* Skeleton fields */}
      <div className="w-full flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Field row in confirm stage ───────────────────────────────────────────────

function FieldRow({ label, value, isRTL }: { label: string; value: string; isRTL?: boolean }) {
  return (
    <div className="rounded-xl border border-[#1e1e1e] bg-[#0d0d0d] px-4 py-3 flex flex-col gap-1">
      <p className="text-[10px] uppercase tracking-[0.15em] text-[#444] font-semibold">{label}</p>
      <p
        className="text-sm text-white font-semibold"
        dir={isRTL ? 'rtl' : 'ltr'}
        style={isRTL ? { fontFamily: 'var(--font-rubik)' } : {}}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  const [uiLang, setUiLang] = useState<UILang>('en');
  const [stage, setStage] = useState<Stage>('intake');
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [scriptLanguage, setScriptLanguage] = useState<ContentLanguage>('en');
  const [analyzeError, setAnalyzeError] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [savedProfile, setSavedProfile] = useState<BusinessProfile | null>(null);

  const ui = UI[uiLang];
  const isRTL = uiLang === 'he';

  const toggleUILang = useCallback(() => {
    setUiLang((prev) => (prev === 'en' ? 'he' : 'en'));
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (description.trim().length < 10) return;
    setAnalyzeError('');
    setStage('analyzing');

    try {
      const res = await fetch('/api/strategy/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim() }),
      });

      const data = (await res.json()) as { analysis?: AnalysisResult; error?: string };

      if (!res.ok || !data.analysis) {
        throw new Error(data.error ?? 'Analysis failed');
      }

      setAnalysis(data.analysis);
      setScriptLanguage(data.analysis.language);
      setStage('confirm');
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : String(err));
      setStage('intake');
    }
  }, [description]);

  const handleGenerate = useCallback(async () => {
    if (!analysis) return;
    setGenerateError('');
    setStage('generating');

    const profile: BusinessProfile = {
      id: crypto.randomUUID(),
      businessName: analysis.businessName,
      industry: analysis.industry as Industry,
      targetAudience: analysis.targetAudience,
      tone: analysis.tone as Tone,
      language: scriptLanguage,
      createdAt: new Date().toISOString(),
      contentPlan: [],
    };

    try {
      const res = await fetch('/api/strategy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });

      const data = (await res.json()) as { missions?: ContentMission[]; error?: string };

      if (!res.ok || !data.missions) {
        throw new Error(data.error ?? 'Generation failed');
      }

      profile.contentPlan = data.missions;
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      setSavedProfile(profile);
      setStage('preview');
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : String(err));
      setStage('confirm');
    }
  }, [analysis, scriptLanguage]);

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center px-4 py-12"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ea580c] flex items-center justify-center shadow-lg shadow-[#ea580c]/30">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-base tracking-tight">Ghost Creator</span>
          <span className="text-[#333] text-xs font-mono hidden sm:block">Business Brain</span>
        </div>
        <button
          onClick={toggleUILang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e1e1e] text-[#555] hover:border-[#2a2a2a] hover:text-[#888] text-xs transition-all"
        >
          <Globe className="w-3 h-3" />
          {ui.toggle}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ─── Stage 1: Description Intake ─── */}
        {stage === 'intake' && (
          <motion.div
            key="intake"
            initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 40 : -40 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#ea580c]" />
              <div className="w-8 h-1.5 rounded-full bg-[#ea580c]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#1e1e1e]" />
            </div>

            <h1
              className="text-2xl font-black leading-tight"
              dir={isRTL ? 'rtl' : 'ltr'}
              style={isRTL ? { fontFamily: 'var(--font-rubik)' } : {}}
            >
              {ui.stage1Title}
            </h1>
            <p
              className="mt-1 text-sm text-[#555]"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {ui.stage1Sub}
            </p>

            <div className="mt-6">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={ui.stage1Placeholder}
                rows={6}
                dir={isRTL ? 'rtl' : 'ltr'}
                style={isRTL ? { fontFamily: 'var(--font-rubik)' } : {}}
                className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#2a2a2a] focus:outline-none focus:border-[#ea580c]/50 transition-colors resize-none leading-relaxed"
              />
            </div>

            {analyzeError && (
              <p className="mt-3 text-xs text-red-400 bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">
                {analyzeError}
              </p>
            )}

            <button
              onClick={handleAnalyze}
              disabled={description.trim().length < 10}
              className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-lg shadow-[#ea580c]/20"
            >
              <Sparkles className="w-4 h-4" />
              {ui.stage1Cta}
            </button>
          </motion.div>
        )}

        {/* ─── Analyzing skeleton ─── */}
        {stage === 'analyzing' && (
          <AnalyzingSkeleton key="analyzing" ui={ui} />
        )}

        {/* ─── Stage 2: AI Strategy Confirmation ─── */}
        {stage === 'confirm' && analysis && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 40 : -40 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#ea580c]" />
              <div className="w-8 h-1.5 rounded-full bg-[#ea580c]" />
              <div className="w-8 h-1.5 rounded-full bg-[#ea580c]" />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-[#ea580c]/15 border border-[#ea580c]/30 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-[#ea580c]" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.15em] text-[#ea580c] font-semibold">
                AI Analysis Complete
              </span>
              {analysis.confidence >= 0.7 && (
                <span className="text-[10px] text-[#333] font-mono ml-auto">
                  {Math.round(analysis.confidence * 100)}% confidence
                </span>
              )}
            </div>

            <h1
              className="text-xl font-black leading-tight"
              dir={isRTL ? 'rtl' : 'ltr'}
              style={isRTL ? { fontFamily: 'var(--font-rubik)' } : {}}
            >
              {ui.stage2Title}
            </h1>
            <p className="mt-1 text-sm text-[#555]">{ui.stage2Sub}</p>

            <div className="mt-5 flex flex-col gap-2">
              <FieldRow label={ui.labelBusiness} value={analysis.businessName} />
              <FieldRow label={ui.labelIndustry} value={analysis.industry} />
              <FieldRow
                label={ui.labelAudience}
                value={analysis.targetAudience}
                isRTL={analysis.language === 'he' || analysis.language === 'he+en'}
              />
              <FieldRow label={ui.labelTone} value={analysis.tone} />
            </div>

            {/* Script language override */}
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#444] font-semibold mb-2">
                {ui.labelLanguage}
              </p>
              <div className="flex flex-col gap-1.5">
                {LANGUAGE_OPTIONS.map(({ value, labelEn, labelHe, sub }) => {
                  const label = isRTL ? labelHe : labelEn;
                  const selected = scriptLanguage === value;
                  return (
                    <motion.button
                      key={value}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setScriptLanguage(value)}
                      className={`relative w-full text-left rounded-xl border px-4 py-2.5 transition-all flex items-center gap-3 ${
                        selected
                          ? 'border-[#ea580c]/60 bg-[#ea580c]/8'
                          : 'border-[#1e1e1e] bg-[#0d0d0d] hover:border-[#2a2a2a]'
                      }`}
                    >
                      {selected && (
                        <span className="absolute top-2.5 right-3 w-4 h-4 rounded-full bg-[#ea580c] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                      <span
                        className={`text-sm font-semibold ${selected ? 'text-white' : 'text-[#666]'}`}
                        style={value !== 'en' ? { fontFamily: 'var(--font-rubik)' } : {}}
                      >
                        {label}
                      </span>
                      <span className="text-[10px] text-[#333]">{sub}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {generateError && (
              <p className="mt-3 text-xs text-red-400 bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">
                {generateError}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStage('intake')}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-[#1e1e1e] text-[#555] hover:border-[#2a2a2a] hover:text-[#888] text-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> {ui.back}
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-lg shadow-[#ea580c]/20"
              >
                <Sparkles className="w-4 h-4" />
                {ui.buildCta}
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── Generating skeleton ─── */}
        {stage === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-md flex flex-col items-center gap-6"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ea580c]/10 border border-[#ea580c]/20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[#ea580c] animate-spin" />
              </div>
              <p className="font-black text-lg">{ui.generating}</p>
              <p className="text-xs text-[#444] font-mono">Brain Engine · Gemini 2.5 Pro · crafting your empire…</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── Preview: Day 1 mission ─── */}
        {stage === 'preview' && savedProfile && (() => {
          const mission = savedProfile.contentPlan[0];
          const isHebrewScript = savedProfile.language === 'he' || savedProfile.language === 'he+en';
          return (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full bg-[#ea580c] flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold text-[#ea580c]">
                  30-Day Roadmap Generated
                </span>
              </div>

              <h1
                className="text-2xl font-black leading-tight"
                dir={isRTL ? 'rtl' : 'ltr'}
                style={isRTL ? { fontFamily: 'var(--font-rubik)' } : {}}
              >
                {ui.previewTitle}
              </h1>
              <p className="mt-1 text-sm text-[#555]">
                {savedProfile.businessName} · {savedProfile.industry} · {savedProfile.contentPlan.length} missions
              </p>

              {mission && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-6 rounded-2xl border border-[#ea580c]/20 bg-gradient-to-br from-[#0d0d0d] to-[#111] p-5 flex flex-col gap-4"
                >
                  <span className="text-[10px] font-bold text-[#ea580c] bg-[#ea580c]/10 border border-[#ea580c]/20 rounded-full px-2.5 py-0.5 uppercase tracking-wider self-start">
                    {ui.day1}
                  </span>
                  <h2 className="text-lg font-black leading-tight">{mission.missionTitle}</h2>

                  <div className="rounded-xl bg-[#0a0a0a] border border-[#1e1e1e] p-3">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#444] font-semibold mb-2">
                      {ui.hookScript}
                    </p>
                    <p
                      className="text-sm text-white leading-relaxed whitespace-pre-line"
                      dir={isHebrewScript ? 'rtl' : 'ltr'}
                      style={isHebrewScript ? { fontFamily: 'var(--font-rubik)' } : {}}
                    >
                      {mission.hookScript}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#0a0a0a] border border-[#1e1e1e] p-3">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#444] font-semibold mb-2">
                      {ui.directorNotes}
                    </p>
                    <p className="text-xs text-[#666] leading-relaxed">{mission.directorNotes}</p>
                  </div>
                </motion.div>
              )}

              <button
                onClick={() => router.push('/dashboard')}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-lg shadow-[#ea580c]/20"
              >
                <Sparkles className="w-4 h-4" />
                {ui.openDashboard}
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
