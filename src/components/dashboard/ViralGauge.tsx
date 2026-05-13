'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

interface ViralGaugeProps {
  value: number; // 0–100
  size?: number;
}

export default function ViralGauge({ value, size = 220 }: ViralGaugeProps) {
  const strokeWidth = Math.max(12, size * 0.065);
  const radius = size * 0.35;
  const center = size / 2;
  const circumference = Math.PI * radius; // half-circle

  const animatedValue = useMotionValue(0);
  const offset = useTransform(animatedValue, [0, 100], [circumference, 0]);
  const progressAngle = useTransform(animatedValue, [0, 100], [-Math.PI, 0]);
  const innerRadius = radius - strokeWidth / 2;
  const fontSize = Math.max(22, size * 0.13);
  const labelSize = Math.max(10, size * 0.045);

  useEffect(() => {
    const controls = animate(animatedValue, value, { duration: 1.4, ease: 'easeOut' });
    return controls.stop;
  }, [value, animatedValue]);

  const label = value >= 80 ? 'VIRAL' : value >= 60 ? 'STRONG' : value >= 40 ? 'BUILDING' : 'LOW';
  const labelColor = value >= 80 ? '#ea580c' : value >= 60 ? '#f97316' : value >= 40 ? '#fb923c' : '#6b7280';

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#6b7280]">
        Viral Confidence
      </p>

      <div className="relative" style={{ width: size, height: size * 0.62 }}>
        <svg
          width={size}
          height={size * 0.62}
          viewBox={`0 0 ${size} ${size * 0.62}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1a1a1a" />
              <stop offset="100%" stopColor="#2a2a2a" />
            </linearGradient>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
            <filter id="orangeGlow">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track (full half-circle, dark) */}
          <path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="none"
            stroke="url(#trackGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <motion.path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="none"
            stroke="url(#progressGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            filter="url(#orangeGlow)"
          />

          {/* Pointer needle */}
          <motion.line
            x1={useTransform(progressAngle, (a) => center + Math.cos(a) * innerRadius)}
            y1={useTransform(progressAngle, (a) => center + Math.sin(a) * innerRadius)}
            x2={useTransform(progressAngle, (a) => center + Math.cos(a) * (innerRadius + 10))}
            y2={useTransform(progressAngle, (a) => center + Math.sin(a) * (innerRadius + 10))}
            stroke="#ea580c"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <motion.span
            className="font-black leading-none"
            style={{ fontSize, color: labelColor }}
          >
            <motion.span>
              {useTransform(animatedValue, (v) => Math.round(v))}
            </motion.span>
          </motion.span>
          <motion.span
            className="text-[10px] font-bold tracking-[0.15em] uppercase mt-0.5"
            style={{ color: labelColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {label}
          </motion.span>
        </div>
      </div>

      {/* Scale labels */}
      <div
        className="flex justify-between text-[#444] font-medium"
        style={{ width: size - 8, fontSize: labelSize }}
      >
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}
