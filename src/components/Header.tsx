import React from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { RankBadge } from './RankBadge.tsx';
import {
  Compass,
  Shuffle,
  MessageSquare,
  Users,
  ShieldCheck,
  User,
  Activity,
  Lock,
  ChevronDown,
  Palette,
  Flame,
  Trophy,
  Target,
  Sparkles,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    unreadTotal,
    friends,
    dailyMissions,
    setIsMissionsModalOpen,
    setIsProfileOpen,
    setIsAuthModalOpen,
    setIsSafetyOpen,
    setIsRankProgressOpen,
    setIsWallpaperModalOpen,
  } = useChat();

  const unclaimedMissions = dailyMissions?.unclaimedCount || 0;
  const streakDays = dailyMissions?.streakDays || 1;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#131428]/95 backdrop-blur-md border-b border-indigo-950/60 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab('discover')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-[#101124] rounded-[10px] flex items-center justify-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-tr from-violet-400 to-pink-400 font-black text-xl tracking-tighter">
                  CM
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-purple-300 transition-colors">
                  ChatMitra
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  FREE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 hidden lg:block font-medium">
                Meet &amp; chat with people nearby
              </p>
            </div>
          </div>

          {/* Live Online Badge */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-indigo-900/50 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>
              <strong className="text-emerald-400 font-bold">1,248+</strong> online
            </span>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#181a36]/80 p-1 rounded-xl border border-indigo-950/80 shadow-inner">
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'discover'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-700/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="hidden md:inline">Discover</span>
          </button>

          {/* Chatrooms Tab */}
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'rooms'
                ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Rooms</span>
            <span className="px-1 py-0.2 rounded text-[9px] bg-pink-500/20 text-pink-300 font-bold hidden lg:inline">
              HOT
            </span>
          </button>

          <button
            onClick={() => setActiveTab('match')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'match'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden md:inline">Match</span>
          </button>

          <button
            onClick={() => setActiveTab('chats')}
            className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'chats'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-700/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden md:inline">Chats</span>
            {unreadTotal > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-pink-500 text-white text-[10px] font-bold animate-pulse">
                {unreadTotal}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'friends'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-700/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden lg:inline">Friends</span>
            {friends.length > 0 && (
              <span className="text-[11px] text-slate-400 font-medium">({friends.length})</span>
            )}
          </button>
        </nav>

        {/* Right Section: Wallpaper, Rank, Safety & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Daily Missions & Streak Button */}
          {currentUser && (
            <button
              id="header-daily-missions-btn"
              onClick={() => setIsMissionsModalOpen(true)}
              title="Daily Missions & Streak Rewards"
              className="relative flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/30 hover:border-amber-400/70 text-amber-300 text-xs font-semibold transition-all hover:scale-105 shadow-sm group"
            >
              <div className="flex items-center gap-1 text-orange-400 group-hover:text-orange-300">
                <Flame className="w-3.5 h-3.5 fill-orange-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-[11px] text-amber-200">{streakDays}d</span>
              </div>
              <span className="hidden md:inline text-[11px] text-amber-300/90 font-medium">Missions</span>
              {unclaimedMissions > 0 && (
                <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-[10px] font-black animate-pulse shadow-sm">
                  {unclaimedMissions}
                </span>
              )}
            </button>
          )}

          {/* Quick Wallpaper Button */}
          <button
            onClick={() => setIsWallpaperModalOpen(true)}
            title="Chat Wallpapers"
            className="p-2 rounded-xl text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/30 transition-all text-xs flex items-center gap-1"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Star Rank Progress Button */}
          {currentUser && (
            <button
              onClick={() => setIsRankProgressOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[#181a38] border border-amber-500/30 hover:border-amber-500/60 text-amber-300 text-xs font-semibold transition-all hover:scale-105"
              title="View Rank & Stars Progress"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="font-bold">{currentUser.rank || 'Novice'}</span>
              <span className="text-[10px] text-amber-400 font-mono">{currentUser.stars || '★'}</span>
            </button>
          )}

          {/* Safety Button */}
          <button
            onClick={() => setIsSafetyOpen(true)}
            title="Safety Guidelines & Rules"
            className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition-all text-xs flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* User Profile Chip */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-indigo-900/60 hover:border-indigo-600/60 transition-all text-left"
              >
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.displayName}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-purple-500/40"
                    referrerPolicy="no-referrer"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#101124] ${
                      currentUser.status === 'online'
                        ? 'bg-emerald-500'
                        : currentUser.status === 'away'
                        ? 'bg-amber-500'
                        : 'bg-slate-500'
                    }`}
                  />
                </div>
                <div className="hidden sm:block text-xs leading-tight">
                  <div className="font-semibold text-slate-200 flex items-center gap-1">
                    <span className="truncate max-w-[85px]">{currentUser.displayName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>Lv.{currentUser.level || 1}</span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5 hidden sm:block" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 transition-all"
            >
              <User className="w-3.5 h-3.5" />
              Join Chat
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

