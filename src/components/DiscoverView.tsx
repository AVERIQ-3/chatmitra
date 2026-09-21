import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { UserProfile, Gender } from '../types.ts';
import { SUPPORTED_LANGUAGES } from '../../server/data.ts';
import {
  Search,
  Filter,
  MapPin,
  Globe,
  MessageCircle,
  Phone,
  Video,
  UserPlus,
  MoreVertical,
  ShieldAlert,
  Ban,
  Sparkles,
  RefreshCw,
  Flame,
  Radio,
  Check,
  Trophy,
  Gift,
  ChevronRight,
  Target,
} from 'lucide-react';
import { RankBadge } from './RankBadge.tsx';

export const DiscoverView: React.FC = () => {
  const {
    currentUser,
    startConversation,
    initiateCall,
    addFriend,
    blockUser,
    setReportingUser,
    friends,
    dailyMissions,
    setIsMissionsModalOpen,
  } = useChat();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [selectedGender, setSelectedGender] = useState<Gender>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [availability, setAvailability] = useState<'all' | 'online_now'>('all');
  const [locationFilter, setLocationFilter] = useState<'any' | 'nearby'>('any');
  const [sortBy, setSortBy] = useState<'recently_active' | 'nearby' | 'recently_joined'>('recently_active');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [friendActionStatus, setFriendActionStatus] = useState<Record<string, string>>({});

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        gender: selectedGender,
        language: selectedLanguage === 'All' ? '' : selectedLanguage,
        availability,
        location: locationFilter,
        sortBy,
        search: debouncedSearch,
        page: String(page),
        limit: '12',
      });

      const token = localStorage.getItem('chatmitra_token');
      const res = await fetch(`/api/users/discover?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalUsers(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch discover users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGender, selectedLanguage, availability, locationFilter, sortBy, debouncedSearch, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStartChat = async (targetUserId: string) => {
    await startConversation(targetUserId);
  };

  const handleAddFriend = async (targetUser: UserProfile) => {
    setFriendActionStatus((prev) => ({ ...prev, [targetUser.id]: 'adding' }));
    const result = await addFriend(targetUser.id);
    if (result.success) {
      setFriendActionStatus((prev) => ({ ...prev, [targetUser.id]: 'added' }));
    } else {
      setFriendActionStatus((prev) => ({ ...prev, [targetUser.id]: '' }));
    }
  };

  const handleBlock = async (targetUserId: string) => {
    if (window.confirm('Are you sure you want to block this user? They will not be able to message or match with you.')) {
      await blockUser(targetUserId);
      setUsers((prev) => prev.filter((u) => u.id !== targetUserId));
      setOpenMenuId(null);
    }
  };

  const isFriend = (userId: string) => friends.some((f) => f.id === userId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Top Banner / Welcome card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/60 via-indigo-900/40 to-slate-900/80 border border-violet-800/40 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold mb-3 border border-violet-500/30">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            Discover Genuine Connections
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            Chat with people nearby &amp; speak your language.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2">
            No signup required. Filter by language, city, or gender to start private text and audio/video conversations instantly.
          </p>
        </div>
      </div>

      {/* Daily Missions & Streak Engagement Bar */}
      {currentUser && (
        <div className="bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-orange-950/30 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/25 ring-2 ring-amber-400/30 flex-shrink-0">
              <Flame className="w-6 h-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white">
                  Daily Missions &amp; {dailyMissions?.streakDays || 1}-Day Streak
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Earn XP
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Complete today&apos;s 6 simple tasks (Send messages, join public lounges, update bio) to level up your star rank badge.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-amber-300 block">
                {dailyMissions?.completedCount || 0}/6 Completed
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {dailyMissions?.unclaimedCount ? `${dailyMissions.unclaimedCount} reward(s) ready` : 'Up to +280 XP today'}
              </span>
            </div>

            <button
              id="discover-open-missions-btn"
              onClick={() => setIsMissionsModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition-all shadow-md shadow-orange-500/20 active:scale-95 flex items-center gap-1.5 flex-shrink-0"
            >
              <span>View Missions</span>
              <ChevronRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-[#14152b] border border-indigo-950/90 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        {/* Search & Quick Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by nickname, city, or interests (e.g. Movies, Telugu, Music)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-indigo-950 focus:border-violet-500 text-white placeholder-slate-500 text-sm outline-none transition-all"
            />
          </div>

          {/* Gender Filter */}
          <div className="md:col-span-3 flex items-center bg-slate-900/90 p-1 rounded-xl border border-indigo-950">
            {(['All', 'Female', 'Male'] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => {
                  setSelectedGender(g);
                  setPage(1);
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedGender === g
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {g === 'All' ? 'All' : g === 'Female' ? '👧 Female' : '👦 Male'}
              </button>
            ))}
          </div>

          {/* Online Only Toggle */}
          <div className="md:col-span-3 flex items-center gap-2">
            <button
              onClick={() => {
                setAvailability(availability === 'online_now' ? 'all' : 'online_now');
                setPage(1);
              }}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                availability === 'online_now'
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-900/90 border-indigo-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Online Now Only
            </button>
          </div>
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-indigo-950/60 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-indigo-950">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400 font-medium">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs"
              >
                <option value="All" className="bg-slate-900 text-white">
                  All Languages
                </option>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l} value={l} className="bg-slate-900 text-white">
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Distance / Nearby Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-indigo-950">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400 font-medium">Location:</span>
              <select
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value as any);
                  setPage(1);
                }}
                className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs"
              >
                <option value="any" className="bg-slate-900 text-white">
                  Any Location
                </option>
                <option value="nearby" className="bg-slate-900 text-white">
                  Nearby (Within 300km)
                </option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-indigo-950">
              <Filter className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-400 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs"
              >
                <option value="recently_active" className="bg-slate-900 text-white">
                  Recently Active
                </option>
                <option value="nearby" className="bg-slate-900 text-white">
                  Closest Distance
                </option>
                <option value="recently_joined" className="bg-slate-900 text-white">
                  Newest Members
                </option>
              </select>
            </div>
          </div>

          {/* User count & Refresh */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Showing <strong className="text-white">{users.length}</strong> of{' '}
              <strong className="text-white">{totalUsers}</strong> people
            </span>
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              title="Refresh list"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-indigo-950 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {isLoading && users.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-[#14152b]/60 border border-indigo-950 animate-pulse p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-800 rounded w-24" />
                  <div className="h-3 bg-slate-800 rounded w-16" />
                </div>
              </div>
              <div className="h-10 bg-slate-800/60 rounded" />
              <div className="h-8 bg-slate-800 rounded mt-auto" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#14152b]/60 border border-indigo-950 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4 text-violet-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No people found matching your filters</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
            Try switching to &quot;All Languages&quot; or changing your gender/distance filter to discover more people.
          </p>
          <button
            onClick={() => {
              setSelectedGender('All');
              setSelectedLanguage('All');
              setAvailability('all');
              setLocationFilter('any');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-600/20"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((user) => {
            const friendStatus = friendActionStatus[user.id];
            const alreadyFriend = isFriend(user.id);

            return (
              <div
                key={user.id}
                className="group relative bg-[#14152b] hover:bg-[#181a34] border border-indigo-950/80 hover:border-violet-600/50 rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-violet-600/10 transition-all duration-200 flex flex-col justify-between"
              >
                {/* Card Top: Avatar & Meta */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar with status indicator */}
                      <div className="relative">
                        <img
                          src={user.avatar}
                          alt={user.displayName}
                          className="w-13 h-13 rounded-xl object-cover ring-2 ring-indigo-900 group-hover:ring-violet-500 transition-all"
                          referrerPolicy="no-referrer"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#14152b] ${
                            user.status === 'online'
                              ? 'bg-emerald-500'
                              : user.status === 'away'
                              ? 'bg-amber-500'
                              : 'bg-slate-500'
                          }`}
                          title={user.status === 'online' ? 'Online' : 'Offline'}
                        />
                      </div>

                      {/* Name & Tag */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-slate-100 text-sm truncate max-w-[120px] group-hover:text-violet-300 transition-colors">
                            {user.displayName}
                          </h3>
                          <RankBadge
                            rank={user.rank || 'Novice'}
                            stars={user.stars || '★'}
                            level={user.level || 1}
                            size="xs"
                          />
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              user.gender === 'Female'
                                ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                                : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {user.gender}
                          </span>
                        </div>

                        {/* Location / Distance */}
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{user.approximateLocation}</span>
                        </div>
                        {user.approximateDistanceKm !== undefined && (
                          <div className="text-[10px] text-emerald-400 font-medium">
                            ~{Math.round(user.approximateDistanceKm)} km away
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3-Dot Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === user.id ? null : user.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === user.id && (
                        <div
                          className="absolute right-0 mt-1 w-36 bg-[#1b1c36] border border-indigo-900 rounded-xl shadow-2xl py-1 z-30 animate-fade-in text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setReportingUser(user);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-amber-400 hover:bg-white/5 flex items-center gap-2"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Report User
                          </button>
                          <button
                            onClick={() => handleBlock(user.id)}
                            className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-white/5 flex items-center gap-2"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Block User
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-xs text-slate-300/90 line-clamp-2 mb-3 bg-slate-900/50 p-2 rounded-lg border border-indigo-950/40">
                      &ldquo;{user.bio}&rdquo;
                    </p>
                  )}

                  {/* Languages & Interests */}
                  <div className="space-y-2 mb-4">
                    {/* Languages */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
                      {(user.languages || [user.language]).map((lang) => (
                        <span
                          key={lang}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-900/60 font-medium"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>

                    {/* Interests tags */}
                    {user.interests && user.interests.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {user.interests.slice(0, 3).map((item) => (
                          <span
                            key={item}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 font-normal"
                          >
                            #{item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-indigo-950/70 space-y-2">
                  {/* Primary Chat Button */}
                  <button
                    onClick={() => handleStartChat(user.id)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-700/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Start Chat
                  </button>

                  {/* Secondary Call & Friend buttons */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => initiateCall(user, 'voice')}
                      title="Start Voice Call"
                      className="py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-300 border border-indigo-950 hover:border-emerald-500/40 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
                    >
                      <Phone className="w-3 h-3 text-emerald-400" />
                      Voice
                    </button>

                    <button
                      onClick={() => initiateCall(user, 'video')}
                      title="Start Video Call"
                      className="py-1.5 rounded-lg bg-slate-900 hover:bg-violet-600/20 text-slate-300 hover:text-violet-300 border border-indigo-950 hover:border-violet-500/40 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
                    >
                      <Video className="w-3 h-3 text-violet-400" />
                      Video
                    </button>

                    <button
                      onClick={() => handleAddFriend(user)}
                      disabled={alreadyFriend || friendStatus === 'added'}
                      title={alreadyFriend ? 'Already friends' : 'Add to friends'}
                      className={`py-1.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                        alreadyFriend || friendStatus === 'added'
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900 hover:bg-pink-600/20 text-slate-300 hover:text-pink-300 border-indigo-950 hover:border-pink-500/40'
                      }`}
                    >
                      {alreadyFriend || friendStatus === 'added' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Friend
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 text-pink-400" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-semibold border border-indigo-950 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400 px-3">
            Page <strong className="text-white">{page}</strong> of{' '}
            <strong className="text-white">{totalPages}</strong>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-semibold border border-indigo-950 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
