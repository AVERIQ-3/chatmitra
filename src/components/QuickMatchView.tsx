import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { UserProfile, Gender } from '../types.ts';
import { SUPPORTED_LANGUAGES } from '../../server/data.ts';
import {
  Shuffle,
  Send,
  Sparkles,
  MapPin,
  Globe,
  Phone,
  Video,
  UserPlus,
  ShieldAlert,
  Ban,
  SkipForward,
  RotateCcw,
  Smile,
  ImageIcon,
  Flame,
  Upload,
  X,
  Check,
  Zap,
  Maximize2,
} from 'lucide-react';
import { GifPicker } from './GifPicker.tsx';
import { RankBadge } from './RankBadge.tsx';
import { getWallpaperById } from '../utils/wallpaperPresets.ts';

const ICEBREAKERS = [
  '👋 Hey! Where are you connecting from?',
  '🎬 What is the best movie you have watched lately?',
  '☕ Tea or Coffee? And how do you like it?',
  '🎵 What song is on loop for you right now?',
  '🏏 Are you following the latest cricket tournament?',
  '✈️ What is your dream travel destination in India?',
];

export const QuickMatchView: React.FC = () => {
  const {
    currentUser,
    token,
    messages,
    sendMessage,
    deleteMessage,
    typingUsers,
    sendTyping,
    initiateCall,
    addFriend,
    blockUser,
    setReportingUser,
    friends,
    selectedWallpaper,
    setIsWallpaperModalOpen,
  } = useChat();

  const wallpaper = getWallpaperById(selectedWallpaper);

  const [genderPref, setGenderPref] = useState<Gender>('All');
  const [languagePref, setLanguagePref] = useState<string>('All');
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [partnerIsFriend, setPartnerIsFriend] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Auto scroll to bottom
  const currentMessages = conversationId ? messages[conversationId] || [] : [];
  const isPartnerTyping = conversationId ? !!typingUsers[conversationId] : false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, isPartnerTyping]);

  useEffect(() => {
    if (partner) {
      setPartnerIsFriend(friends.some((f) => f.id === partner.id));
    }
  }, [partner, friends]);

  const findPartner = async (gender = genderPref, lang = languagePref) => {
    setIsSearching(true);
    setErrorMsg(null);
    setShowGifPicker(false);
    try {
      const res = await fetch('/api/match/find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          genderPreference: gender,
          languagePreference: lang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPartner(data.partner);
        setConversationId(data.conversationId);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'No matching strangers found right now.');
        setPartner(null);
        setConversationId(null);
      }
    } catch (err: any) {
      setErrorMsg('Failed to find a match. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSkip = async () => {
    if (partner) {
      try {
        await fetch('/api/match/skip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ targetUserId: partner.id }),
        });
      } catch (e) {}
    }
    findPartner();
  };

  const handleSendMessage = async (e?: React.FormEvent, customMedia?: string) => {
    if (e) e.preventDefault();
    const mediaToSend = customMedia || imageUrlInput.trim() || undefined;
    if ((!inputMessage.trim() && !mediaToSend) || !conversationId) return;

    const textToSend = inputMessage.trim();

    setInputMessage('');
    setImageUrlInput('');
    setShowImagePrompt(false);
    setShowGifPicker(false);

    if (partner) {
      sendTyping(conversationId, partner.id, false);
    }

    await sendMessage(conversationId, textToSend, mediaToSend);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image or GIF file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleSendMessage(undefined, reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !conversationId) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleSendMessage(undefined, reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectGif = (gifUrl: string) => {
    setShowGifPicker(false);
    if (conversationId) {
      handleSendMessage(undefined, gifUrl);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (!conversationId || !partner) return;

    sendTyping(conversationId, partner.id, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(conversationId, partner.id, false);
    }, 1500);
  };

  const handleAddFriendAction = async () => {
    if (!partner) return;
    const res = await addFriend(partner.id);
    if (res.success) {
      setPartnerIsFriend(true);
    }
  };

  const handleBlockAction = async () => {
    if (!partner) return;
    if (window.confirm(`Block ${partner.displayName}? You will be matched with someone else.`)) {
      await blockUser(partner.id);
      handleSkip();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-fade-in space-y-6">
      {/* Match Control Header */}
      <div className="bg-[#14152b] border border-indigo-950/80 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">Instant Stranger Match</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Connect instantly 1-on-1 with random active users. Press <strong>Skip</strong> anytime to meet someone new.
          </p>
        </div>

        {/* Match Preferences */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Gender Preference */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-indigo-950 text-xs">
            {(['All', 'Female', 'Male'] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => {
                  setGenderPref(g);
                  findPartner(g, languagePref);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                  genderPref === g
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {g === 'All' ? 'All' : g === 'Female' ? '👧 Female' : '👦 Male'}
              </button>
            ))}
          </div>

          {/* Language Preference */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-indigo-950 text-xs">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={languagePref}
              onChange={(e) => {
                setLanguagePref(e.target.value);
                findPartner(genderPref, e.target.value);
              }}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">
                Any Language
              </option>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l} value={l} className="bg-slate-900 text-white">
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Skip / Next Button */}
          <button
            onClick={handleSkip}
            disabled={isSearching}
            className="py-2 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-md shadow-pink-600/30 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <SkipForward className="w-4 h-4" />
            <span>{partner ? 'Next Person' : 'Find Stranger'}</span>
          </button>
        </div>
      </div>

      {/* Main Match Arena */}
      {!partner && !isSearching ? (
        <div className="text-center py-20 px-4 bg-[#14152b]/60 border border-indigo-950/80 rounded-2xl shadow-xl space-y-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 p-0.5 mx-auto shadow-xl shadow-pink-600/20">
            <div className="w-full h-full bg-[#121327] rounded-[14px] flex items-center justify-center">
              <Shuffle className="w-10 h-10 text-pink-400" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Ready to Meet Someone New?</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Click &quot;Start Matching&quot; to instantly connect with a live verified guest or community member.
            </p>
          </div>
          {errorMsg && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-4 rounded-xl max-w-sm mx-auto">
              {errorMsg}
            </p>
          )}
          <button
            onClick={() => findPartner()}
            className="px-8 py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white shadow-xl shadow-pink-600/30 hover:scale-105 transition-all"
          >
            Start Matching Now ⚡
          </button>
        </div>
      ) : isSearching ? (
        <div className="text-center py-24 px-4 bg-[#14152b]/60 border border-indigo-950/80 rounded-2xl shadow-xl space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-pink-500/20 border-t-pink-500" />
            <Shuffle className="w-8 h-8 text-pink-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white">Looking for a friendly stranger...</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Matching with language: <span className="text-purple-300 font-semibold">{languagePref}</span> &bull; Gender:{' '}
            <span className="text-pink-300 font-semibold">{genderPref}</span>
          </p>
        </div>
      ) : (
        partner && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Matched Stranger Profile Card */}
            <div className="lg:col-span-4 bg-[#14152b] border border-indigo-950 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4">
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                    Live Match
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setReportingUser(partner)}
                      title="Report"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleBlockAction}
                      title="Block"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Avatar & Info */}
                <div className="text-center space-y-2 mb-4">
                  <div className="relative inline-block">
                    <img
                      src={partner.avatar}
                      alt={partner.displayName}
                      onClick={() => setZoomedImage(partner.avatar)}
                      className="w-24 h-24 rounded-2xl object-cover ring-4 ring-purple-600/40 shadow-xl mx-auto cursor-pointer"
                      referrerPolicy="no-referrer"
                    />
                    <span
                      className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#14152b] ${
                        partner.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <h3 className="font-extrabold text-lg text-white">{partner.displayName}</h3>
                      <RankBadge
                        rank={partner.rank || 'Novice'}
                        stars={partner.stars || '★'}
                        level={partner.level || 1}
                        size="xs"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-indigo-950">
                        {partner.gender === 'Female' ? '👧 Female' : '👦 Male'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        {partner.approximateLocation}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio & Details */}
                {partner.bio && (
                  <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-indigo-950/60 mb-3 text-center italic">
                    &ldquo;{partner.bio}&rdquo;
                  </p>
                )}

                {/* Languages & Interests */}
                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Languages:</span>
                    <span className="text-indigo-300 font-semibold">
                      {(partner.languages || [partner.language]).join(', ')}
                    </span>
                  </div>
                  {partner.interests && partner.interests.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap justify-center pt-1">
                      {partner.interests.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 text-[10px]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3 border-t border-indigo-950">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => initiateCall(partner, 'voice')}
                    className="py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600/20 border border-indigo-950 hover:border-emerald-500/40 text-xs font-bold text-slate-200 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Voice Call
                  </button>

                  <button
                    onClick={() => initiateCall(partner, 'video')}
                    className="py-2.5 rounded-xl bg-slate-900 hover:bg-violet-600/20 border border-indigo-950 hover:border-violet-500/40 text-xs font-bold text-slate-200 hover:text-violet-300 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Video className="w-3.5 h-3.5 text-violet-400" />
                    Video Call
                  </button>
                </div>

                <button
                  onClick={handleAddFriendAction}
                  disabled={partnerIsFriend}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    partnerIsFriend
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-transparent text-white shadow-md shadow-violet-700/20'
                  }`}
                >
                  {partnerIsFriend ? (
                    <>
                      <Check className="w-4 h-4" />
                      Connected as Friends
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add to Friends
                    </>
                  )}
                </button>

                <button
                  onClick={handleSkip}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-950/60 hover:border-rose-700/60 flex items-center justify-center gap-2 transition-all"
                >
                  <SkipForward className="w-4 h-4 text-rose-400" />
                  Skip to Next Stranger
                </button>
              </div>
            </div>

            {/* Right Column: Live Chat Arena */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className="relative lg:col-span-8 bg-[#14152b] border border-indigo-950 rounded-2xl shadow-lg flex flex-col h-[560px] overflow-hidden"
            >
              {isDragging && (
                <div className="absolute inset-0 bg-violet-950/80 backdrop-blur-sm z-30 border-2 border-dashed border-violet-400 flex flex-col items-center justify-center text-white space-y-2 pointer-events-none">
                  <Upload className="w-10 h-10 text-violet-300 animate-bounce" />
                  <p className="font-bold text-sm">Drop your photo, pic or stored GIF here to send!</p>
                </div>
              )}

              {/* Chat Stream with active Wallpaper theme */}
              <div
                className={`flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 ${
                  wallpaper?.backgroundClass || 'bg-[#14152b]'
                }`}
                style={
                  wallpaper?.imageUrl
                    ? {
                        backgroundImage: `url(${wallpaper.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }
                    : undefined
                }
              >
                <div className="text-center py-2">
                  <span className="px-3 py-1 rounded-full text-[11px] bg-slate-900/80 text-slate-400 border border-indigo-950">
                    🔒 You are chatting with <strong className="text-white">{partner.displayName}</strong>. Stay safe &amp; polite.
                  </span>
                </div>

                {currentMessages.map((msg) => {
                  const isMe = currentUser && msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} group`}
                    >
                      {!isMe && (
                        <img
                          src={msg.senderAvatar || partner.avatar}
                          alt=""
                          onClick={() => setZoomedImage(msg.senderAvatar || partner.avatar)}
                          className="w-7 h-7 rounded-lg object-cover ring-1 ring-purple-500/40 shrink-0 cursor-pointer"
                        />
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                          isMe
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-900/90 text-slate-200 border border-indigo-950 rounded-bl-none'
                        }`}
                      >
                        {msg.imageUrl && (
                          <div className="relative group/img cursor-pointer mb-2">
                            <img
                              src={msg.imageUrl}
                              alt="Shared media"
                              onClick={() => setZoomedImage(msg.imageUrl || null)}
                              className="rounded-xl max-h-56 w-full object-cover border border-white/10 hover:opacity-95 transition-opacity"
                            />
                            <span className="absolute bottom-2 right-2 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover/img:opacity-100 transition-opacity">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        )}
                        {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                        <div
                          className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                            isMe ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMe && <span>✓✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Partner is typing indicator */}
                {isPartnerTyping && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
                    <img
                      src={partner.avatar}
                      alt=""
                      className="w-6 h-6 rounded-lg object-cover ring-1 ring-purple-500/40"
                    />
                    <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-indigo-950 flex items-center gap-1 text-[11px]">
                      <span>{partner.displayName} is typing</span>
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce delay-100">.</span>
                      <span className="animate-bounce delay-200">.</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Icebreakers Bar */}
              <div className="px-4 py-2 bg-slate-900/40 border-t border-indigo-950/60 overflow-x-auto flex items-center gap-2 text-xs no-scrollbar">
                <span className="text-[11px] text-slate-500 font-semibold shrink-0">Icebreakers:</span>
                {ICEBREAKERS.slice(0, 3).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (conversationId) sendMessage(conversationId, prompt);
                    }}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-violet-600/20 text-slate-300 hover:text-violet-300 border border-indigo-950 hover:border-violet-500/30 text-[11px] transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* GIF Picker Popover */}
              {showGifPicker && (
                <div className="p-3 bg-slate-900 border-t border-indigo-950 animate-fade-in">
                  <GifPicker
                    onSelectGif={handleSelectGif}
                    onClose={() => setShowGifPicker(false)}
                  />
                </div>
              )}

              {/* Image URL Prompt Overlay */}
              {showImagePrompt && (
                <div className="p-3 bg-slate-900 border-t border-indigo-950 flex items-center gap-2 animate-fade-in">
                  <input
                    type="url"
                    placeholder="Paste image URL (e.g. https://... or unsplash)..."
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-indigo-900 text-xs text-white outline-none focus:border-violet-500"
                  />
                  <button
                    onClick={() => {
                      if (imageUrlInput.trim()) {
                        handleSendMessage();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-bold hover:bg-pink-500"
                  >
                    Attach
                  </button>
                  <button
                    onClick={() => setShowImagePrompt(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Message Input Form */}
              <form
                onSubmit={(e) => handleSendMessage(e)}
                className="p-3 sm:p-4 bg-slate-900/90 border-t border-indigo-950 flex items-center gap-2"
              >
                {/* Hidden File Upload Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,image/gif,.gif,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                />

                {/* Upload Photo Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload Photo, Pic or Stored GIF from PC/Phone"
                  className="p-2 rounded-xl text-slate-400 hover:text-pink-400 hover:bg-slate-800 transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                {/* GIF Picker Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowGifPicker(!showGifPicker);
                    setShowImagePrompt(false);
                  }}
                  title="Send GIF"
                  className={`p-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 ${
                    showGifPicker
                      ? 'bg-pink-600/30 text-pink-400 border border-pink-500/40'
                      : 'text-slate-400 hover:text-pink-400 hover:bg-slate-800'
                  }`}
                >
                  <Flame className="w-5 h-5" />
                </button>

                {/* Image URL Link Option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowImagePrompt(!showImagePrompt);
                    setShowGifPicker(false);
                  }}
                  title="Paste Image Link"
                  className="p-2 rounded-xl text-slate-400 hover:text-violet-400 hover:bg-slate-800 transition-colors hidden sm:flex"
                >
                  <Upload className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder={`Say hi to ${partner.displayName}...`}
                  value={inputMessage}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-indigo-950 focus:border-violet-500 text-white placeholder-slate-500 text-sm outline-none transition-all"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() && !imageUrlInput}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-40 text-white shadow-lg shadow-purple-600/30 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )
      )}

      {/* Lightbox Modal for Zoomed Photos / GIFs */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
