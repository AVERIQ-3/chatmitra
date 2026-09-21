import { UserRank } from '../types.ts';

export interface RankDefinition {
  rank: UserRank;
  level: number;
  minXp: number;
  maxXp: number;
  stars: string;
  starCount: number;
  badgeColor: string;
  textColor: string;
  borderColor: string;
  description: string;
}

export const RANK_DEFINITIONS: RankDefinition[] = [
  {
    rank: 'Novice',
    level: 1,
    minXp: 0,
    maxXp: 99,
    stars: '★',
    starCount: 1,
    badgeColor: 'bg-slate-700/80',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-500/40',
    description: 'Fresh to the chat universe',
  },
  {
    rank: 'Amateur',
    level: 2,
    minXp: 100,
    maxXp: 249,
    stars: '★',
    starCount: 1,
    badgeColor: 'bg-blue-900/60',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-500/40',
    description: 'Starting conversations',
  },
  {
    rank: 'Junior',
    level: 3,
    minXp: 250,
    maxXp: 599,
    stars: '★★',
    starCount: 2,
    badgeColor: 'bg-cyan-900/60',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-500/40',
    description: 'Active chatter',
  },
  {
    rank: 'Senior',
    level: 4,
    minXp: 600,
    maxXp: 1199,
    stars: '★★★',
    starCount: 3,
    badgeColor: 'bg-emerald-900/60',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    description: 'Friendly regular',
  },
  {
    rank: 'Expert',
    level: 5,
    minXp: 1200,
    maxXp: 2499,
    stars: '★★★★',
    starCount: 4,
    badgeColor: 'bg-amber-900/60',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-500/40',
    description: 'Experienced conversationalist',
  },
  {
    rank: 'Leader',
    level: 6,
    minXp: 2500,
    maxXp: 4999,
    stars: '★★★★★',
    starCount: 5,
    badgeColor: 'bg-indigo-900/70',
    textColor: 'text-indigo-300',
    borderColor: 'border-indigo-400/50',
    description: 'Community leader',
  },
  {
    rank: 'Master',
    level: 7,
    minXp: 5000,
    maxXp: 9999,
    stars: '👑 Master',
    starCount: 6,
    badgeColor: 'bg-purple-900/70',
    textColor: 'text-purple-200',
    borderColor: 'border-purple-400/60',
    description: 'Chatroom master',
  },
  {
    rank: 'Grandmaster',
    level: 8,
    minXp: 10000,
    maxXp: 19999,
    stars: '💎 Grandmaster',
    starCount: 7,
    badgeColor: 'bg-sky-950/80',
    textColor: 'text-sky-200',
    borderColor: 'border-sky-400/60',
    description: 'Elite networker',
  },
  {
    rank: 'Guru',
    level: 9,
    minXp: 20000,
    maxXp: 34999,
    stars: '🔥 Guru',
    starCount: 8,
    badgeColor: 'bg-orange-950/80',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-400/60',
    description: 'Legendary presence',
  },
  {
    rank: 'Legend',
    level: 10,
    minXp: 35000,
    maxXp: 59999,
    stars: '⚡ Legend',
    starCount: 9,
    badgeColor: 'bg-rose-950/80',
    textColor: 'text-rose-300',
    borderColor: 'border-rose-400/70',
    description: 'Unstoppable icon',
  },
  {
    rank: 'Ultimate',
    level: 11,
    minXp: 60000,
    maxXp: 999999,
    stars: '🌟 Ultimate',
    starCount: 10,
    badgeColor: 'bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-cyan-500/20',
    textColor: 'text-amber-200',
    borderColor: 'border-amber-400/80',
    description: 'Supreme Star Champion',
  },
];

export const RANK_TIERS = RANK_DEFINITIONS;

export function getRankBadgeStyle(rank: UserRank | string) {
  const def = RANK_DEFINITIONS.find((r) => r.rank === rank) || RANK_DEFINITIONS[0];
  return {
    badgeClass: `${def.badgeColor} ${def.textColor} ${def.borderColor}`,
    textColor: def.textColor,
    borderColor: def.borderColor,
    badgeColor: def.badgeColor,
    stars: def.stars,
    level: def.level,
  };
}

export function getRankInfo(xp: number = 0) {
  const safeXp = Math.max(0, xp);
  const def =
    RANK_DEFINITIONS.find((r) => safeXp >= r.minXp && safeXp <= r.maxXp) ||
    RANK_DEFINITIONS[RANK_DEFINITIONS.length - 1];

  const currentLevelXp = safeXp - def.minXp;
  const levelRange = def.maxXp - def.minXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((currentLevelXp / (levelRange || 1)) * 100))
  );

  const nextRankDef =
    RANK_DEFINITIONS.find((r) => r.level === def.level + 1) || null;

  const xpToNextRank = nextRankDef ? Math.max(0, nextRankDef.minXp - safeXp) : 0;

  return {
    ...def,
    xp: safeXp,
    progressPercent,
    nextRank: nextRankDef?.rank || null,
    nextRankDef,
    xpToNextRank,
    xpNeededForNext: xpToNextRank,
  };
}
