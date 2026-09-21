import React from 'react';
import { UserRank } from '../types.ts';
import { getRankBadgeStyle, getRankInfo } from '../utils/rankUtils.ts';
import { Sparkles, Trophy, Award, Flame, Zap, Crown } from 'lucide-react';

interface RankBadgeProps {
  rank?: UserRank | string;
  stars?: string;
  level?: number;
  xp?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showStars?: boolean;
  showLevel?: boolean;
  onClick?: () => void;
  className?: string;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  rank,
  stars,
  level,
  xp,
  size = 'sm',
  showStars = true,
  showLevel = false,
  onClick,
  className = '',
}) => {
  // If only xp is provided, calculate rank info dynamically
  const rankInfo = xp !== undefined ? getRankInfo(xp) : null;
  const resolvedRank = (rank || rankInfo?.rank || 'Novice') as UserRank;
  const resolvedStars = stars || rankInfo?.stars || '★';
  const resolvedLevel = level || rankInfo?.level || 1;

  const style = getRankBadgeStyle(resolvedRank);

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.2 gap-1 rounded',
    sm: 'text-xs px-2 py-0.5 gap-1.5 rounded-md',
    md: 'text-sm px-2.5 py-1 gap-2 rounded-lg',
    lg: 'text-base px-3.5 py-1.5 gap-2.5 rounded-xl font-bold',
  };

  const getRankIcon = () => {
    switch (resolvedRank) {
      case 'Ultimate':
        return <Crown className="w-3.5 h-3.5 text-amber-300 animate-pulse" />;
      case 'Legend':
        return <Zap className="w-3.5 h-3.5 text-yellow-300" />;
      case 'Guru':
        return <Flame className="w-3.5 h-3.5 text-orange-400" />;
      case 'Grandmaster':
      case 'Master':
        return <Trophy className="w-3 h-3 text-cyan-300" />;
      case 'Leader':
      case 'Expert':
        return <Award className="w-3 h-3 text-emerald-300" />;
      default:
        return <Sparkles className="w-3 h-3 text-blue-300" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center font-semibold border shadow-sm transition-all duration-200 select-none ${
        style.badgeClass
      } ${sizeClasses[size]} ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${className}`}
      title={`Rank: ${resolvedRank} (${resolvedStars}) - Level ${resolvedLevel}`}
    >
      {getRankIcon()}
      <span className="tracking-tight">{resolvedRank}</span>
      {showStars && (
        <span className="opacity-90 font-mono tracking-tighter text-[11px] scale-90">
          {resolvedStars}
        </span>
      )}
      {showLevel && (
        <span className="ml-0.5 px-1 py-0.2 rounded bg-black/30 text-[10px] font-mono text-white/90">
          Lv.{resolvedLevel}
        </span>
      )}
    </div>
  );
};
