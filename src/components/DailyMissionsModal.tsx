import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Flame,
  Trophy,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Users,
  Compass,
  UserCheck,
  Palette,
  Gift,
  ChevronRight,
  Clock,
  Zap,
  Award,
} from 'lucide-react';
import { useChat } from '../context/ChatContext.tsx';
import { DailyMission } from '../types.ts';

export const DailyMissionsModal: React.FC = () => {
  const {
    isMissionsModalOpen,
    setIsMissionsModalOpen,
    dailyMissions,
    claimMissionReward,
    claimDailyCheckIn,
    claimGrandMasterBonus,
    setActiveTab,
    setIsProfileOpen,
    setIsWallpaperModalOpen,
  } = useChat();

  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Calculate countdown to midnight UTC
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const diffMs = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isMissionsModalOpen) return null;

  const missions = dailyMissions?.missions || [];
  const streakDays = dailyMissions?.streakDays || 1;
  const completedMissions = missions.filter((m) => m.claimed).length;
  const totalMissions = missions.length || 6;
  const allMissionsClaimed = totalMissions > 0 && completedMissions === totalMissions;
  const grandBonusClaimed = Boolean(dailyMissions?.allClaimedBonusAwarded);
  const totalAvailableXp = missions.reduce((acc, m) => acc + m.rewardXp, 0) + (dailyMissions?.totalBonusXp || 100);

  const getMissionIcon = (iconName: string, category: string) => {
    switch (iconName) {
      case 'checkin':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'room':
        return <Users className="w-5 h-5 text-indigo-400" />;
      case 'profile':
        return <UserCheck className="w-5 h-5 text-sky-400" />;
      case 'match':
        return <Compass className="w-5 h-5 text-rose-400" />;
      case 'style':
        return <Palette className="w-5 h-5 text-fuchsia-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
  };

  const handleAction = (mission: DailyMission) => {
    setIsMissionsModalOpen(false);
    if (mission.actionType === 'open_profile') {
      setIsProfileOpen(true);
    } else if (mission.actionType === 'open_wallpaper') {
      setIsWallpaperModalOpen(true);
    } else if (mission.actionTab) {
      setActiveTab(mission.actionTab);
    }
  };

  const handleClaim = async (missionId: string) => {
    setClaimingId(missionId);
    if (missionId === 'daily_checkin') {
      await claimDailyCheckIn();
    } else {
      await claimMissionReward(missionId);
    }
    setClaimingId(null);
  };

  const handleClaimGrandBonus = async () => {
    setClaimingId('grand_chest');
    await claimGrandMasterBonus();
    setClaimingId(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-gradient-to-b from-[#181d28] via-[#12151e] to-[#0d1017] border border-amber-500/20 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-auto"
        >
          {/* Ambient header glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-500/15 blur-3xl pointer-events-none" />

          {/* Top Bar */}
          <div className="relative px-5 pt-5 pb-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-2 ring-amber-400/30">
                <Trophy className="w-5 h-5 text-amber-950 font-bold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  Daily Missions & Rewards
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
                    +{totalAvailableXp} XP Available
                  </span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400/80" />
                  <span>Resets in:</span>
                  <span className="font-mono text-amber-300 font-semibold">{timeLeft || '24:00:00'}</span>
                </div>
              </div>
            </div>

            <button
              id="close-daily-missions-btn"
              onClick={() => setIsMissionsModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 max-h-[75vh] overflow-y-auto space-y-4 custom-scrollbar">
            {/* Streak & Engagement Showcase Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-orange-950/40 via-amber-950/30 to-amber-900/20 border border-amber-500/30 shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30 ring-2 ring-amber-300/40 animate-pulse">
                      <Flame className="w-7 h-7 text-amber-950 fill-amber-950" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-amber-400 text-amber-950 text-[10px] font-black rounded-full shadow">
                      {streakDays}d
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-200 text-sm">
                        {streakDays} Day Login Streak
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                        +{Math.min(streakDays * 5, 50)} Streak XP Multiplier
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/70 mt-0.5">
                      Log in every 24h to rank up faster and earn higher ladder stars.
                    </p>
                  </div>
                </div>

                {/* 7-Day Mini Calendar Indicators */}
                <div className="hidden sm:flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const isPassed = (streakDays % 7 || 7) >= day;
                    return (
                      <div
                        key={day}
                        className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-md text-[10px] font-bold ${
                          isPassed
                            ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                            : 'bg-slate-800/60 text-slate-500 border border-slate-700/30'
                        }`}
                      >
                        <span>D{day}</span>
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPassed ? 'bg-amber-400 shadow-sm shadow-amber-300' : 'bg-slate-700'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grand Master Bonus Progress Bar */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span>Daily Grand Master Chest</span>
                  <span className="text-amber-400 font-bold">(+100 Bonus XP)</span>
                </div>
                <span className="font-bold text-amber-300">
                  {completedMissions}/{totalMissions} Completed
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/60">
                <motion.div
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(completedMissions / Math.max(totalMissions, 1)) * 100}%` }}
                />
              </div>

              {allMissionsClaimed && (
                <div className="pt-1">
                  {grandBonusClaimed ? (
                    <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Grand Master Bonus Claimed for Today!
                    </div>
                  ) : (
                    <button
                      id="claim-grand-chest-btn"
                      onClick={handleClaimGrandBonus}
                      disabled={claimingId === 'grand_chest'}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-amber-950 hover:brightness-110 active:scale-[0.99] transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-950" />
                      {claimingId === 'grand_chest' ? 'Claiming Chest...' : 'Claim Grand Master Chest (+100 XP)'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Missions List */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Today's Objectives
              </h3>

              {missions.map((mission) => {
                const isClaimed = mission.claimed;
                const isCompleted = mission.completed;
                const progressPct = Math.min(100, Math.round((mission.currentCount / mission.targetCount) * 100));

                return (
                  <div
                    key={mission.id}
                    className={`p-3.5 rounded-xl border transition-all duration-200 ${
                      isClaimed
                        ? 'bg-slate-900/40 border-slate-800/60 opacity-65'
                        : isCompleted
                        ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/40 shadow-sm shadow-amber-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isClaimed
                              ? 'bg-slate-800 text-slate-500'
                              : isCompleted
                              ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40'
                              : 'bg-slate-800/80 text-slate-300'
                          }`}
                        >
                          {getMissionIcon(mission.icon, mission.category)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-semibold ${isClaimed ? 'line-through text-slate-400' : 'text-white'}`}>
                              {mission.title}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              +{mission.rewardXp} XP
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                            {mission.description}
                          </p>

                          {/* Progress counter & bar */}
                          {!isClaimed && (
                            <div className="mt-2 flex items-center gap-2 max-w-[200px]">
                              <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">
                                {mission.currentCount}/{mission.targetCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action / Claim Button */}
                      <div className="flex-shrink-0 flex items-center self-center">
                        {isClaimed ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Claimed
                          </span>
                        ) : isCompleted ? (
                          <button
                            id={`claim-mission-${mission.id}`}
                            onClick={() => handleClaim(mission.id)}
                            disabled={claimingId === mission.id}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-amber-950 hover:brightness-110 shadow-md shadow-orange-500/20 active:scale-95 transition flex items-center gap-1.5 animate-pulse"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-950" />
                            {claimingId === mission.id ? 'Claiming...' : 'Claim Reward'}
                          </button>
                        ) : (
                          <button
                            id={`action-mission-${mission.id}`}
                            onClick={() => handleAction(mission)}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 border border-slate-700"
                          >
                            <span>{mission.actionLabel || 'Go'}</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Motivational Footer Note */}
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-400">
              <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                Leveling up elevates your <strong>Rank Ladder</strong> tier (Novice → Star → Master → Elite) and unlocks premium badges in chatrooms!
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
