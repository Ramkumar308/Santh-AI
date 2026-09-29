import React from 'react';
import { CommodityType } from '../types';

export interface ProduceBadgeProps {
  commodity: CommodityType | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
}

const sizeConfig = {
  xs: {
    container: 'w-7 h-7 rounded-lg',
    svg: 'w-4 h-4',
    badge: 'p-1',
    ring: 'ring-1 ring-black/5 shadow-xs'
  },
  sm: {
    container: 'w-9 h-9 rounded-xl',
    svg: 'w-5 h-5',
    badge: 'p-1.5',
    ring: 'ring-1 ring-black/5 shadow-xs'
  },
  md: {
    container: 'w-12 h-12 rounded-2xl',
    svg: 'w-7 h-7',
    badge: 'p-2',
    ring: 'ring-1.5 ring-black/5 shadow-sm'
  },
  lg: {
    container: 'w-14 h-14 rounded-2xl',
    svg: 'w-9 h-9',
    badge: 'p-2.5',
    ring: 'ring-2 ring-black/10 shadow-md'
  },
  xl: {
    container: 'w-20 h-20 rounded-3xl',
    svg: 'w-12 h-12',
    badge: 'p-3.5',
    ring: 'ring-2 ring-black/10 shadow-lg'
  }
};

/**
 * Custom high-resolution vector SVGs for all agricultural commodities
 * Featuring 3D depth, specular highlights, rich gradients, and organic details
 */
export const ProduceIcon: React.FC<{ commodity: string; className?: string }> = ({ commodity, className = 'w-full h-full' }) => {
  const norm = commodity.toLowerCase();

  if (norm.includes('tomato') || norm.includes('தக்காளி')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <radialGradient id="tomBody" cx="35%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="35%" stopColor="#EE2828" />
            <stop offset="70%" stopColor="#C91414" />
            <stop offset="100%" stopColor="#8E0808" />
          </radialGradient>
          <linearGradient id="tomStem" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="60%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#14532D" />
          </linearGradient>
          <filter id="tomDrop" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#7f1d1d" floodOpacity="0.3" />
          </filter>
        </defs>
        {/* Main Plump Tomato Body */}
        <path
          d="M24 13C13.5 13 6 18.5 6 28C6 37 13.8 44 24 44C34.2 44 42 37 42 28C42 18.5 34.5 13 24 13Z"
          fill="url(#tomBody)"
          filter="url(#tomDrop)"
        />
        {/* Specular Highlight Sheen */}
        <ellipse cx="18" cy="21" rx="6" ry="3.5" transform="rotate(-25 18 21)" fill="white" fillOpacity="0.45" />
        <ellipse cx="15" cy="27" rx="2.5" ry="1.2" transform="rotate(-30 15 27)" fill="white" fillOpacity="0.25" />
        {/* Calyx & Stem */}
        <path
          d="M24 13.5L25.5 6C25.5 5 24 4 23 4.5C21.8 5.1 22 7.5 22.8 13.5Z"
          fill="url(#tomStem)"
        />
        {/* Star Leaves */}
        <path
          d="M24 14L28.5 10.5C29 10 27.5 13 26 14.5L32 15C32.5 15.5 29.5 16.5 26 15.5L27 20C26 19.5 25 17.5 24 15.8L21.5 20C21.2 18 22.2 16.5 22 15.5L16 15.5C18 14.5 20.5 14.5 21.8 14.2L19.5 10C21.5 11.5 22.8 13.2 24 14Z"
          fill="url(#tomStem)"
        />
      </svg>
    );
  }

  if (norm.includes('onion') || norm.includes('வெங்காயம்')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <radialGradient id="oniBody" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="30%" stopColor="#C026D3" />
            <stop offset="70%" stopColor="#86198F" />
            <stop offset="100%" stopColor="#581C87" />
          </radialGradient>
          <linearGradient id="oniSprout" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
          <filter id="oniDrop" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#581C87" floodOpacity="0.3" />
          </filter>
        </defs>
        {/* Onion Bulb with papery curves */}
        <path
          d="M24 6C23 10 9 20 9 30C9 38 15.5 43.5 24 43.5C32.5 43.5 39 38 39 30C39 20 25 10 24 6Z"
          fill="url(#oniBody)"
          filter="url(#oniDrop)"
        />
        {/* Striation lines on skin */}
        <path d="M24 7C22 14 15 23 15 32C15 38 18 41 24 43.5" stroke="#FDF2F8" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M24 7C26 14 33 23 33 32C33 38 30 41 24 43.5" stroke="#581C87" strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M24 7V43.5" stroke="#FDF2F8" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" />
        {/* Highlight bulb curve */}
        <ellipse cx="17" cy="27" rx="3.5" ry="7" transform="rotate(-20 17 27)" fill="white" fillOpacity="0.3" />
        {/* Papery Neck Sprout and roots */}
        <path d="M24 6L25 2.5C25.5 1.5 23.5 1.5 23 2.5L24 6Z" fill="url(#oniSprout)" />
        <path d="M22 43.5L21 46M24 43.5V47M26 43.5L27 46" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (norm.includes('potato') || norm.includes('உருளை')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <radialGradient id="potBody" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="35%" stopColor="#D97706" />
            <stop offset="75%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#78350F" />
          </radialGradient>
          <filter id="potDrop" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#78350F" floodOpacity="0.3" />
          </filter>
        </defs>
        {/* Organic Earthy Potato Shape */}
        <path
          d="M10 26C8 18 15 11 25 10C35 9 42 16 41 24C40 33 34 40 23 40C14 40 11 32 10 26Z"
          fill="url(#potBody)"
          filter="url(#potDrop)"
        />
        {/* Highlight Glow */}
        <ellipse cx="23" cy="18" rx="8" ry="4" transform="rotate(-15 23 18)" fill="white" fillOpacity="0.35" />
        {/* Natural Potato Dimples / Eyes */}
        <path d="M16 22C17 21 19 22 18.5 23" stroke="#451A03" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="17.5" cy="22.5" r="0.8" fill="#451A03" />
        <path d="M28 17C29 16 31 17 30.5 18" stroke="#451A03" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="29.5" cy="17.5" r="0.8" fill="#451A03" />
        <path d="M32 28C33 27 35 28 34.5 29" stroke="#451A03" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="33.5" cy="28.5" r="0.8" fill="#451A03" />
        <path d="M20 32C21 31 23 32 22.5 33" stroke="#451A03" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="21.5" cy="32.5" r="0.8" fill="#451A03" />
      </svg>
    );
  }

  if (norm.includes('brinjal') || norm.includes('eggplant') || norm.includes('கத்தரி')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <radialGradient id="brinBody" cx="30%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="35%" stopColor="#6B21A8" />
            <stop offset="75%" stopColor="#3B0764" />
            <stop offset="100%" stopColor="#2E0854" />
          </radialGradient>
          <linearGradient id="brinCalyx" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="60%" stopColor="#15803D" />
            <stop offset="100%" stopColor="#052E16" />
          </linearGradient>
          <filter id="brinDrop" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#2E0854" floodOpacity="0.35" />
          </filter>
        </defs>
        {/* Curving Glossy Eggplant Body */}
        <path
          d="M21 16C17 21 11 27 11 33C11 39.5 17 44 25 44C34 44 38 38 38 31C38 23 31 16 26 14L21 16Z"
          fill="url(#brinBody)"
          filter="url(#brinDrop)"
        />
        {/* Specular Light Sweep */}
        <path
          d="M17 27C15 31 15 36 18 39"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
        <ellipse cx="28" cy="25" rx="3" ry="6" transform="rotate(35 28 25)" fill="white" fillOpacity="0.2" />
        {/* Calyx and Crown */}
        <path
          d="M24 14L27 6C27 4.5 25 4.5 24.5 6L23.5 14L18 15C19.5 17 21 18 20 21C22 19 24 19 25 21C26.5 18 29 20 30 16L24 14Z"
          fill="url(#brinCalyx)"
        />
      </svg>
    );
  }

  if (norm.includes('cabbage') || norm.includes('கோஸ்') || norm.includes('முட்டைக்கோஸ்')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <radialGradient id="cabBase" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#BBF7D0" />
            <stop offset="40%" stopColor="#4ADE80" />
            <stop offset="80%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#14532D" />
          </radialGradient>
          <filter id="cabDrop" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#14532D" floodOpacity="0.3" />
          </filter>
        </defs>
        {/* Crisp Round Cabbage Head */}
        <circle cx="24" cy="25" r="18" fill="url(#cabBase)" filter="url(#cabDrop)" />
        {/* Outer Overlapping Leaf Waves */}
        <path
          d="M9 25C9 15 17 8 26 8C21 13 20 22 25 30C29 36 34 38 41 30C39 38 32 43 23 43C15 43 9 35 9 25Z"
          fill="#22C55E"
          fillOpacity="0.6"
        />
        <path
          d="M39 23C39 14 32 8 23 8C27 13 28 22 23 30C19 36 15 37 9 30C11 38 18 42 26 42C34 42 39 34 39 23Z"
          fill="#15803D"
          fillOpacity="0.4"
        />
        {/* Delicate Leaf Vein Ribs */}
        <path d="M24 13C24 22 24 35 24 41" stroke="#DCFCE7" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
        <path d="M24 22C19 18 15 19 12 21" stroke="#DCFCE7" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
        <path d="M24 26C29 22 33 23 36 24" stroke="#DCFCE7" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
        <path d="M24 33C19 30 16 33 13 35" stroke="#DCFCE7" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
        <path d="M24 34C29 32 32 34 35 37" stroke="#DCFCE7" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
      </svg>
    );
  }

  if (norm.includes('carrot') || norm.includes('கேரட்')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="carBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDBA74" />
            <stop offset="25%" stopColor="#FB923C" />
            <stop offset="65%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#9A3412" />
          </linearGradient>
          <linearGradient id="carLeaves" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>
          <filter id="carDrop" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#9A3412" floodOpacity="0.3" />
          </filter>
        </defs>
        {/* Feathery Leaf Crest */}
        <path
          d="M24 14C23 10 20 6 17 4C18 7 20 9 22 12C19 10 16 8 13 9C16 11 19 12 21 14"
          stroke="url(#carLeaves)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M24 14C25 9 28 5 31 3C30 7 28 9 26 12C29 10 32 8 35 9C32 11 29 12 27 14"
          stroke="url(#carLeaves)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M24 14V3C23 7 24 10 24 14Z" stroke="url(#carLeaves)" strokeWidth="2.2" strokeLinecap="round" />
        {/* Tapered Conical Carrot Body */}
        <path
          d="M17 14C17 14 19 44 24 46C29 44 31 14 31 14C31 12.5 17 12.5 17 14Z"
          fill="url(#carBody)"
          filter="url(#carDrop)"
        />
        {/* Specular Highlight Streak */}
        <path d="M21 16C21 23 23 36 24 43" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
        {/* Transverse Natural Grooves */}
        <path d="M20 20H24" stroke="#7C2D12" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
        <path d="M25 25H28" stroke="#7C2D12" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
        <path d="M21 31H25" stroke="#7C2D12" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
        <path d="M23 37H26" stroke="#7C2D12" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.6" />
      </svg>
    );
  }

  // Generic produce fallback icon
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="18" fill="#10B981" />
      <path d="M24 12V24L32 28" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

/**
 * Gradient background themes for produce badges
 */
export const getProduceTheme = (commodity: string) => {
  const norm = commodity.toLowerCase();

  if (norm.includes('tomato') || norm.includes('தக்காளி')) {
    return {
      bgGradient: 'bg-gradient-to-br from-rose-50 via-rose-100 to-red-100',
      darkBgGradient: 'dark:from-rose-950/60 dark:via-red-950/40 dark:to-rose-900/30',
      border: 'border-rose-200/80 dark:border-rose-800/40',
      glow: 'shadow-[0_4px_16px_-2px_rgba(244,63,94,0.25)]',
      accentColor: 'text-rose-600',
      dotColor: 'bg-rose-500'
    };
  }
  if (norm.includes('onion') || norm.includes('வெங்காயம்')) {
    return {
      bgGradient: 'bg-gradient-to-br from-fuchsia-50 via-purple-100 to-pink-100',
      darkBgGradient: 'dark:from-fuchsia-950/60 dark:via-purple-950/40 dark:to-pink-900/30',
      border: 'border-fuchsia-200/80 dark:border-purple-800/40',
      glow: 'shadow-[0_4px_16px_-2px_rgba(217,70,239,0.25)]',
      accentColor: 'text-fuchsia-600',
      dotColor: 'bg-fuchsia-500'
    };
  }
  if (norm.includes('potato') || norm.includes('உருளை')) {
    return {
      bgGradient: 'bg-gradient-to-br from-amber-50 via-orange-100 to-amber-100',
      darkBgGradient: 'dark:from-amber-950/60 dark:via-yellow-950/40 dark:to-amber-900/30',
      border: 'border-amber-200/80 dark:border-amber-800/40',
      glow: 'shadow-[0_4px_16px_-2px_rgba(245,158,11,0.25)]',
      accentColor: 'text-amber-700',
      dotColor: 'bg-amber-600'
    };
  }
  if (norm.includes('brinjal') || norm.includes('eggplant') || norm.includes('கத்தரி')) {
    return {
      bgGradient: 'bg-gradient-to-br from-violet-50 via-purple-100 to-indigo-100',
      darkBgGradient: 'dark:from-violet-950/60 dark:via-purple-950/40 dark:to-indigo-900/30',
      border: 'border-violet-200/80 dark:border-violet-800/40',
      glow: 'shadow-[0_4px_16px_-2px_rgba(139,92,246,0.25)]',
      accentColor: 'text-violet-600',
      dotColor: 'bg-violet-500'
    };
  }
  if (norm.includes('cabbage') || norm.includes('கோஸ்') || norm.includes('முட்டைக்கோஸ்')) {
    return {
      bgGradient: 'bg-gradient-to-br from-emerald-50 via-teal-100 to-green-100',
      darkBgGradient: 'dark:from-emerald-950/60 dark:via-teal-950/40 dark:to-green-900/30',
      border: 'border-emerald-200/80 dark:border-emerald-800/40',
      glow: 'shadow-[0_4px_16px_-2px_rgba(16,185,129,0.25)]',
      accentColor: 'text-emerald-600',
      dotColor: 'bg-emerald-500'
    };
  }
  if (norm.includes('carrot') || norm.includes('கேரட்')) {
    return {
      bgGradient: 'bg-gradient-to-br from-orange-50 via-amber-100 to-orange-100',
      darkBgGradient: 'dark:from-orange-950/60 dark:via-amber-950/40 dark:to-orange-900/30',
      border: 'border-orange-200/80 dark:border-orange-800/40',
      glow: 'shadow-[0_4px_16px_-2px_rgba(249,115,22,0.25)]',
      accentColor: 'text-orange-600',
      dotColor: 'bg-orange-500'
    };
  }

  return {
    bgGradient: 'bg-gradient-to-br from-slate-50 via-slate-100 to-zinc-100',
    darkBgGradient: 'dark:from-slate-900 dark:via-slate-900/50 dark:to-zinc-900',
    border: 'border-slate-200 dark:border-slate-800',
    glow: 'shadow-xs',
    accentColor: 'text-slate-600',
    dotColor: 'bg-slate-500'
  };
};

/**
 * Reusable Produce Badge component with realistic styling and gradient backdrop
 */
export const ProduceBadge: React.FC<ProduceBadgeProps> = ({
  commodity,
  size = 'md',
  showBadge = true,
  className = ''
}) => {
  const cfg = sizeConfig[size];
  const theme = getProduceTheme(commodity);

  if (!showBadge) {
    return (
      <div className={`inline-flex items-center justify-center ${cfg.svg} ${className}`}>
        <ProduceIcon commodity={commodity} />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 border transition-transform duration-200 hover:scale-105 ${cfg.container} ${cfg.badge} ${cfg.ring} ${theme.bgGradient} ${theme.darkBgGradient} ${theme.border} ${theme.glow} ${className}`}
    >
      <ProduceIcon commodity={commodity} className={cfg.svg} />
    </div>
  );
};

export default ProduceBadge;
