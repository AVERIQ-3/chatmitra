import React from 'react';
import { ChatProvider, useChat } from './context/ChatContext.tsx';
import { Header } from './components/Header.tsx';
import { DiscoverView } from './components/DiscoverView.tsx';
import { QuickMatchView } from './components/QuickMatchView.tsx';
import { RoomsView } from './components/RoomsView.tsx';
import { ChatView } from './components/ChatView.tsx';
import { FriendsView } from './components/FriendsView.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { CallModal } from './components/CallModal.tsx';
import { GuestOnboardingModal } from './components/GuestOnboardingModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ReportModal } from './components/ReportModal.tsx';
import { SafetyGuidelinesModal } from './components/SafetyGuidelinesModal.tsx';
import { WallpaperSelector } from './components/WallpaperSelector.tsx';
import { RankProgressModal } from './components/RankProgressModal.tsx';
import { DailyMissionsModal } from './components/DailyMissionsModal.tsx';
import { Shield, Sparkles, Heart, Trophy, X } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsSafetyOpen,
    xpToast,
    clearXpToast,
    setIsRankProgressOpen,
  } = useChat();

  return (
    <div className="min-h-screen bg-[#0d0e1f] text-slate-100 flex flex-col font-sans selection:bg-violet-600 selection:text-white relative">
      {/* XP Toast / Level Up Floating Banner */}
      {xpToast && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-violet-600 to-pink-600 text-white shadow-2xl border border-amber-300/40 backdrop-blur-md">
            <div className="p-2 rounded-xl bg-white/20">
              <Trophy className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>{xpToast.text}</span>
                {xpToast.stars && <span className="font-mono text-amber-200">{xpToast.stars}</span>}
              </div>
              <button
                onClick={() => {
                  clearXpToast();
                  setIsRankProgressOpen(true);
                }}
                className="text-[10px] text-amber-200 underline hover:text-white font-medium mt-0.5"
              >
                View Star Rank Ladder &rarr;
              </button>
            </div>
            <button
              onClick={clearXpToast}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header />

      {/* Main Body View Switching */}
      <main className="flex-1">
        {activeTab === 'discover' && <DiscoverView />}
        {activeTab === 'rooms' && <RoomsView />}
        {activeTab === 'match' && <QuickMatchView />}
        {activeTab === 'chats' && <ChatView />}
        {activeTab === 'friends' && <FriendsView />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Floating Call & Interaction Modals */}
      <CallModal />
      <GuestOnboardingModal />
      <ProfileModal />
      <AuthModal />
      <ReportModal />
      <SafetyGuidelinesModal />
      <WallpaperSelector />
      <RankProgressModal />
      <DailyMissionsModal />

      {/* Footer */}
      <footer className="w-full bg-[#0a0b18] border-t border-indigo-950/60 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300">ChatMitra</span>
            <span>&bull;</span>
            <span>Instant Community &amp; Stranger Lounge</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsSafetyOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Safety Guidelines
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className="hover:text-amber-400 transition-colors"
            >
              Admin Portal
            </button>
            <span className="text-slate-600">&bull;</span>
            <span className="flex items-center gap-1 text-slate-400">
              Made with <Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> for friendly connections
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ChatProvider>
      <MainContent />
    </ChatProvider>
  );
}
