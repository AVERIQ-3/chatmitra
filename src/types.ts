export type Gender = 'Male' | 'Female' | 'All';

export type UserStatus = 'online' | 'away' | 'offline';

export type LanguageCode =
  | 'Telugu'
  | 'Hindi'
  | 'English'
  | 'Tamil'
  | 'Kannada'
  | 'Malayalam'
  | 'Bengali'
  | 'Marathi'
  | 'Urdu'
  | 'Odia'
  | 'Gujarati'
  | 'Punjabi';

export type UserRank =
  | 'Novice'
  | 'Amateur'
  | 'Junior'
  | 'Senior'
  | 'Expert'
  | 'Leader'
  | 'Master'
  | 'Grandmaster'
  | 'Guru'
  | 'Legend'
  | 'Ultimate';

export interface UserProfile {
  id: string;
  isGuest: boolean;
  username?: string;
  displayName: string;
  gender: 'Male' | 'Female';
  language: string;
  languages: string[];
  approximateLocation: string;
  approximateDistanceKm?: number;
  avatar: string;
  bio?: string;
  interests: string[];
  status: UserStatus;
  lastActiveAt: string;
  createdAt: string;
  isBanned?: boolean;
  isRestricted?: boolean;
  onlineSocketCount?: number;
  xp?: number;
  level?: number;
  rank?: UserRank;
  stars?: string;
}

export interface CurrentUserSession extends UserProfile {
  guestToken?: string;
  email?: string;
  isAdmin?: boolean;
  allowLocationDiscovery?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRank?: UserRank;
  senderStars?: string;
  senderLevel?: number;
  text: string;
  imageUrl?: string;
  createdAt: string;
  read: boolean;
  isDeleted?: boolean;
}

export interface Room {
  id: string;
  name: string;
  category: 'city' | 'topic' | 'social';
  description: string;
  icon: string;
  activeCount: number;
  popularLanguage?: string;
  tags: string[];
  lastMessage?: {
    text: string;
    senderName: string;
  };
}

export interface RoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderGender: 'Male' | 'Female';
  senderRank: UserRank;
  senderStars: string;
  senderLevel: number;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export type ChatWallpaperId = string;

export interface ChatWallpaper {
  id: string;
  name: string;
  description: string;
  backgroundClass: string;
  previewColor: string;
  patternStyle?: string;
  textColor?: string;
  imageUrl?: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants: UserProfile[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: string;
  createdAt: string;
  isMatch?: boolean;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedUserName: string;
  category:
    | 'Spam'
    | 'Harassment'
    | 'Sexual content'
    | 'Scam/fraud'
    | 'Impersonation'
    | 'Threats'
    | 'Other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface CallSession {
  id: string;
  callerId: string;
  receiverId: string;
  callerName: string;
  callerAvatar: string;
  receiverName: string;
  receiverAvatar: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'connected' | 'rejected' | 'ended';
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  sender: UserProfile;
  status: 'pending' | 'accepted';
  createdAt: string;
}

export interface DiscoveryFilters {
  gender: 'All' | 'Male' | 'Female';
  language: string;
  availability: 'all' | 'online_now';
  location: 'any' | 'nearby';
  sortBy: 'recently_active' | 'recently_joined' | 'nearby';
  page: number;
  limit: number;
  searchQuery?: string;
}

export interface DiscoveryResponse {
  users: UserProfile[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminDashboardData {
  stats: {
    totalRegisteredUsers: number;
    activeGuests: number;
    activeRegisteredUsers: number;
    dailyActiveUsers: number;
    onlineUsers: number;
    totalMessages: number;
    totalConversations: number;
    totalCalls: number;
    pendingReports: number;
    totalBans: number;
  };
  reports: ReportItem[];
  recentUsers: UserProfile[];
  moderationHistory: Array<{
    id: string;
    action: string;
    targetUserId: string;
    targetUserName: string;
    reason: string;
    timestamp: string;
  }>;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'chat' | 'social' | 'explore' | 'profile' | 'style' | 'checkin';
  rewardXp: number;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  claimed: boolean;
  actionTab?: 'discover' | 'match' | 'rooms' | 'chats' | 'friends';
  actionType?: 'open_profile' | 'open_wallpaper' | 'checkin';
  actionLabel?: string;
}

export interface DailyMissionsData {
  date: string;
  streakDays: number;
  lastCheckInDate?: string;
  missions: DailyMission[];
  allClaimedBonusAwarded: boolean;
  totalBonusXp: number;
  completedCount: number;
  unclaimedCount: number;
}

export interface WebSocketEventMessage {
  type:
    | 'user:online'
    | 'user:offline'
    | 'user:presence'
    | 'user:xp_update'
    | 'missions:update'
    | 'room:message'
    | 'room:presence'
    | 'chat:message'
    | 'chat:typing'
    | 'chat:stop_typing'
    | 'chat:read'
    | 'chat:delete'
    | 'conversation:created'
    | 'conversation:ended'
    | 'call:incoming'
    | 'call:accepted'
    | 'call:rejected'
    | 'call:ended'
    | 'call:signal'
    | 'friend:request'
    | 'friend:accepted'
    | 'notification:new';
  payload: any;
}
