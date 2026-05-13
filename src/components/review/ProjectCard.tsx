'use client';

import { motion } from 'framer-motion';
import { Play, Check, X, Scissors, Eye, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn, formatDuration, formatRelativeTime } from '@/lib/utils';
import type { ReviewProject, ReviewStatus, Platform } from '@/lib/mock-data';

interface ProjectCardProps {
  project: ReviewProject;
  index: number;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onPreview?: (id: string) => void;
}

const statusTone: Record<ReviewStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  processing: 'info',
};

const statusLabel: Record<ReviewStatus, string> = {
  approved: 'Approved',
  pending: 'Pending review',
  rejected: 'Needs rework',
  processing: 'Processing',
};

const platformLabel: Record<Platform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

export function ProjectCard({ project, index, onApprove, onReject, onPreview }: ProjectCardProps) {
  const compressionPct = Math.round((1 - project.compressionRatio) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      layout
    >
      <Card className="group overflow-hidden">
        <div className="relative aspect-video overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(135deg, ${project.thumbnailGradient.from} 0%, ${project.thumbnailGradient.to} 100%)`,
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          <div className="absolute left-4 top-4 flex items-center gap-2">
            <Badge tone={project.niche === 'barber' ? 'accent' : 'success'}>
              {project.niche === 'barber' ? 'Barber' : 'Gym'}
            </Badge>
            <Badge tone={statusTone[project.status]}>{statusLabel[project.status]}</Badge>
          </div>

          <div className="absolute right-4 top-4 rounded-md bg-black/40 px-2 py-0.5 text-xs font-medium text-white/90 backdrop-blur">
            {formatDuration(project.duration)}
          </div>

          <button
            onClick={() => onPreview?.(project.id)}
            className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            aria-label={`Preview ${project.title}`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-2xl ring-4 ring-white/20 transition-transform group-hover:scale-105">
              <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
            </span>
          </button>

          <div className="absolute bottom-3 left-4 right-4">
            <p className="line-clamp-1 text-sm italic text-white/85">
              &ldquo;{project.captionPreview}&rdquo;
            </p>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-3">
            <Avatar initials={project.ownerInitials} gradient={project.thumbnailGradient} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-white">{project.title}</h3>
              <p className="mt-0.5 truncate text-xs text-white/50">
                {project.businessName} • {project.ownerName}
              </p>
            </div>
            <span className="text-[11px] text-white/40">{formatRelativeTime(project.createdAt)}</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric
              label="Cut"
              value={`${compressionPct}%`}
              icon={<Scissors className="h-3 w-3" />}
              accent="text-emerald-300"
            />
            <Metric
              label="Hook"
              value={project.hookStrength}
              icon={<Sparkles className="h-3 w-3" />}
              accent="text-purple-300"
            />
            <Metric
              label="Retention"
              value={`${project.retentionEstimate}%`}
              icon={<Eye className="h-3 w-3" />}
              accent="text-blue-300"
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/40">
              <span>Engagement score</span>
              <span className="font-semibold text-white/70">{project.engagementScore}/100</span>
            </div>
            <Progress
              value={project.engagementScore}
              className="mt-1.5"
              delay={0.2 + index * 0.05}
            />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex flex-wrap gap-1.5">
              {project.platforms.map((p) => (
                <span
                  key={p}
                  className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/70"
                >
                  {platformLabel[p]}
                </span>
              ))}
            </div>
            <div className={cn('flex gap-1.5', project.status === 'processing' && 'opacity-50 pointer-events-none')}>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => onReject?.(project.id)}
                aria-label="Reject"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="primary"
                onClick={() => onApprove?.(project.id)}
                aria-label="Approve"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function Metric({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.025] p-2.5">
      <div className={cn('flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider', accent)}>
        {icon}
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </div>
  );
}
