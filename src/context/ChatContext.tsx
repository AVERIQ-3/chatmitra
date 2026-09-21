import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  UserProfile,
  CurrentUserSession,
  Conversation,
  Message,
  CallSession,
  FriendRequest,
  DailyMissionsData,
  WebSocketEventMessage,
} from '../types.ts';
import { soundEffects } from '../utils/audio.ts';

interface ChatContextType {
  currentUser: CurrentUserSession | null;
  isLoadingUser: boolean;
  token: string | null;
  onlineUsersCount: number;
  activeTab: 'discover' | 'match' | 'rooms' | 'chats' | 'friends' | 'safety' | 'admin';
  setActiveTab: (tab: 'discover' | 'match' | 'rooms' | 'chats' | 'friends' | 'safety' | 'admin') => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  activeConversation: Conversation | null;
  messages: Record<string, Message[]>; // conversationId -> messages
  unreadTotal: number;
  typingUsers: Record<string, boolean>; // conversationId -> isTyping
  activeCall: CallSession | null;
  callRole: 'caller' | 'receiver' | null;
  friends: UserProfile[];
  friendRequests: FriendRequest[];

  // Community features
  selectedWallpaper: string;
  setSelectedWallpaper: (id: string) => void;
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
  isRankProgressOpen: boolean;
  setIsRankProgressOpen: (open: boolean) => void;
  isWallpaperModalOpen: boolean;
  setIsWallpaperModalOpen: (open: boolean) => void;
  xpToast: { text: string; leveledUp?: boolean; rank?: string; stars?: string } | null;
  clearXpToast: () => void;

  // Daily Missions
  dailyMissions: DailyMissionsData | null;
  isMissionsModalOpen: boolean;
  setIsMissionsModalOpen: (open: boolean) => void;
  fetchMissions: () => Promise<void>;
  claimMissionReward: (missionId: string) => Promise<boolean>;
  claimDailyCheckIn: () => Promise<boolean>;
  claimGrandMasterBonus: () => Promise<boolean>;
  
  // Modals & Controls
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  reportingUser: UserProfile | null;
  setReportingUser: (user: UserProfile | null) => void;
  isSafetyOpen: boolean;
  setIsSafetyOpen: (open: boolean) => void;

  // Actions
  loginAsGuest: (data: { gender: 'Male' | 'Female'; language: string; approximateLocation?: string; displayName?: string; avatar?: string }) => Promise<boolean>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  registerAccount: (data: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  loginAccount: (data: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;

  // Messaging & Matching
  startConversation: (targetUserId: string) => Promise<string | null>;
  sendMessage: (conversationId: string, text: string, imageUrl?: string) => Promise<boolean>;
  sendTyping: (conversationId: string, toUserId: string, isTyping: boolean) => void;
  deleteMessage: (conversationId: string, messageId: string) => Promise<boolean>;
  refreshConversations: () => Promise<void>;

  // Calling
  initiateCall: (receiver: UserProfile, type: 'voice' | 'video') => Promise<boolean>;
  respondCall: (accept: boolean) => Promise<void>;
  endCall: () => Promise<void>;

  // Friend actions
  addFriend: (targetUserId: string) => Promise<{ success: boolean; message?: string; error?: string; requireRegistration?: boolean }>;
  removeFriend: (targetUserId: string) => Promise<boolean>;
  refreshFriends: () => Promise<void>;

  // Moderation
  blockUser: (targetUserId: string) => Promise<boolean>;
  submitReport: (targetUserId: string, category: string, description: string) => Promise<boolean>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUserSession | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('chatmitra_token') || null;
  });
  const [activeTab, setActiveTab] = useState<'discover' | 'match' | 'rooms' | 'chats' | 'friends' | 'safety' | 'admin'>('discover');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [onlineUsersCount, setOnlineUsersCount] = useState<number>(1280);

  // Community Features State
  const [selectedWallpaper, setSelectedWallpaperState] = useState<string>(() => {
    return localStorage.getItem('chatmitra_wallpaper') || 'classic-dark-doodle';
  });
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isRankProgressOpen, setIsRankProgressOpen] = useState(false);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const [xpToast, setXpToast] = useState<{ text: string; leveledUp?: boolean; rank?: string; stars?: string } | null>(null);

  // Daily Missions State
  const [dailyMissions, setDailyMissions] = useState<DailyMissionsData | null>(null);
  const [isMissionsModalOpen, setIsMissionsModalOpen] = useState(false);

  const setSelectedWallpaper = async (id: string) => {
    setSelectedWallpaperState(id);
    localStorage.setItem('chatmitra_wallpaper', id);
    try {
      await fetch('/api/user/wallpaper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ wallpaperId: id }),
      });
    } catch (e) {
      // ignore
    }
  };

  const clearXpToast = () => setXpToast(null);

  // Calling state
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [callRole, setCallRole] = useState<'caller' | 'receiver' | null>(null);

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [reportingUser, setReportingUser] = useState<UserProfile | null>(null);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Load active session on mount
  const checkSession = useCallback(async () => {
    try {
      setIsLoadingUser(true);
      const res = await fetch('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        if (data.token) {
          setToken(data.token);
          localStorage.setItem('chatmitra_token', data.token);
        }
      } else {
        // Automatically create guest if first time, or open onboarding
        const savedPref = localStorage.getItem('chatmitra_pref');
        if (savedPref) {
          try {
            const parsed = JSON.parse(savedPref);
            await loginAsGuest(parsed);
          } catch (e) {
            setIsOnboardingOpen(true);
          }
        } else {
          // Open quick guest onboarding modal
          setIsOnboardingOpen(true);
        }
      }
    } catch (err) {
      console.error('Session check error:', err);
      setIsOnboardingOpen(true);
    } finally {
      setIsLoadingUser(false);
    }
  }, [token]);

  useEffect(() => {
    checkSession();
  }, []);

  // WebSocket Connection Lifecycle
  useEffect(() => {
    if (!token && !currentUser) return;

    let isSubscribed = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}?token=${encodeURIComponent(token || currentUser?.guestToken || '')}`;

    function connectWs() {
      if (!isSubscribed) return;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (token) {
          ws.send(JSON.stringify({ type: 'auth:connect', payload: { token } }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketEventMessage = JSON.parse(event.data);
          handleWsEvent(data);
        } catch (err) {
          // JSON parse error
        }
      };

      ws.onclose = () => {
        if (isSubscribed) {
          reconnectTimeoutRef.current = setTimeout(connectWs, 2500);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connectWs();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [token, currentUser?.id]);

  // Handle incoming WebSocket events
  const handleWsEvent = (event: WebSocketEventMessage) => {
    switch (event.type) {
      case 'chat:message': {
        const msg: Message = event.payload;
        setMessages((prev) => {
          const convMsgs = prev[msg.conversationId] || [];
          if (convMsgs.some((m) => m.id === msg.id)) return prev;
          return {
            ...prev,
            [msg.conversationId]: [...convMsgs, msg],
          };
        });

        // Play pop sound if message is from other user
        if (currentUser && msg.senderId !== currentUser.id) {
          soundEffects.playMessagePop();
        }

        // Update conversation lastMessage & unread count
        setConversations((prev) => {
          return prev.map((c) => {
            if (c.id === msg.conversationId) {
              const isCurrentOpen = activeConversationId === msg.conversationId;
              return {
                ...c,
                lastMessage: msg,
                updatedAt: msg.createdAt,
                unreadCount: isCurrentOpen || (currentUser && msg.senderId === currentUser.id) ? 0 : (c.unreadCount || 0) + 1,
              };
            }
            return c;
          });
        });
        break;
      }

      case 'chat:typing': {
        const { conversationId } = event.payload;
        setTypingUsers((prev) => ({ ...prev, [conversationId]: true }));
        break;
      }

      case 'chat:stop_typing': {
        const { conversationId } = event.payload;
        setTypingUsers((prev) => ({ ...prev, [conversationId]: false }));
        break;
      }

      case 'chat:read': {
        const { conversationId } = event.payload;
        setMessages((prev) => {
          const convMsgs = prev[conversationId];
          if (!convMsgs) return prev;
          return {
            ...prev,
            [conversationId]: convMsgs.map((m) => ({ ...m, read: true })),
          };
        });
        break;
      }

      case 'chat:delete': {
        const { conversationId, messageId } = event.payload;
        setMessages((prev) => {
          const convMsgs = prev[conversationId];
          if (!convMsgs) return prev;
          return {
            ...prev,
            [conversationId]: convMsgs.filter((m) => m.id !== messageId),
          };
        });
        break;
      }

      case 'conversation:created': {
        refreshConversations();
        break;
      }

      case 'call:incoming': {
        const { id, caller, callType } = event.payload;
        setActiveCall({
          id,
          callerId: caller.id,
          receiverId: currentUser?.id || '',
          callerName: caller.displayName,
          callerAvatar: caller.avatar,
          receiverName: currentUser?.displayName || '',
          receiverAvatar: currentUser?.avatar || '',
          type: callType,
          status: 'ringing',
          createdAt: new Date().toISOString(),
        });
        setCallRole('receiver');
        soundEffects.startIncomingRingtone();
        break;
      }

      case 'call:accepted': {
        setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
        soundEffects.playConnectChime();
        break;
      }

      case 'call:rejected':
      case 'call:ended': {
        soundEffects.playDisconnectChime();
        setActiveCall(null);
        setCallRole(null);
        break;
      }

      case 'friend:accepted': {
        refreshFriends();
        break;
      }

      case 'user:xp_update': {
        const { xp, level, rank, stars, leveledUp, xpGained, nextRank, xpToNextRank, progressPercent } = event.payload;
        setCurrentUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            xp,
            level,
            rank,
            stars,
            nextRank,
            xpToNextRank,
            progressPercent,
          };
        });

        if (leveledUp) {
          soundEffects.playConnectChime();
          setXpToast({
            text: `🎉 LEVEL UP! You reached Rank ${rank} (${stars})!`,
            leveledUp: true,
            rank,
            stars,
          });
        } else if (xpGained) {
          setXpToast({
            text: `+${xpGained} XP earned (${stars})`,
            leveledUp: false,
            rank,
            stars,
          });
        }
        break;
      }

      case 'missions:update': {
        setDailyMissions(event.payload);
        break;
      }

      case 'user:presence': {
        const { userId, status } = event.payload;
        setConversations((prev) => {
          return prev.map((c) => {
            const updatedParticipants = c.participants.map((p) => {
              if (p.id === userId) {
                return { ...p, status };
              }
              return p;
            });
            return { ...c, participants: updatedParticipants };
          });
        });
        break;
      }
    }
  };

  // Auth Functions
  const loginAsGuest = async (data: {
    gender: 'Male' | 'Female';
    language: string;
    approximateLocation?: string;
    displayName?: string;
    avatar?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const resData = await res.json();
        setCurrentUser(resData.user);
        setToken(resData.token);
        localStorage.setItem('chatmitra_token', resData.token);
        localStorage.setItem('chatmitra_pref', JSON.stringify(data));
        setIsOnboardingOpen(false);
        refreshConversations();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Guest login failed:', err);
      return false;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const resData = await res.json();
        setCurrentUser((prev) => (prev ? { ...prev, ...resData.user } : null));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update profile error:', err);
      return false;
    }
  };

  const registerAccount = async (data: { username: string; password: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (res.ok) {
        setCurrentUser(resData.user);
        setToken(resData.token);
        localStorage.setItem('chatmitra_token', resData.token);
        setIsAuthModalOpen(false);
        return { success: true };
      }
      return { success: false, error: resData.error || 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const loginAccount = async (data: { username: string; password: string }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (res.ok) {
        setCurrentUser(resData.user);
        setToken(resData.token);
        localStorage.setItem('chatmitra_token', resData.token);
        setIsAuthModalOpen(false);
        refreshConversations();
        refreshFriends();
        return { success: true };
      }
      return { success: false, error: resData.error || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (e) {}
    localStorage.removeItem('chatmitra_token');
    localStorage.removeItem('chatmitra_pref');
    setToken(null);
    setCurrentUser(null);
    setConversations([]);
    setMessages({});
    setIsOnboardingOpen(true);
  };

  const deleteAccount = async () => {
    try {
      await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (e) {}
    localStorage.removeItem('chatmitra_token');
    localStorage.removeItem('chatmitra_pref');
    setToken(null);
    setCurrentUser(null);
    setConversations([]);
    setMessages({});
    setIsProfileOpen(false);
    setIsOnboardingOpen(true);
  };

  // Conversations & Messaging
  const refreshConversations = useCallback(async () => {
    if (!token && !currentUser) return;
    try {
      const res = await fetch('/api/conversations', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [token, currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshConversations();
      refreshFriends();
    }
  }, [currentUser?.id, refreshConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId || !currentUser) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => ({
            ...prev,
            [activeConversationId]: data.messages || [],
          }));
          // Clear unread count locally
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
          );
        }
      } catch (e) {
        console.error('Failed to fetch messages:', e);
      }
    };

    fetchMessages();
  }, [activeConversationId, token, currentUser?.id]);

  const startConversation = async (targetUserId: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        const data = await res.json();
        const conv = data.conversation;
        setConversations((prev) => {
          if (prev.some((c) => c.id === conv.id)) return prev;
          return [conv, ...prev];
        });
        setActiveConversationId(conv.id);
        setActiveTab('chats');
        return conv.id;
      }
      return null;
    } catch (err) {
      console.error('Failed to start conversation:', err);
      return null;
    }
  };

  const sendMessage = async (conversationId: string, text: string, imageUrl?: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, imageUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        const newMsg: Message = data.message;
        setMessages((prev) => {
          const list = prev[conversationId] || [];
          if (list.some((m) => m.id === newMsg.id)) return prev;
          return { ...prev, [conversationId]: [...list, newMsg] };
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Send message failed:', err);
      return false;
    }
  };

  const sendTyping = (conversationId: string, toUserId: string, isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: isTyping ? 'chat:typing' : 'chat:stop_typing',
          payload: { conversationId, toUserId },
        })
      );
    }
  };

  const deleteMessage = async (conversationId: string, messageId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setMessages((prev) => {
          const list = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: list.filter((m) => m.id !== messageId),
          };
        });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Calling
  const initiateCall = async (receiver: UserProfile, type: 'voice' | 'video'): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ receiverId: receiver.id, callType: type }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveCall({
          id: data.call.id,
          callerId: currentUser.id,
          receiverId: receiver.id,
          callerName: currentUser.displayName,
          callerAvatar: currentUser.avatar,
          receiverName: receiver.displayName,
          receiverAvatar: receiver.avatar,
          type,
          status: 'ringing',
          createdAt: new Date().toISOString(),
        });
        setCallRole('caller');
        soundEffects.startOutgoingRingtone();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Call initiate error:', e);
      return false;
    }
  };

  const respondCall = async (accept: boolean) => {
    if (!activeCall) return;
    try {
      soundEffects.stopRingtone();
      await fetch(`/api/calls/${activeCall.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ accept }),
      });

      if (accept) {
        setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
        soundEffects.playConnectChime();
      } else {
        soundEffects.playDisconnectChime();
        setActiveCall(null);
        setCallRole(null);
      }
    } catch (e) {
      setActiveCall(null);
      setCallRole(null);
    }
  };

  const endCall = async () => {
    if (!activeCall) return;
    soundEffects.stopRingtone();
    soundEffects.playDisconnectChime();
    try {
      await fetch(`/api/calls/${activeCall.id}/end`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (e) {}
    setActiveCall(null);
    setCallRole(null);
  };

  // Friends
  const refreshFriends = async () => {
    if (!token && !currentUser) return;
    try {
      const res = await fetch('/api/friends', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setFriendRequests(data.requests || []);
      }
    } catch (e) {}
  };

  const addFriend = async (targetUserId: string) => {
    if (!currentUser) return { success: false };
    if (currentUser.isGuest) {
      setIsAuthModalOpen(true);
      return {
        success: false,
        requireRegistration: true,
        error: 'Create a free account to save friends permanently across sessions!',
      };
    }

    try {
      const res = await fetch(`/api/friends/${targetUserId}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok) {
        refreshFriends();
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const removeFriend = async (targetUserId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/friends/${targetUserId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setFriends((prev) => prev.filter((f) => f.id !== targetUserId));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Moderation
  const blockUser = async (targetUserId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/users/${targetUserId}/block`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        // Remove active conversation if any
        setConversations((prev) =>
          prev.filter((c) => !c.participantIds.includes(targetUserId))
        );
        if (activeConversation?.participantIds.includes(targetUserId)) {
          setActiveConversationId(null);
        }
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const submitReport = async (targetUserId: string, category: string, description: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/users/${targetUserId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ category, description }),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  };

  // Missions & Streak Management
  const fetchMissions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/missions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDailyMissions(data);
      }
    } catch (e) {
      console.error('Failed to fetch daily missions:', e);
    }
  }, [token]);

  useEffect(() => {
    if (currentUser?.id && token) {
      fetchMissions();
    }
  }, [currentUser?.id, token, fetchMissions]);

  const claimMissionReward = async (missionId: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/missions/${missionId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.missionsData) setDailyMissions(data.missionsData);
        soundEffects.playConnectChime();
        setXpToast({
          text: `🎯 Mission Reward Claimed! +${data.mission.rewardXp} XP`,
          leveledUp: false,
        });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const claimDailyCheckIn = async (): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/missions/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.missionsData) setDailyMissions(data.missionsData);
        soundEffects.playConnectChime();
        setXpToast({
          text: `🔥 Day ${data.streakDays} Streak Check-In Claimed! +${data.bonusXp} XP`,
          leveledUp: false,
        });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const claimGrandMasterBonus = async (): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/missions/claim-all-bonus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.missionsData) setDailyMissions(data.missionsData);
        soundEffects.playConnectChime();
        setXpToast({
          text: `🌟 Grand Master Daily Bonus Claimed! +${data.bonusXp} XP!`,
          leveledUp: false,
        });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
  const unreadTotal = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        isLoadingUser,
        token,
        onlineUsersCount,
        activeTab,
        setActiveTab,
        conversations,
        activeConversationId,
        setActiveConversationId,
        activeConversation,
        messages,
        unreadTotal,
        typingUsers,
        activeCall,
        callRole,
        friends,
        friendRequests,
        selectedWallpaper,
        setSelectedWallpaper,
        activeRoomId,
        setActiveRoomId,
        isRankProgressOpen,
        setIsRankProgressOpen,
        isWallpaperModalOpen,
        setIsWallpaperModalOpen,
        xpToast,
        clearXpToast,
        dailyMissions,
        isMissionsModalOpen,
        setIsMissionsModalOpen,
        fetchMissions,
        claimMissionReward,
        claimDailyCheckIn,
        claimGrandMasterBonus,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isProfileOpen,
        setIsProfileOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        reportingUser,
        setReportingUser,
        isSafetyOpen,
        setIsSafetyOpen,
        loginAsGuest,
        updateProfile,
        registerAccount,
        loginAccount,
        logout,
        deleteAccount,
        startConversation,
        sendMessage,
        sendTyping,
        deleteMessage,
        refreshConversations,
        initiateCall,
        respondCall,
        endCall,
        addFriend,
        removeFriend,
        refreshFriends,
        blockUser,
        submitReport,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
