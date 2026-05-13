'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import type { ReviewProject } from '@/lib/mock-data';

interface ProjectGridProps {
  projects: ReviewProject[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onPreview?: (id: string) => void;
}

export function ProjectGrid({ projects, onApprove, onReject, onPreview }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-20 text-center"
      >
        <Inbox className="h-10 w-10 text-white/30" />
        <p className="mt-4 text-sm font-medium text-white/70">Nothing to review here yet</p>
        <p className="mt-1 text-xs text-white/40">Try a different filter to see other niches.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      <AnimatePresence mode="popLayout">
        {projects.map((p, i) => (
          <ProjectCard
            key={p.id}
            project={p}
            index={i}
            onApprove={onApprove}
            onReject={onReject}
            onPreview={onPreview}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
