import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import {
  Search,
  Send,
  Phone,
  Video,
  UserPlus,
  MoreVertical,
  ShieldAlert,
  Ban,
  Trash2,
  ImageIcon,
  Flame,
  Upload,
  X,
  ArrowLeft,
  MapPin,
  Check,
  Globe,
  Sparkles,
  MessageCircle,
  Maximize2,
  Palette,
  Trophy,
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import { GifPicker } from './GifPicker.tsx';
import { RankBadge } from './RankBadge.tsx';
import { getWallpaperById } from '../utils/wallpaperPresets.ts';

export const ChatView: React.FC = () => {
  const {
    currentUser,
    conversations,
    activeConversationId,
    setActiveConversationId,
    activeConversation,
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
    setIsRankProgressOpen,
  } = useChat();

  const wallpaper = getWallpaperById(selectedWallpaper);

  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showMobileList, setShowMobileList] = useState(!activeConversationId);
  const [openHeaderMenu, setOpenHeaderMenu] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<any>(null);

  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const partnerUser: UserProfile | undefined = activeConversation?.participants?.[0];
  const isPartnerTyping = activeConversationId ? !!typingUsers[activeConversationId] : false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, isPartnerTyping]);

  useEffect(() => {
    if (activeConversationId) {
      setShowMobileList(false);
    }
  }, [activeConversationId]);

  const filteredConversations = conversations.filter((c) => {
    const p = c.participants?.[0];
    if (!p) return false;
    const nameMatch = p.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const lastMsgMatch = c.lastMessage?.text?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || lastMsgMatch;
  });

  const handleSend = async (e?: React.FormEvent, customMedia?: string) => {
    if (e) e.preventDefault();
    const mediaToSend = customMedia || imageUrl.trim() || undefined;
    if ((!inputText.trim() && !mediaToSend) || !activeConversationId) return;

    const textToSend = inputText.trim();

    setInputText('');
    setImageUrl('');
    setShowImageInput(false);
    setShowGifPicker(false);

    if (partnerUser) {
      sendTyping(activeConversationId, partnerUser.id, false);
    }

    await sendMessage(activeConversationId, textToSend, mediaToSend);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image or GIF file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleSend(undefined, reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !activeConversationId) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleSend(undefined, reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectGif = (gifUrl: string) => {
    setShowGifPicker(false);
    if (activeConversationId) {
      handleSend(undefined, gifUrl);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeConversationId || !partnerUser) return;

    sendTyping(activeConversationId, partnerUser.id, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendTyping(activeConversationId, partnerUser.id, false);
    }, 1500);
  };

  const handleDelete = async (msgId: string) => {
    if (activeConversationId) {
      await deleteMessage(activeConversationId, msgId);
    }
  };

  const isFriend = partnerUser ? friends.some((f) => f.id === partnerUser.id) : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
      <div className="bg-[#14152b] border border-indigo-950 rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-140px)] min-h-[550px]">
        {/* Left Pane: Conversations List */}
        <div
          className={`md:col-span-4 lg:col-span-4 border-r border-indigo-950/80 flex flex-col h-full bg-[#121327] ${
            !showMobileList && activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-indigo-950/80 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-violet-400" />
                Conversations
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {conversations.length} active
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-indigo-950 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-indigo-950/40">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-400 text-xs">
                <p>No active conversations found.</p>
                <p className="mt-1 text-slate-500">
                  Head to <strong>Discover</strong> or <strong>Quick Match</strong> to start chatting!
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const partner = conv.participants?.[0];
                if (!partner) return null;
                const isSelected = conv.id === activeConversationId;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveConversationId(conv.id);
                      setShowMobileList(false);
                    }}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-violet-600/15 border-l-4 border-violet-500'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={partner.avatar}
                        alt={partner.displayName}
                        className="w-11 h-11 rounded-xl object-cover ring-1 ring-indigo-900"
                        referrerPolicy="no-referrer"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#121327] ${
                          partner.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`font-bold text-xs truncate ${
                            isSelected ? 'text-violet-300' : 'text-slate-200'
                          }`}
                        >
                          {partner.displayName}
                        </span>
                        {conv.updatedAt && (
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(conv.updatedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <p className="text-slate-400 truncate max-w-[160px]">
                          {conv.lastMessage?.imageUrl
                            ? '🖼️ Photo / GIF'
                            : conv.lastMessage?.text || 'Started conversation'}
                        </p>
                        {conv.unreadCount && conv.unreadCount > 0 ? (
                          <span className="px-1.5 py-0.2 rounded-full bg-pink-500 text-white font-bold text-[9px] shrink-0">
                            {conv.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Window */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative md:col-span-8 lg:col-span-8 flex flex-col h-full bg-[#14152b] ${
            showMobileList && !activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Drag & Drop Visual Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-violet-950/80 backdrop-blur-sm z-30 border-2 border-dashed border-violet-400 flex flex-col items-center justify-center text-white space-y-2 pointer-events-none">
              <Upload className="w-10 h-10 text-violet-300 animate-bounce" />
              <p className="font-bold text-sm">Drop your photo, pic or stored GIF here to send!</p>
            </div>
          )}

          {activeConversation && partnerUser ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 sm:p-4 border-b border-indigo-950/80 bg-[#121327]/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="relative">
                    <img
                      src={partnerUser.avatar}
                      alt={partnerUser.displayName}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-purple-500/40 cursor-pointer"
                      onClick={() => setZoomedImage(partnerUser.avatar)}
                      referrerPolicy="no-referrer"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#121327] ${
                        partnerUser.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-white">{partnerUser.displayName}</h3>
                      <RankBadge
                        rank={partnerUser.rank || 'Novice'}
                        stars={partnerUser.stars || '★'}
                        level={partnerUser.level || 1}
                        size="xs"
                      />
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {partnerUser.gender}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>{partnerUser.approximateLocation}</span>
                      <span className="text-slate-600">&bull;</span>
                      <span className="text-indigo-400">
                        {(partnerUser.languages || [partnerUser.language]).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Header Actions: Wallpaper, Calls, Friend, Dropdown */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsWallpaperModalOpen(true)}
                    title="Change Wallpaper Theme"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-violet-600/20 text-slate-300 hover:text-violet-300 border border-indigo-950 transition-colors"
                  >
                    <Palette className="w-4 h-4 text-violet-400" />
                  </button>

                  <button
                    onClick={() => initiateCall(partnerUser, 'voice')}
                    title="Voice Call"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-300 border border-indigo-950 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                  </button>

                  <button
                    onClick={() => initiateCall(partnerUser, 'video')}
                    title="Video Call"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-violet-600/20 text-slate-300 hover:text-violet-300 border border-indigo-950 transition-colors"
                  >
                    <Video className="w-4 h-4 text-violet-400" />
                  </button>

                  <button
                    onClick={() => addFriend(partnerUser.id)}
                    disabled={isFriend}
                    title={isFriend ? 'Friend' : 'Add Friend'}
                    className={`p-2 rounded-xl border transition-colors ${
                      isFriend
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 hover:bg-pink-600/20 text-slate-300 hover:text-pink-300 border-indigo-950'
                    }`}
                  >
                    {isFriend ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <UserPlus className="w-4 h-4 text-pink-400" />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenHeaderMenu(!openHeaderMenu)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openHeaderMenu && (
                      <div
                        className="absolute right-0 mt-1 w-36 bg-[#1b1c36] border border-indigo-900 rounded-xl shadow-2xl py-1 z-30 text-xs"
                        onClick={() => setOpenHeaderMenu(false)}
                      >
                        <button
                          onClick={() => setReportingUser(partnerUser)}
                          className="w-full px-3 py-1.5 text-left text-amber-400 hover:bg-white/5 flex items-center gap-2"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Report User
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Block this user?')) {
                              blockUser(partnerUser.id);
                            }
                          }}
                          className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-white/5 flex items-center gap-2"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Block User
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Bubbles Stream with active Wallpaper theme */}
              <div
                className={`flex-1 overflow-y-auto p-4 space-y-3 ${
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
                {currentMessages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                    <Sparkles className="w-8 h-8 text-violet-400 mx-auto opacity-60" />
                    <p>No messages yet in this conversation.</p>
                    <p className="text-slate-500">Send a friendly greeting or share a GIF!</p>
                  </div>
                ) : (
                  currentMessages.map((msg) => {
                    const isMe = currentUser && msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 group ${
                          isMe ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!isMe && (
                          <img
                            src={msg.senderAvatar || partnerUser.avatar}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover ring-1 ring-purple-500/40 shrink-0 cursor-pointer"
                            onClick={() => setZoomedImage(msg.senderAvatar || partnerUser.avatar)}
                          />
                        )}

                        <div className="relative max-w-[75%]">
                          <div
                            className={`rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                              isMe
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-none'
                                : 'bg-slate-900/90 text-slate-200 border border-indigo-950 rounded-bl-none'
                            }`}
                          >
                            {msg.imageUrl && (
                              <div className="relative group/img cursor-pointer mb-2">
                                <img
                                  src={msg.imageUrl}
                                  alt="Attachment"
                                  onClick={() => setZoomedImage(msg.imageUrl || null)}
                                  className="rounded-xl max-h-60 w-full object-cover border border-white/10 hover:opacity-95 transition-opacity"
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
                              {isMe && <span>{msg.read ? '✓✓' : '✓'}</span>}
                            </div>
                          </div>

                          {/* Delete Action for Own Messages */}
                          {isMe && (
                            <button
                              onClick={() => handleDelete(msg.id)}
                              title="Delete message"
                              className="opacity-0 group-hover:opacity-100 absolute -left-7 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-500 hover:text-rose-400 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Partner Typing Bubble */}
                {isPartnerTyping && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
                    <img
                      src={partnerUser.avatar}
                      alt=""
                      className="w-6 h-6 rounded-lg object-cover ring-1 ring-purple-500/40"
                    />
                    <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-indigo-950 flex items-center gap-1 text-[11px]">
                      <span>{partnerUser.displayName} is typing</span>
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce delay-100">.</span>
                      <span className="animate-bounce delay-200">.</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* GIF Picker Popover Overlay */}
              {showGifPicker && (
                <div className="p-3 bg-slate-900 border-t border-indigo-950 animate-fade-in">
                  <GifPicker
                    onSelectGif={handleSelectGif}
                    onClose={() => setShowGifPicker(false)}
                  />
                </div>
              )}

              {/* Image URL Input Drawer */}
              {showImageInput && (
                <div className="p-3 bg-slate-900 border-t border-indigo-950 flex items-center gap-2 animate-fade-in">
                  <input
                    type="url"
                    placeholder="Paste image or GIF web link..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-indigo-900 text-xs text-white outline-none focus:border-violet-500"
                  />
                  <button
                    onClick={() => {
                      if (imageUrl.trim()) {
                        handleSend();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-500"
                  >
                    Attach
                  </button>
                  <button
                    onClick={() => setShowImageInput(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => handleSend(e)}
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

                {/* File Upload Button */}
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
                    setShowImageInput(false);
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

                {/* Image URL Link Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowImageInput(!showImageInput);
                    setShowGifPicker(false);
                  }}
                  title="Add Image via Link"
                  className="p-2 rounded-xl text-slate-400 hover:text-violet-400 hover:bg-slate-800 transition-colors hidden sm:flex"
                >
                  <Upload className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder={`Message ${partnerUser.displayName}...`}
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-indigo-950 focus:border-violet-500 text-white placeholder-slate-500 text-sm outline-none transition-all"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() && !imageUrl.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white shadow-lg shadow-purple-600/30 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-900 flex items-center justify-center text-violet-400 mb-2">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-lg text-white">Select a conversation</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Choose a person from the left panel or discover new people nearby to start chatting.
              </p>
            </div>
          )}
        </div>
      </div>

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
