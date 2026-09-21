import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { Room } from '../types.ts';
import {
  MessageSquare,
  Users,
  Search,
  Flame,
  MapPin,
  Sparkles,
  Palette,
  Trophy,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface ChatroomListProps {
  onSelectRoom: (roomId: string) => void;
}

export const ChatroomList: React.FC<ChatroomListProps> = ({ onSelectRoom }) => {
  const {
    currentUser,
    setIsWallpaperModalOpen,
    setIsRankProgressOpen,
  } = useChat();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'city' | 'topic' | 'social'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/rooms', window.location.origin);
      if (activeCategory !== 'all') url.searchParams.set('category', activeCategory);
      if (searchQuery) url.searchParams.set('search', searchQuery);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error('Failed to load chatrooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [activeCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRooms();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Chatrooms Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950 via-[#181938] to-indigo-950 border border-indigo-800/40 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold border border-violet-500/30">
              <Flame className="w-3.5 h-3.5 text-pink-400" />
              Regional &amp; Topic Chatrooms
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Community Chatrooms
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Hop into vibrant city lounges, cricket debates, movie reviews &amp; late night talks. Earn <strong className="text-amber-300">+5 Star XP</strong> with every message!
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsRankProgressOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-md"
            >
              <Trophy className="w-4 h-4" />
              <span>Rank &amp; Stars</span>
            </button>

            <button
              onClick={() => setIsWallpaperModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/40 text-violet-200 border border-violet-500/40 text-xs font-bold transition-all shadow-md"
            >
              <Palette className="w-4 h-4" />
              <span>Wallpapers</span>
            </button>
          </div>
        </div>

        {/* Decorative ambient backdrop */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Rooms', icon: Sparkles },
            { id: 'city', label: 'City Lounges', icon: MapPin },
            { id: 'topic', label: 'Topics & Sports', icon: Flame },
            { id: 'social', label: 'Social & Dating', icon: Users },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-500/50'
                    : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-indigo-950'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rooms, tags or city..."
            className="w-full bg-[#12132b] border border-indigo-900/60 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-44 rounded-2xl bg-slate-900/40 border border-indigo-950 animate-pulse p-5"
            />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/30 border border-indigo-950">
          <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white mb-1">No Chatrooms Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different room category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-[#12132b]/90 hover:bg-[#161836] border border-indigo-900/50 hover:border-violet-500/60 transition-all duration-200 cursor-pointer shadow-lg shadow-black/20 hover:shadow-violet-950/20 hover:-translate-y-0.5"
              >
                <div>
                  {/* Top Bar: Icon, Name & Active Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="text-2xl p-2 rounded-xl bg-slate-900/80 border border-indigo-900/60 shadow-inner group-hover:scale-110 transition-transform">
                        {room.icon || '💬'}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white group-hover:text-violet-300 transition-colors">
                          {room.name}
                        </h3>
                        <span className="text-[11px] font-medium text-slate-400">
                          {room.popularLanguage || 'Regional'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-0.8 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{room.activeCount} online</span>
                    </div>
                  </div>

                  {/* Room Description */}
                  <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                    {room.description}
                  </p>

                  {/* Tags */}
                  {room.tags && room.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-3">
                      {room.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-900/40 text-slate-300 text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Recent Activity & Join Button */}
                <div className="mt-4 pt-3 border-t border-indigo-950/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate max-w-[170px]">
                    {room.lastMessage ? (
                      <span className="truncate">
                        <strong className="text-slate-300">{room.lastMessage.senderName}:</strong> {room.lastMessage.text}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Active conversation happening</span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-400 group-hover:text-violet-300 group-hover:translate-x-0.5 transition-all">
                    <span>Enter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
