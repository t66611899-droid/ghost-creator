'use client';

import { motion } from 'framer-motion';
import { Activity, Clock, Sparkles, ListChecks, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { DashboardStats } from '@/lib/mock-data';

interface StatsOverviewProps {
  stats: DashboardStats;
}

const statCard = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function StatsOverview({ stats }: StatsOverviewProps) {
  const tiles = [
    {
      label: 'In review queue',
      value: stats.totalProjects,
      sub: `${stats.pending} pending • ${stats.processing} processing`,
      icon: ListChecks,
      accent: 'from-blue-500/20 to-purple-500/20',
      iconColor: 'text-blue-300',
      progress: (stats.approved / Math.max(1, stats.totalProjects)) * 100,
      progressLabel: `${stats.approved} approved`,
    },
    {
      label: 'Avg compression',
      value: `${Math.round(stats.avgCompressionRatio * 100)}%`,
      sub: 'Silence trimmed across pipeline',
      icon: Activity,
      accent: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-300',
      progress: stats.avgCompressionRatio * 100,
      progressLabel: 'kept after cut',
    },
    {
      label: 'Time saved',
      value: `${stats.totalTimeSavedMinutes}m`,
      sub: 'Across all reviewed videos',
      icon: Clock,
      accent: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-300',
      progress: Math.min(100, stats.totalTimeSavedMinutes * 5),
      progressLabel: 'editing hours redirected',
    },
    {
      label: 'Engagement score',
      value: stats.avgEngagementScore,
      sub: `+${stats.weeklyDelta}% vs last week`,
      icon: Sparkles,
      accent: 'from-pink-500/20 to-purple-500/20',
      iconColor: 'text-pink-300',
      progress: stats.avgEngagementScore,
      progressLabel: 'predicted retention',
      trend: true,
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {tiles.map((tile, i) => {
        const Icon = tile.icon;
        return (
          <motion.div key={tile.label} variants={statCard} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <Card className="overflow-hidden">
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${tile.accent}`} />
              <div className="flex items-start justify-between p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/50">{tile.label}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-tight text-white">{tile.value}</span>
                    {tile.trend && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-300">
                        <TrendingUp className="h-3 w-3" />
                        {stats.weeklyDelta}%
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-white/50">{tile.sub}</p>
                </div>
                <div className={`rounded-lg bg-gradient-to-br ${tile.accent} p-2 ring-1 ring-white/10`}>
                  <Icon className={`h-5 w-5 ${tile.iconColor}`} />
                </div>
              </div>
              <div className="px-5 pb-5">
                <Progress value={tile.progress} delay={0.3 + i * 0.08} />
                <p className="mt-2 text-[11px] uppercase tracking-wider text-white/40">{tile.progressLabel}</p>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
