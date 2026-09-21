export interface StoredUser {
  id: string;
  isGuest: boolean;
  username?: string;
  passwordHash?: string;
  displayName: string;
  gender: 'Male' | 'Female';
  language: string;
  languages: string[];
  approximateLocation: string;
  lat: number;
  lng: number;
  avatar: string;
  bio?: string;
  interests: string[];
  status: 'online' | 'away' | 'offline';
  lastActiveAt: string;
  createdAt: string;
  isBanned?: boolean;
  isRestricted?: boolean;
  allowLocationDiscovery?: boolean;
  role?: 'user' | 'admin';
  guestToken?: string;
  xp: number;
  level: number;
  rank: string;
  stars: string;
}

export interface StoredRoom {
  id: string;
  name: string;
  category: 'city' | 'topic' | 'social';
  description: string;
  icon: string;
  activeCount: number;
  popularLanguage?: string;
  tags: string[];
}

export interface StoredRoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderGender: 'Male' | 'Female';
  senderRank: string;
  senderStars: string;
  senderLevel: number;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export function calculateUserRank(xp: number = 0): {
  level: number;
  rank: string;
  stars: string;
  nextRank: string | null;
  xpToNextRank: number;
  progressPercent: number;
} {
  const safeXp = Math.max(0, xp);
  const tiers = [
    { level: 1, rank: 'Novice', stars: '★', minXp: 0, maxXp: 99 },
    { level: 2, rank: 'Amateur', stars: '★', minXp: 100, maxXp: 249 },
    { level: 3, rank: 'Junior', stars: '★★', minXp: 250, maxXp: 599 },
    { level: 4, rank: 'Senior', stars: '★★★', minXp: 600, maxXp: 1199 },
    { level: 5, rank: 'Expert', stars: '★★★★', minXp: 1200, maxXp: 2499 },
    { level: 6, rank: 'Leader', stars: '★★★★★', minXp: 2500, maxXp: 4999 },
    { level: 7, rank: 'Master', stars: '👑 Master', minXp: 5000, maxXp: 9999 },
    { level: 8, rank: 'Grandmaster', stars: '💎 Grandmaster', minXp: 10000, maxXp: 19999 },
    { level: 9, rank: 'Guru', stars: '🔥 Guru', minXp: 20000, maxXp: 34999 },
    { level: 10, rank: 'Legend', stars: '⚡ Legend', minXp: 35000, maxXp: 59999 },
    { level: 11, rank: 'Ultimate', stars: '🌟 Ultimate', minXp: 60000, maxXp: 999999 },
  ];

  const currentTier =
    tiers.find((t) => safeXp >= t.minXp && safeXp <= t.maxXp) ||
    tiers[tiers.length - 1];

  const nextTier = tiers.find((t) => t.level === currentTier.level + 1) || null;
  const currentLevelXp = safeXp - currentTier.minXp;
  const levelRange = currentTier.maxXp - currentTier.minXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((currentLevelXp / (levelRange || 1)) * 100))
  );
  const xpToNextRank = nextTier ? Math.max(0, nextTier.minXp - safeXp) : 0;

  return {
    level: currentTier.level,
    rank: currentTier.rank,
    stars: currentTier.stars,
    nextRank: nextTier ? nextTier.rank : null,
    xpToNextRank,
    progressPercent,
  };
}

export interface StoredMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
  read: boolean;
  isDeleted?: boolean;
}

export interface StoredConversation {
  id: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
  isMatch?: boolean;
}

export interface StoredReport {
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

export interface StoredCall {
  id: string;
  callerId: string;
  receiverId: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'connected' | 'rejected' | 'ended';
  createdAt: string;
}

export const SUPPORTED_LANGUAGES = [
  'Telugu',
  'Hindi',
  'English',
  'Tamil',
  'Kannada',
  'Malayalam',
  'Bengali',
  'Marathi',
  'Urdu',
  'Odia',
  'Gujarati',
  'Punjabi',
];

// Approximate reference coordinates for distance sorting
export const REGION_COORDINATES: Record<string, { lat: number; lng: number; label: string }> = {
  guntur: { lat: 16.3067, lng: 80.4365, label: 'Guntur area' },
  hyderabad: { lat: 17.385, lng: 78.4867, label: 'Hyderabad area' },
  vijayawada: { lat: 16.5062, lng: 80.648, label: 'Vijayawada area' },
  visakhapatnam: { lat: 17.6868, lng: 83.2185, label: 'Visakhapatnam area' },
  bengaluru: { lat: 12.9716, lng: 77.5946, label: 'Bengaluru area' },
  chennai: { lat: 13.0827, lng: 80.2707, label: 'Chennai area' },
  mumbai: { lat: 19.076, lng: 72.8777, label: 'Mumbai area' },
  pune: { lat: 18.5204, lng: 73.8567, label: 'Pune area' },
  delhi: { lat: 28.6139, lng: 77.209, label: 'Delhi NCR' },
  kolkata: { lat: 22.5726, lng: 88.3639, label: 'Kolkata area' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, label: 'Ahmedabad area' },
  kochi: { lat: 9.9312, lng: 76.2673, label: 'Kochi area' },
};

// Calculate Haversine distance in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// XSS Sanitizer
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// Seed realistic active users across regions, genders and languages with star ranks & XP
export const INITIAL_SEEDED_USERS: StoredUser[] = [
  {
    id: 'user_rahul_101',
    isGuest: false,
    username: 'rahul_kumar',
    displayName: 'Rahul K.',
    gender: 'Male',
    language: 'Telugu',
    languages: ['Telugu', 'English', 'Hindi'],
    approximateLocation: 'Guntur area',
    lat: 16.31,
    lng: 80.44,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: 'Software engineer who loves cinema, coffee & tech chats. Always up for good conversations.',
    interests: ['Tech', 'Movies', 'Music', 'Cricket'],
    status: 'online',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    xp: 5420,
    level: 7,
    rank: 'Master',
    stars: '👑 Master',
  },
  {
    id: 'user_ananya_102',
    isGuest: false,
    username: 'ananya_v',
    displayName: 'Ananya Sharma',
    gender: 'Female',
    language: 'Hindi',
    languages: ['Hindi', 'English'],
    approximateLocation: 'Delhi NCR',
    lat: 28.62,
    lng: 77.21,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Design enthusiast & traveler. Exploring indie music and photography. Say hi!',
    interests: ['Design', 'Travel', 'Indie Pop', 'Books'],
    status: 'online',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    xp: 14200,
    level: 8,
    rank: 'Grandmaster',
    stars: '💎 Grandmaster',
  },
  {
    id: 'user_karthik_103',
    isGuest: true,
    displayName: 'Guest_Karthik',
    gender: 'Male',
    language: 'Tamil',
    languages: ['Tamil', 'English'],
    approximateLocation: 'Chennai area',
    lat: 13.08,
    lng: 80.27,
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    bio: 'Music producer and casual gamer. Friendly stranger open to talks.',
    interests: ['Gaming', 'Tamil Cinema', 'Synthesizers'],
    status: 'online',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    xp: 420,
    level: 3,
    rank: 'Junior',
    stars: '★★',
  },
  {
    id: 'user_priya_104',
    isGuest: false,
    username: 'priya_reddy',
    displayName: 'Priya Reddy',
    gender: 'Female',
    language: 'Telugu',
    languages: ['Telugu', 'English'],
    approximateLocation: 'Hyderabad area',
    lat: 17.39,
    lng: 78.49,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Foodie, amateur badminton player & student. Let us talk about favorite weekend spots.',
    interests: ['Food', 'Sports', 'Telugu Songs', 'Podcasts'],
    status: 'online',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
    xp: 22800,
    level: 9,
    rank: 'Guru',
    stars: '🔥 Guru',
  },
  {
    id: 'user_sneha_105',
    isGuest: true,
    displayName: 'Guest_78419',
    gender: 'Female',
    language: 'Kannada',
    languages: ['Kannada', 'English', 'Hindi'],
    approximateLocation: 'Bengaluru area',
    lat: 12.98,
    lng: 77.6,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Startup marketer enjoying pleasant Bangalore weather. Looking for good chats.',
    interests: ['Startups', 'Coffee', 'Yoga', 'Art'],
    status: 'away',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    xp: 850,
    level: 4,
    rank: 'Senior',
    stars: '★★★',
  },
  {
    id: 'user_vikram_106',
    isGuest: false,
    username: 'vikram_m',
    displayName: 'Vikram Mehta',
    gender: 'Male',
    language: 'Gujarati',
    languages: ['Gujarati', 'Hindi', 'English'],
    approximateLocation: 'Ahmedabad area',
    lat: 23.03,
    lng: 72.58,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Business consultant, loves cricket and street food discussions.',
    interests: ['Cricket', 'Finance', 'Street Food', 'Standup'],
    status: 'online',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    xp: 1850,
    level: 5,
    rank: 'Expert',
    stars: '★★★★',
  },
  {
    id: 'user_divya_107',
    isGuest: false,
    username: 'divya_nair',
    displayName: 'Divya Nair',
    gender: 'Female',
    language: 'Malayalam',
    languages: ['Malayalam', 'English', 'Tamil'],
    approximateLocation: 'Kochi area',
    lat: 9.94,
    lng: 76.27,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    bio: 'Architect, sketching coastal landscapes and listening to vintage Malayalam classics.',
    interests: ['Architecture', 'Art', 'Nature', 'Cinema'],
    status: 'online',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    xp: 3200,
    level: 6,
    rank: 'Leader',
    stars: '★★★★★',
  },
  {
    id: 'user_arjun_108',
    isGuest: true,
    displayName: 'Guest_39201',
    gender: 'Male',
    language: 'Marathi',
    languages: ['Marathi', 'Hindi', 'English'],
    approximateLocation: 'Pune area',
    lat: 18.53,
    lng: 73.86,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    bio: 'Trekking enthusiast, Sahyadri explorer & mechanical engineer.',
    interests: ['Trekking', 'Motorcycles', 'Rock', 'Fitness'],
    status: 'online',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    xp: 320,
    level: 3,
    rank: 'Junior',
    stars: '★★',
  },
  {
    id: 'user_meera_109',
    isGuest: false,
    username: 'meera_roy',
    displayName: 'Meera Roy',
    gender: 'Female',
    language: 'Bengali',
    languages: ['Bengali', 'English', 'Hindi'],
    approximateLocation: 'Kolkata area',
    lat: 22.58,
    lng: 88.37,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    bio: 'Literature student & chai connoisseur. Passionate about stories and poetry.',
    interests: ['Literature', 'Poetry', 'Philosophy', 'Chai'],
    status: 'online',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 32).toISOString(),
    xp: 41200,
    level: 10,
    rank: 'Legend',
    stars: '⚡ Legend',
  },
  {
    id: 'user_harpreet_110',
    isGuest: true,
    displayName: 'Guest_Harpreet',
    gender: 'Male',
    language: 'Punjabi',
    languages: ['Punjabi', 'Hindi', 'English'],
    approximateLocation: 'Delhi NCR',
    lat: 28.65,
    lng: 77.18,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    bio: 'Gym, fitness, bhangra beats and good vibes. Respectful chats only.',
    interests: ['Fitness', 'Bhangra', 'Cars', 'Gaming'],
    status: 'away',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    xp: 190,
    level: 2,
    rank: 'Amateur',
    stars: '★',
  },
  {
    id: 'user_swathi_111',
    isGuest: false,
    username: 'swathi_guntur',
    displayName: 'Swathi Chowdary',
    gender: 'Female',
    language: 'Telugu',
    languages: ['Telugu', 'English'],
    approximateLocation: 'Guntur area',
    lat: 16.32,
    lng: 80.45,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Medical resident in Guntur. Love classical music, peaceful night walks and deep talks.',
    interests: ['Medicine', 'Classical Music', 'Astronomy', 'Telugu Literature'],
    status: 'online',
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    xp: 68400,
    level: 11,
    rank: 'Ultimate',
    stars: '🌟 Ultimate',
  },
  {
    id: 'user_admin_root',
    isGuest: false,
    username: 'admin_mitra',
    displayName: 'ChatMitra Moderator',
    gender: 'Male',
    language: 'English',
    languages: ['English', 'Telugu', 'Hindi'],
    approximateLocation: 'Hyderabad area',
    lat: 17.385,
    lng: 78.4867,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    bio: 'Official Community Safety & Trust Team member.',
    interests: ['Safety', 'Moderation', 'Community'],
    status: 'online',
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
    role: 'admin',
    xp: 99999,
    level: 11,
    rank: 'Ultimate',
    stars: '🌟 Ultimate',
  },
];

// Seed Public & Regional Topic Chatrooms
export const INITIAL_SEEDED_ROOMS: StoredRoom[] = [
  {
    id: 'room_hyderabad',
    name: 'Hyderabad Hangout',
    category: 'city',
    description: 'Biryani debates, Tollywood news, Charminar chai & friendly vibes',
    icon: '🏛️',
    activeCount: 142,
    popularLanguage: 'Telugu & Urdu',
    tags: ['Tollywood', 'Biryani', 'Late Night', 'Telugu'],
  },
  {
    id: 'room_bengaluru',
    name: 'Bengaluru Cafe',
    category: 'city',
    description: 'Silk Board traffic memes, startup talk, Indiranagar coffee & cool weather',
    icon: '☕',
    activeCount: 198,
    popularLanguage: 'Kannada & English',
    tags: ['Startups', 'Tech', 'Coffee', 'Kannada'],
  },
  {
    id: 'room_mumbai',
    name: 'Mumbai Central',
    category: 'city',
    description: 'Marine Drive evenings, Bollywood updates, local train chats & vada pav',
    icon: '🌊',
    activeCount: 230,
    popularLanguage: 'Hindi & Marathi',
    tags: ['Bollywood', 'Marine Drive', 'Hindi', 'Marathi'],
  },
  {
    id: 'room_delhi',
    name: 'Delhi NCR Adda',
    category: 'city',
    description: 'CP hangouts, street food, campus talk, spicy banter & fun discussions',
    icon: '🏙️',
    activeCount: 185,
    popularLanguage: 'Hindi & Punjabi',
    tags: ['Delhi Food', 'CP', 'Banter', 'Hindi'],
  },
  {
    id: 'room_chennai',
    name: 'Chennai Express',
    category: 'city',
    description: 'Marina Beach breeze, Kollywood release mania & authentic filter coffee',
    icon: '🚆',
    activeCount: 120,
    popularLanguage: 'Tamil & English',
    tags: ['Kollywood', 'Marina', 'Tamil', 'Music'],
  },
  {
    id: 'room_andhra',
    name: 'Vijayawada & Guntur Hub',
    category: 'city',
    description: 'Andhra meals, Amaravati discussions, mirchi banter & Telugu friendship',
    icon: '🌿',
    activeCount: 95,
    popularLanguage: 'Telugu',
    tags: ['Guntur', 'Vijayawada', 'Andhra', 'Telugu'],
  },
  {
    id: 'room_cricket',
    name: 'Cricket & IPL Arena',
    category: 'topic',
    description: 'Live match commentary, squad predictions, captain debates & banter',
    icon: '🏏',
    activeCount: 310,
    popularLanguage: 'All Languages',
    tags: ['IPL', 'T20', 'Team India', 'Match Live'],
  },
  {
    id: 'room_movies',
    name: 'Cinema & OTT Buzz',
    category: 'topic',
    description: 'First day first show reviews, trailer reactions & movie recommendations',
    icon: '🎬',
    activeCount: 240,
    popularLanguage: 'All Languages',
    tags: ['Tollywood', 'Bollywood', 'Hollywood', 'OTT'],
  },
  {
    id: 'room_confessions',
    name: 'Late Night Confessions',
    category: 'social',
    description: 'Deep anonymous night talks, secrets, heartbreak advice & heart-to-hearts',
    icon: '🌙',
    activeCount: 280,
    popularLanguage: 'English & Hindi',
    tags: ['Late Night', 'Heartfelt', 'Secrets', 'Advice'],
  },
  {
    id: 'room_dating',
    name: 'Friendship & Dating (18+)',
    category: 'social',
    description: 'Find a romantic spark, share compliments, playful vibes & flirtatious chats',
    icon: '💘',
    activeCount: 350,
    popularLanguage: 'All Languages',
    tags: ['Dating', 'Flirt', 'Single', 'Friends'],
  },
  {
    id: 'room_tech',
    name: 'Tech & Coding Den',
    category: 'topic',
    description: 'AI, web development, indie hacking, smartphone releases & PC builds',
    icon: '💻',
    activeCount: 160,
    popularLanguage: 'English',
    tags: ['AI', 'Coding', 'Gadgets', 'Startups'],
  },
  {
    id: 'room_music',
    name: 'Music & Song Vibes',
    category: 'topic',
    description: 'Share what song you are listening to, exchange Spotify playlists & rap beats',
    icon: '🎵',
    activeCount: 115,
    popularLanguage: 'All Languages',
    tags: ['Indie', 'Bollywood', 'EDM', 'Playlists'],
  },
];

// Initial seeded lively room messages
export const INITIAL_ROOM_MESSAGES: Record<string, StoredRoomMessage[]> = {
  room_hyderabad: [
    {
      id: 'rm_hyd_1',
      roomId: 'room_hyderabad',
      senderId: 'user_priya_104',
      senderName: 'Priya Reddy',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      senderGender: 'Female',
      senderRank: 'Guru',
      senderStars: '🔥 Guru',
      senderLevel: 9,
      text: 'Namaskaram Hyderabad! Anyone watching the new release this weekend at Prasad’s Multiplex? 🍿',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'rm_hyd_2',
      roomId: 'room_hyderabad',
      senderId: 'user_rahul_101',
      senderName: 'Rahul K.',
      senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      senderGender: 'Male',
      senderRank: 'Master',
      senderStars: '👑 Master',
      senderLevel: 7,
      text: 'Definitely going! Also late night Irani chai near Charminar is a must afterwards ☕🔥',
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    },
  ],
  room_cricket: [
    {
      id: 'rm_crick_1',
      roomId: 'room_cricket',
      senderId: 'user_vikram_106',
      senderName: 'Vikram Mehta',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      senderGender: 'Male',
      senderRank: 'Expert',
      senderStars: '★★★★',
      senderLevel: 5,
      text: 'Who is your pick for MVP in the upcoming tournament? 🏏🔥',
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: 'rm_crick_2',
      roomId: 'room_cricket',
      senderId: 'user_swathi_111',
      senderName: 'Swathi Chowdary',
      senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      senderGender: 'Female',
      senderRank: 'Ultimate',
      senderStars: '🌟 Ultimate',
      senderLevel: 11,
      text: 'King Kohli forever in run chases! No one handles pressure better ⚡👑',
      createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    },
  ],
  room_dating: [
    {
      id: 'rm_date_1',
      roomId: 'room_dating',
      senderId: 'user_ananya_102',
      senderName: 'Ananya Sharma',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      senderGender: 'Female',
      senderRank: 'Grandmaster',
      senderStars: '💎 Grandmaster',
      senderLevel: 8,
      text: 'Hey everyone! Tell me your ideal first coffee date question ✨',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: 'rm_date_2',
      roomId: 'room_dating',
      senderId: 'user_karthik_103',
      senderName: 'Guest_Karthik',
      senderAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      senderGender: 'Male',
      senderRank: 'Junior',
      senderStars: '★★',
      senderLevel: 3,
      text: 'What song makes you roll your car window down on late night drives? 🎵🚗',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  ],
};

