import React from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { RANK_TIERS, getRankInfo } from '../utils/rankUtils.ts';
import { RankBadge } from './RankBadge.tsx';
import { X, Trophy, Sparkles, MessageSquare, Users, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const RankProgressModal: React.FC = () => {
  const { currentUser, isRankProgressOpen, setIsRankProgressOpen } = useChat();

  if (!isRankProgressOpen || !currentUser) return null;

  const currentXp = currentUser.xp || 0;
  const rankInfo = getRankInfo(currentXp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#12132b] border border-indigo-900/60 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header Banner */}
        <div className="relative p-6 bg-gradient-to-r from-violet-900/80 via-indigo-900/70 to-purple-950/80 border-b border-indigo-800/40">
          <button
            onClick={() => setIsRankProgressOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Star Rank &amp; XP System
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200/80 font-medium">
                Level up by chatting, making friends &amp; engaging in public chatrooms
              </p>
            </div>
          </div>

          {/* Current Rank Card */}
          <div className="mt-4 p-4 rounded-xl bg-[#0b0c1c]/80 border border-indigo-700/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={currentUser.avatar}
                alt={currentUser.displayName}
                className="w-13 h-13 rounded-xl object-cover border-2 border-indigo-500/50"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-base">
                    {currentUser.displayName}
                  </span>
                  <RankBadge
                    rank={rankInfo.rank}
                    stars={rankInfo.stars}
                    level={rankInfo.level}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Total Activity: <strong className="text-violet-300">{currentXp.toLocaleString()} XP</strong>
                </p>
              </div>
            </div>

            {rankInfo.nextRank && (
              <div className="w-full sm:w-48 text-right">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
                  <span>Next: <strong className="text-amber-400">{rankInfo.nextRank}</strong></span>
                  <span>{rankInfo.progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-indigo-900/40">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-amber-400 transition-all duration-500"
                    style={{ width: `${rankInfo.progressPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  {rankInfo.xpToNextRank.toLocaleString()} XP needed
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {/* How to Earn XP */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-400" />
              How to Earn Star XP
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-xs mb-1">
                  <MessageSquare className="w-4 h-4" />
                  +10 XP
                </div>
                <h4 className="text-xs font-semibold text-white">1-on-1 Chats</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Send messages to matched strangers and connections.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40">
                <div className="flex items-center gap-2 text-pink-400 font-bold text-xs mb-1">
                  <Flame className="w-4 h-4" />
                  +5 XP
                </div>
                <h4 className="text-xs font-semibold text-white">Chatrooms</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Participate in regional city and topic public rooms.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                  <Users className="w-4 h-4" />
                  +50 XP
                </div>
                <h4 className="text-xs font-semibold text-white">Accept Friends</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Expand your circle and convert connections into friends.
                </p>
              </div>
            </div>
          </div>

          {/* Ranks Ladder */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              All Star Ranks
            </h3>
            <div className="space-y-2">
              {RANK_TIERS.map((tier) => {
                const isCurrent = tier.rank === rankInfo.rank;
                const isPassed = currentXp >= tier.minXp;

                return (
                  <div
                    key={tier.rank}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-900/30'
                        : isPassed
                        ? 'bg-slate-900/40 border-slate-800/80 opacity-80'
                        : 'bg-slate-900/20 border-slate-800/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs bg-slate-800 text-slate-300 font-mono">
                        {tier.level}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">
                            {tier.rank}
                          </span>
                          <span className="text-xs font-mono text-amber-300">
                            {tier.stars}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                              YOU ARE HERE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {tier.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs text-slate-300">
                      {isPassed ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          {tier.minXp.toLocaleString()} XP
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0d0e22] border-t border-indigo-900/40 flex justify-end">
          <button
            onClick={() => setIsRankProgressOpen(false)}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/30 transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
