import React from 'react';
import { useChat } from '../context/ChatContext.tsx';
import {
  Users,
  MessageCircle,
  Phone,
  Video,
  UserMinus,
  Sparkles,
  MapPin,
  Globe,
  Lock,
} from 'lucide-react';

export const FriendsView: React.FC = () => {
  const {
    currentUser,
    friends,
    removeFriend,
    startConversation,
    initiateCall,
    setIsAuthModalOpen,
    setActiveTab,
  } = useChat();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-fade-in space-y-6">
      {/* Top Banner */}
      <div className="bg-[#14152b] border border-indigo-950 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white">Your Friends &amp; Connections</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Keep in touch with people you connected with on ChatMitra. Call or chat anytime.
          </p>
        </div>

        {currentUser?.isGuest && (
          <div className="flex items-center gap-3 bg-violet-950/40 border border-violet-900/50 p-3 rounded-xl text-xs">
            <Lock className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="text-slate-300">
              You are on a temporary guest session. Create a free account so you never lose your friends!
            </span>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-xs shrink-0 shadow-md shadow-violet-600/30 hover:opacity-90"
            >
              Save Now
            </button>
          </div>
        )}
      </div>

      {/* Friends Grid */}
      {friends.length === 0 ? (
        <div className="text-center py-20 px-4 bg-[#14152b]/60 border border-indigo-950 rounded-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950 flex items-center justify-center text-slate-500 mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-lg text-white">No friends connected yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Explore people nearby in the <strong>Discover</strong> tab or use <strong>Quick Match</strong> to find new friends!
          </p>
          <button
            onClick={() => setActiveTab('discover')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 transition-all"
          >
            Explore Discover
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="bg-[#14152b] hover:bg-[#181a34] border border-indigo-950 hover:border-violet-600/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={friend.avatar}
                        alt={friend.displayName}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-900"
                        referrerPolicy="no-referrer"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#14152b] ${
                          friend.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{friend.displayName}</h4>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>{friend.approximateLocation}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm(`Remove ${friend.displayName} from your friends?`)) {
                        removeFriend(friend.id);
                      }
                    }}
                    title="Remove Friend"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>

                {friend.bio && (
                  <p className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded-lg border border-indigo-950/40 mb-3 line-clamp-2">
                    &ldquo;{friend.bio}&rdquo;
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{(friend.languages || [friend.language]).join(', ')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-indigo-950/80 space-y-2">
                <button
                  onClick={() => startConversation(friend.id)}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-700/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Open Chat
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => initiateCall(friend, 'voice')}
                    className="py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-300 border border-indigo-950 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Voice Call
                  </button>

                  <button
                    onClick={() => initiateCall(friend, 'video')}
                    className="py-1.5 rounded-lg bg-slate-900 hover:bg-violet-600/20 text-slate-300 hover:text-violet-300 border border-indigo-950 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <Video className="w-3.5 h-3.5 text-violet-400" />
                    Video Call
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
