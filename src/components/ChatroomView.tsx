import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { Room, RoomMessage } from '../types.ts';
import { RankBadge } from './RankBadge.tsx';
import { GifPicker } from './GifPicker.tsx';
import { getWallpaperById } from '../utils/wallpaperPresets.ts';
import {
  ArrowLeft,
  Users,
  Send,
  Image as ImageIcon,
  Smile,
  Palette,
  Trophy,
  Flame,
  Shield,
  X,
} from 'lucide-react';

interface ChatroomViewProps {
  roomId: string;
  onBack: () => void;
}

export const ChatroomView: React.FC<ChatroomViewProps> = ({ roomId, onBack }) => {
  const {
    currentUser,
    token,
    selectedWallpaper,
    setIsWallpaperModalOpen,
    setIsRankProgressOpen,
  } = useChat();

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [liveMembers, setLiveMembers] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wallpaper = getWallpaperById(selectedWallpaper);

  // Fetch room details and messages
  const fetchRoomData = async () => {
    try {
      const [roomRes, msgsRes] = await Promise.all([
        fetch(`/api/rooms/${roomId}`),
        fetch(`/api/rooms/${roomId}/messages`),
      ]);

      if (roomRes.ok) {
        const rData = await roomRes.json();
        setRoom(rData.room);
        setLiveMembers(rData.room?.liveMembers || []);
      }
      if (msgsRes.ok) {
        const mData = await msgsRes.json();
        setMessages(mData.messages || []);
      }
    } catch (err) {
      console.error('Error fetching room:', err);
    }
  };

  // Join room on mount, leave on unmount
  useEffect(() => {
    fetchRoomData();

    // Call join API
    if (token) {
      fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    // Set up polling for messages as supplementary backup to WebSocket
    const interval = setInterval(() => {
      fetch(`/api/rooms/${roomId}/messages`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages) setMessages(data.messages);
        })
        .catch(() => {});
    }, 4000);

    return () => {
      clearInterval(interval);
      if (token) {
        fetch(`/api/rooms/${roomId}/leave`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    };
  }, [roomId, token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string, imageToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputText.trim();
    if (!text && !imageToSend) return;

    try {
      setIsSending(true);
      const res = await fetch(`/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text: text || '',
          imageUrl: imageToSend,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
        setInputText('');
      }
    } catch (err) {
      console.error('Failed to send room message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectGif = (gifUrl: string) => {
    setIsGifPickerOpen(false);
    handleSendMessage('', gifUrl);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#0b0c1c]">
      {/* Room Header */}
      <div className="flex-none h-16 bg-[#131428] border-b border-indigo-950/80 px-4 flex items-center justify-between gap-3 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Leave room"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{room?.icon || '💬'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-white tracking-tight">
                  {room?.name || 'Community Room'}
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {room?.category?.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {room?.description || 'Active live discussions & banter'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Wallpaper Theme Button */}
          <button
            onClick={() => setIsWallpaperModalOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-indigo-900/60 text-slate-300 hover:text-violet-300 hover:border-violet-500/50 transition-all text-xs font-semibold flex items-center gap-1.5"
            title="Change Chat Wallpaper"
          >
            <Palette className="w-4 h-4 text-violet-400" />
            <span className="hidden md:inline">Wallpaper</span>
          </button>

          {/* Stars Button */}
          <button
            onClick={() => setIsRankProgressOpen(true)}
            className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all text-xs font-semibold flex items-center gap-1.5"
            title="Your Star Rank"
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden md:inline">{currentUser?.rank || 'Novice'}</span>
          </button>

          {/* Active Members Sidebar Toggle */}
          <button
            onClick={() => setShowMembers(!showMembers)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showMembers
                ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/30'
                : 'bg-slate-900 border-indigo-900/60 text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>{room?.activeCount || 100}</span>
          </button>
        </div>
      </div>

      {/* Main Room Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat Messages Section with Active Wallpaper Theme */}
        <div
          className={`flex-1 flex flex-col justify-between overflow-hidden relative ${
            wallpaper?.backgroundClass || 'bg-[#0f1026]'
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
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Welcome message */}
            <div className="max-w-md mx-auto text-center p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-violet-300 flex items-center justify-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-pink-400" />
                Welcome to #{room?.name || 'Chatroom'}
              </span>
              <p className="text-[11px] text-slate-400">
                Be respectful to everyone. You gain <strong className="text-amber-300">+5 XP</strong> for participating!
              </p>
            </div>

            {/* Render Messages */}
            {messages.map((msg) => {
              const isMe = currentUser && msg.senderId === currentUser.id;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 items-start ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
                >
                  <img
                    src={msg.senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={msg.senderName}
                    className="w-9 h-9 rounded-xl object-cover border border-white/20 flex-none shadow-md"
                  />

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                    {/* Nickname & Rank Badge Header */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-white drop-shadow-sm">
                        {isMe ? 'You' : msg.senderName}
                      </span>
                      <RankBadge
                        rank={msg.senderRank || 'Novice'}
                        stars={msg.senderStars || '★'}
                        level={msg.senderLevel || 1}
                        size="xs"
                      />
                      <span className="text-[10px] text-slate-400 font-mono opacity-80">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                        isMe
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none border border-violet-400/40'
                          : 'bg-[#181a38]/90 text-slate-100 rounded-tl-none border border-indigo-900/60 backdrop-blur-md'
                      }`}
                    >
                      {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                      {msg.imageUrl && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-white/20 max-w-xs shadow-inner">
                          <img
                            src={msg.imageUrl}
                            alt="Attachment"
                            className="w-full max-h-64 object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-none p-3 sm:p-4 bg-[#101124]/95 backdrop-blur-md border-t border-indigo-950/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* GIF & Pic Upload Button */}
              <button
                type="button"
                onClick={() => setIsGifPickerOpen(!isGifPickerOpen)}
                className={`p-2.5 rounded-xl border transition-all ${
                  isGifPickerOpen
                    ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border-indigo-900/60 hover:bg-slate-800'
                }`}
                title="Send GIFs & Photos"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Chat in #${room?.name || 'room'} (+5 Star XP)...`}
                className="flex-1 bg-[#181a3a] border border-indigo-900/60 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all shadow-inner"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>

            {/* GIF / Photo Picker Component */}
            {isGifPickerOpen && (
              <div className="mt-3">
                <GifPicker
                  onSelectGif={handleSelectGif}
                  onClose={() => setIsGifPickerOpen(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Live Members Sidebar */}
        {showMembers && (
          <div className="w-72 bg-[#12132c] border-l border-indigo-950/80 p-4 flex flex-col justify-between overflow-hidden flex-none animate-slide-left z-10 shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-indigo-950/60 mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Room Members</h3>
                </div>
                <button
                  onClick={() => setShowMembers(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1">
                {/* Current User */}
                {currentUser && (
                  <div className="p-2 rounded-xl bg-violet-950/40 border border-violet-700/40 flex items-center gap-2.5">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.displayName}
                      className="w-8 h-8 rounded-lg object-cover border border-violet-400/50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white truncate">
                          {currentUser.displayName} (You)
                        </span>
                      </div>
                      <RankBadge
                        rank={currentUser.rank || 'Novice'}
                        stars={currentUser.stars || '★'}
                        level={currentUser.level || 1}
                        size="xs"
                      />
                    </div>
                  </div>
                )}

                {/* Seeded room members */}
                {liveMembers.map((member: any) => (
                  <div
                    key={member.id}
                    className="p-2 rounded-xl bg-slate-900/40 border border-indigo-950 flex items-center gap-2.5"
                  >
                    <img
                      src={member.avatar}
                      alt={member.displayName}
                      className="w-8 h-8 rounded-lg object-cover border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-xs text-slate-200 truncate block">
                        {member.displayName}
                      </span>
                      <RankBadge
                        rank={member.rank || 'Junior'}
                        stars={member.stars || '★★'}
                        level={member.level || 3}
                        size="xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-indigo-950/60 text-[11px] text-slate-400 text-center">
              Active in this room: <strong className="text-emerald-400">{room?.activeCount || 100} members</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
