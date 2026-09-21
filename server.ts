import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  StoredUser,
  StoredMessage,
  StoredConversation,
  StoredReport,
  StoredCall,
  StoredRoom,
  StoredRoomMessage,
  INITIAL_SEEDED_USERS,
  INITIAL_SEEDED_ROOMS,
  INITIAL_ROOM_MESSAGES,
  REGION_COORDINATES,
  calculateDistanceKm,
  calculateUserRank,
  sanitizeText,
} from './server/data.ts';

// In-Memory Database Stores
const usersStore: Map<string, StoredUser> = new Map();
const tokenToUserId: Map<string, string> = new Map();
const conversationsStore: Map<string, StoredConversation> = new Map();
const messagesStore: Map<string, StoredMessage[]> = new Map();
const reportsStore: Map<string, StoredReport> = new Map();
const blocksStore: Map<string, Set<string>> = new Map(); // userId -> Set<blockedUserId>
const friendsStore: Map<string, Set<string>> = new Map(); // userId -> Set<friendUserId>
const friendRequestsStore: Map<string, Array<{ id: string; fromUserId: string; toUserId: string; createdAt: string }>> = new Map();
const userSkipsStore: Map<string, Set<string>> = new Map(); // userId -> Set<skippedUserId>
const callsStore: Map<string, StoredCall> = new Map();
const rateLimitMap: Map<string, { count: number; lastReset: number }> = new Map();

// Public Chatrooms Store
const roomsStore: Map<string, StoredRoom> = new Map();
const roomMessagesStore: Map<string, StoredRoomMessage[]> = new Map();
const roomParticipantsStore: Map<string, Set<string>> = new Map(); // roomId -> Set<userId>

// Initialize Seed Users
for (const u of INITIAL_SEEDED_USERS) {
  usersStore.set(u.id, { ...u });
  blocksStore.set(u.id, new Set());
  friendsStore.set(u.id, new Set());
  friendRequestsStore.set(u.id, []);
  userSkipsStore.set(u.id, new Set());
}

// Initialize Seed Chatrooms
for (const r of INITIAL_SEEDED_ROOMS) {
  roomsStore.set(r.id, { ...r });
  roomMessagesStore.set(
    r.id,
    INITIAL_ROOM_MESSAGES[r.id] ? [...INITIAL_ROOM_MESSAGES[r.id]] : []
  );
  roomParticipantsStore.set(r.id, new Set());
}

// Moderation log
const moderationHistory: Array<{
  id: string;
  action: string;
  targetUserId: string;
  targetUserName: string;
  reason: string;
  timestamp: string;
}> = [
  {
    id: 'mod_1',
    action: 'Auto-Filter Warning',
    targetUserId: 'user_harpreet_110',
    targetUserName: 'Guest_Harpreet',
    reason: 'Rapid connection check passed',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

// Active WebSocket Connections: userId -> Set<WebSocket>
const userSockets: Map<string, Set<WebSocket>> = new Map();

// Helper: Broadcast to specific user
function sendToUser(userId: string, event: string, payload: any) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  const data = JSON.stringify({ type: event, payload });
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

// Helper: Broadcast event to ALL connected clients
function broadcastToAll(event: string, payload: any) {
  const data = JSON.stringify({ type: event, payload });
  for (const [, sockets] of userSockets.entries()) {
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }
}

// XP & Level-up Award System
function awardUserXp(userId: string, xpGain: number) {
  const user = usersStore.get(userId);
  if (!user) return null;

  const currentXp = (user.xp || 0) + xpGain;
  const oldLevel = user.level || 1;
  const rankInfo = calculateUserRank(currentXp);

  user.xp = currentXp;
  user.level = rankInfo.level;
  user.rank = rankInfo.rank;
  user.stars = rankInfo.stars;

  const leveledUp = rankInfo.level > oldLevel;

  const updatePayload = {
    userId: user.id,
    xp: user.xp,
    level: user.level,
    rank: user.rank,
    stars: user.stars,
    leveledUp,
    xpGained: xpGain,
    nextRank: rankInfo.nextRank,
    xpToNextRank: rankInfo.xpToNextRank,
    progressPercent: rankInfo.progressPercent,
  };

  // Real-time notification to user
  sendToUser(user.id, 'user:xp_update', updatePayload);
  return updatePayload;
}

// ==========================================
// DAILY MISSIONS SYSTEM & ENGAGEMENT ENGINE
// ==========================================

interface DailyMissionState {
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

interface UserDailyMissionsData {
  userId: string;
  date: string;
  streakDays: number;
  lastCheckInDate?: string;
  missions: DailyMissionState[];
  allClaimedBonusAwarded: boolean;
  totalBonusXp: number;
}

const userMissionsStore = new Map<string, UserDailyMissionsData>();

function getTodayString(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function getYesterdayString(): string {
  const d = new Date(Date.now() - 86400000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function getOrCreateUserMissions(userId: string): UserDailyMissionsData {
  const today = getTodayString();
  const key = `${userId}:${today}`;
  let userMissions = userMissionsStore.get(key);

  if (!userMissions) {
    const yesterday = getYesterdayString();
    const prevKey = `${userId}:${yesterday}`;
    const prevData = userMissionsStore.get(prevKey);
    let streakDays = 1;
    let lastCheckInDate: string | undefined = undefined;

    if (prevData) {
      if (prevData.lastCheckInDate === yesterday) {
        streakDays = prevData.streakDays + 1;
      } else if (prevData.lastCheckInDate === today) {
        streakDays = prevData.streakDays;
        lastCheckInDate = today;
      }
    }

    userMissions = {
      userId,
      date: today,
      streakDays: Math.min(streakDays, 30),
      lastCheckInDate,
      allClaimedBonusAwarded: false,
      totalBonusXp: 100,
      missions: [
        {
          id: 'daily_checkin',
          title: 'Daily Streak Check-in',
          description: 'Check in daily to build your consecutive login streak and claim streak bonus XP',
          icon: 'checkin',
          category: 'checkin',
          rewardXp: 50,
          targetCount: 1,
          currentCount: lastCheckInDate === today ? 1 : 0,
          completed: lastCheckInDate === today,
          claimed: lastCheckInDate === today,
          actionType: 'checkin',
          actionLabel: 'Claim Check-in',
        },
        {
          id: 'send_5_messages',
          title: 'Chat Starter',
          description: 'Send 5 messages in 1-on-1 chats, Quick Match, or community lounges',
          icon: 'message',
          category: 'chat',
          rewardXp: 40,
          targetCount: 5,
          currentCount: 0,
          completed: false,
          claimed: false,
          actionTab: 'chats',
          actionLabel: 'Open Chats',
        },
        {
          id: 'join_public_room',
          title: 'Lounge Explorer',
          description: 'Join any regional city room or topic lounge and post a message',
          icon: 'room',
          category: 'explore',
          rewardXp: 35,
          targetCount: 1,
          currentCount: 0,
          completed: false,
          claimed: false,
          actionTab: 'rooms',
          actionLabel: 'Browse Rooms',
        },
        {
          id: 'update_profile',
          title: 'Personal Touch',
          description: 'Update your profile bio, custom avatar, or interests',
          icon: 'profile',
          category: 'profile',
          rewardXp: 25,
          targetCount: 1,
          currentCount: 0,
          completed: false,
          claimed: false,
          actionType: 'open_profile',
          actionLabel: 'Edit Profile',
        },
        {
          id: 'try_quick_match',
          title: 'Quick Match Adventurer',
          description: 'Start an instant conversation with a random Telugu/regional peer',
          icon: 'match',
          category: 'explore',
          rewardXp: 30,
          targetCount: 1,
          currentCount: 0,
          completed: false,
          claimed: false,
          actionTab: 'match',
          actionLabel: 'Quick Match',
        },
        {
          id: 'change_wallpaper',
          title: 'Vibe & Wallpaper Stylist',
          description: 'Customize or switch your chatroom wallpaper theme',
          icon: 'style',
          category: 'style',
          rewardXp: 25,
          targetCount: 1,
          currentCount: 0,
          completed: false,
          claimed: false,
          actionType: 'open_wallpaper',
          actionLabel: 'Change Wallpaper',
        },
      ],
    };

    userMissionsStore.set(key, userMissions);
  }

  return userMissions;
}

function formatUserMissions(data: UserDailyMissionsData) {
  const completedCount = data.missions.filter((m) => m.completed).length;
  const unclaimedCount = data.missions.filter((m) => m.completed && !m.claimed).length;

  return {
    date: data.date,
    streakDays: data.streakDays,
    lastCheckInDate: data.lastCheckInDate,
    missions: data.missions,
    allClaimedBonusAwarded: data.allClaimedBonusAwarded,
    totalBonusXp: data.totalBonusXp,
    completedCount,
    unclaimedCount,
  };
}

function recordMissionAction(userId: string, actionType: string, amount: number = 1) {
  const data = getOrCreateUserMissions(userId);
  let updated = false;

  data.missions.forEach((m) => {
    if (m.claimed) return;

    if (
      (actionType === 'send_message' && m.id === 'send_5_messages') ||
      (actionType === 'room_message' && m.id === 'join_public_room') ||
      (actionType === 'update_profile' && m.id === 'update_profile') ||
      (actionType === 'quick_match' && m.id === 'try_quick_match') ||
      (actionType === 'change_wallpaper' && m.id === 'change_wallpaper')
    ) {
      const prev = m.currentCount;
      m.currentCount = Math.min(m.targetCount, m.currentCount + amount);
      if (m.currentCount >= m.targetCount) {
        m.completed = true;
      }
      if (m.currentCount !== prev) {
        updated = true;
      }
    }
  });

  if (updated) {
    sendToUser(userId, 'missions:update', formatUserMissions(data));
  }
}

// Helper: Broadcast presence update to all connected clients
function broadcastPresence(userId: string, status: 'online' | 'away' | 'offline') {
  const user = usersStore.get(userId);
  if (!user) return;
  user.status = status;
  user.lastActiveAt = new Date().toISOString();
  const data = JSON.stringify({
    type: 'user:presence',
    payload: { userId, status, lastActiveAt: user.lastActiveAt },
  });
  for (const [, sockets] of userSockets.entries()) {
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }
}

// Helper: Get or extract user from request
function getAuthUser(req: Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.chatmitra_token) {
    token = req.cookies.chatmitra_token;
  } else if (req.headers['x-guest-token']) {
    token = String(req.headers['x-guest-token']);
  }

  if (!token) return null;
  const userId = tokenToUserId.get(token);
  if (!userId) return null;
  const user = usersStore.get(userId);
  return user || null;
}

// Helper: Rate limiting check
function checkRateLimit(identifier: string, limit = 15, windowMs = 5000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  if (!record || now - record.lastReset > windowMs) {
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count += 1;
  return true;
}

// Helper to format public user profile (NEVER expose exact GPS)
function formatPublicProfile(user: StoredUser, requester?: StoredUser | null) {
  let approxDistanceKm: number | undefined;
  if (requester && requester.lat && requester.lng && user.lat && user.lng && requester.id !== user.id) {
    approxDistanceKm = calculateDistanceKm(requester.lat, requester.lng, user.lat, user.lng);
  }

  const rankInfo = calculateUserRank(user.xp || 0);

  return {
    id: user.id,
    isGuest: user.isGuest,
    username: user.username,
    displayName: user.displayName,
    gender: user.gender,
    language: user.language,
    languages: user.languages || [user.language],
    approximateLocation: user.approximateLocation,
    approximateDistanceKm: approxDistanceKm,
    avatar: user.avatar,
    bio: user.bio || '',
    interests: user.interests || [],
    status: user.status,
    lastActiveAt: user.lastActiveAt,
    createdAt: user.createdAt,
    isBanned: user.isBanned || false,
    isRestricted: user.isRestricted || false,
    onlineSocketCount: (userSockets.get(user.id)?.size || 0),
    xp: user.xp || 0,
    level: rankInfo.level,
    rank: rankInfo.rank,
    stars: rankInfo.stars,
    nextRank: rankInfo.nextRank,
    xpToNextRank: rankInfo.xpToNextRank,
    progressPercent: rankInfo.progressPercent,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // Security headers & CORS
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'ChatMitra API',
      usersCount: usersStore.size,
      onlineUsers: Array.from(usersStore.values()).filter((u) => u.status === 'online').length,
    });
  });

  // ==========================================
  // AUTHENTICATION & GUEST SYSTEM
  // ==========================================

  // POST /api/auth/guest - Create or resume guest session
  app.post('/api/auth/guest', (req: Request, res: Response) => {
    const { gender, language, approximateLocation, displayName, avatar } = req.body;

    // Check if guest token already provided
    let currentUser = getAuthUser(req);

    if (!currentUser) {
      const guestId = 'guest_' + crypto.randomBytes(6).toString('hex');
      const token = 'tok_' + crypto.randomBytes(16).toString('hex');
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const chosenGender = gender === 'Female' ? 'Female' : 'Male';
      const chosenLang = language || 'Telugu';

      // Pick default avatar based on gender unless provided
      const avatarMale = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
      const avatarFemale = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80';

      // Default approximate location
      const locKey = (approximateLocation || 'Hyderabad').toLowerCase();
      const matchedLoc = Object.keys(REGION_COORDINATES).find((k) => locKey.includes(k));
      const locData = matchedLoc ? REGION_COORDINATES[matchedLoc] : REGION_COORDINATES.hyderabad;

      currentUser = {
        id: guestId,
        isGuest: true,
        displayName: displayName ? sanitizeText(displayName) : `Guest_${randomNum}`,
        gender: chosenGender,
        language: chosenLang,
        languages: [chosenLang],
        approximateLocation: locData.label,
        lat: locData.lat + (Math.random() - 0.5) * 0.05,
        lng: locData.lng + (Math.random() - 0.5) * 0.05,
        avatar: avatar || (chosenGender === 'Female' ? avatarFemale : avatarMale),
        bio: 'Just browsing ChatMitra as a guest.',
        interests: ['Chats', 'Meeting People'],
        status: 'online',
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        guestToken: token,
        allowLocationDiscovery: true,
        xp: 0,
        level: 1,
        rank: 'Novice',
        stars: '★',
      };

      usersStore.set(currentUser.id, currentUser);
      tokenToUserId.set(token, currentUser.id);
      blocksStore.set(currentUser.id, new Set());
      friendsStore.set(currentUser.id, new Set());
      friendRequestsStore.set(currentUser.id, []);
      userSkipsStore.set(currentUser.id, new Set());
    } else {
      // Update existing guest preferences
      if (gender) currentUser.gender = gender === 'Female' ? 'Female' : 'Male';
      if (avatar) currentUser.avatar = avatar;
      if (language) {
        currentUser.language = language;
        if (!currentUser.languages.includes(language)) currentUser.languages.push(language);
      }
      if (displayName) currentUser.displayName = sanitizeText(displayName);
      if (approximateLocation) {
        const locKey = approximateLocation.toLowerCase();
        const matchedLoc = Object.keys(REGION_COORDINATES).find((k) => locKey.includes(k));
        if (matchedLoc) {
          currentUser.approximateLocation = REGION_COORDINATES[matchedLoc].label;
          currentUser.lat = REGION_COORDINATES[matchedLoc].lat;
          currentUser.lng = REGION_COORDINATES[matchedLoc].lng;
        }
      }
      currentUser.status = 'online';
      currentUser.lastActiveAt = new Date().toISOString();
    }

    const sessionUser = currentUser;

    // Set secure HTTP-only cookie
    res.cookie('chatmitra_token', sessionUser.guestToken || '', {
      httpOnly: true,
      secure: false, // development / container proxy safe
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token: sessionUser.guestToken,
      user: {
        ...formatPublicProfile(sessionUser),
        allowLocationDiscovery: sessionUser.allowLocationDiscovery,
      },
    });
  });

  // GET /api/auth/me - Current user session
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'No active session' });
    }
    res.json({
      user: {
        ...formatPublicProfile(user),
        allowLocationDiscovery: user.allowLocationDiscovery,
        role: user.role,
      },
      token: user.guestToken,
    });
  });

  // PATCH /api/auth/me - Update profile
  app.patch('/api/auth/me', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { displayName, gender, language, languages, bio, interests, approximateLocation, allowLocationDiscovery, status } = req.body;
    if (displayName) user.displayName = sanitizeText(displayName).slice(0, 30);
    if (gender && (gender === 'Male' || gender === 'Female')) user.gender = gender;
    if (language) user.language = language;
    if (Array.isArray(languages)) user.languages = languages;
    if (typeof bio === 'string') user.bio = sanitizeText(bio).slice(0, 250);
    if (Array.isArray(interests)) user.interests = interests.slice(0, 10).map((i) => sanitizeText(String(i)));
    if (typeof allowLocationDiscovery === 'boolean') user.allowLocationDiscovery = allowLocationDiscovery;
    if (status && ['online', 'away', 'offline'].includes(status)) {
      user.status = status;
      broadcastPresence(user.id, status);
    }
    if (approximateLocation) {
      const locKey = approximateLocation.toLowerCase();
      const matched = Object.keys(REGION_COORDINATES).find((k) => locKey.includes(k));
      if (matched) {
        user.approximateLocation = REGION_COORDINATES[matched].label;
        user.lat = REGION_COORDINATES[matched].lat;
        user.lng = REGION_COORDINATES[matched].lng;
      } else {
        user.approximateLocation = sanitizeText(approximateLocation).slice(0, 40);
      }
    }
    user.lastActiveAt = new Date().toISOString();
    recordMissionAction(user.id, 'update_profile', 1);

    res.json({ success: true, user: formatPublicProfile(user) });
  });

  // POST /api/auth/register - Convert guest to permanent account (or new registration)
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { username, password, email } = req.body;
    if (!username || !password || username.length < 3) {
      return res.status(400).json({ error: 'Username (min 3 chars) and password are required' });
    }

    const cleanUsername = sanitizeText(username).toLowerCase().replace(/\s+/g, '_');

    // Check if username taken
    for (const existing of usersStore.values()) {
      if (existing.username && existing.username.toLowerCase() === cleanUsername) {
        return res.status(409).json({ error: 'Username is already taken' });
      }
    }

    let user = getAuthUser(req);
    if (!user) {
      // Create new registered user
      const newId = 'user_' + crypto.randomBytes(6).toString('hex');
      const token = 'tok_' + crypto.randomBytes(16).toString('hex');
      user = {
        id: newId,
        isGuest: false,
        username: cleanUsername,
        passwordHash: crypto.createHash('sha256').update(password).digest('hex'),
        displayName: username,
        gender: 'Male',
        language: 'English',
        languages: ['English'],
        approximateLocation: 'Hyderabad area',
        lat: 17.385,
        lng: 78.4867,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        bio: 'ChatMitra registered member.',
        interests: ['Tech', 'Cinema', 'Music'],
        status: 'online',
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        guestToken: token,
        allowLocationDiscovery: true,
        xp: 0,
        level: 1,
        rank: 'Novice',
        stars: '★',
      };
      usersStore.set(user.id, user);
      tokenToUserId.set(token, user.id);
      blocksStore.set(user.id, new Set());
      friendsStore.set(user.id, new Set());
      friendRequestsStore.set(user.id, []);
      userSkipsStore.set(user.id, new Set());
    } else {
      // Upgrade guest account into registered account, preserving state & conversations
      user.isGuest = false;
      user.username = cleanUsername;
      user.passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      if (email) user.bio = user.bio || '';
    }

    const targetUser = user;

    res.cookie('chatmitra_token', targetUser.guestToken || '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Account successfully registered! Your conversations and preferences have been preserved.',
      user: formatPublicProfile(targetUser),
      token: targetUser.guestToken,
    });
  });

  // POST /api/auth/login - Login registered user
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const cleanUsername = sanitizeText(username).toLowerCase().replace(/\s+/g, '_');
    const hash = crypto.createHash('sha256').update(password).digest('hex');

    let foundUser: StoredUser | null = null;
    for (const u of usersStore.values()) {
      if (u.username && u.username.toLowerCase() === cleanUsername) {
        // Special case for demo root admin
        if (cleanUsername === 'admin_mitra' && password === 'admin123') {
          foundUser = u;
          break;
        }
        if (u.passwordHash === hash) {
          foundUser = u;
          break;
        }
      }
    }

    if (!foundUser) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    foundUser.status = 'online';
    foundUser.lastActiveAt = new Date().toISOString();
    if (!foundUser.guestToken) {
      foundUser.guestToken = 'tok_' + crypto.randomBytes(16).toString('hex');
    }
    tokenToUserId.set(foundUser.guestToken, foundUser.id);

    res.cookie('chatmitra_token', foundUser.guestToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: formatPublicProfile(foundUser),
      token: foundUser.guestToken,
    });
  });

  // POST /api/auth/logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (user) {
      broadcastPresence(user.id, 'offline');
    }
    res.clearCookie('chatmitra_token');
    res.json({ success: true });
  });

  // DELETE /api/auth/me - Delete account or reset guest session
  app.delete('/api/auth/me', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    broadcastPresence(user.id, 'offline');
    if (user.guestToken) tokenToUserId.delete(user.guestToken);
    usersStore.delete(user.id);
    blocksStore.delete(user.id);
    friendsStore.delete(user.id);
    friendRequestsStore.delete(user.id);
    userSkipsStore.delete(user.id);

    res.clearCookie('chatmitra_token');
    res.json({ success: true, message: 'Account and session data permanently removed.' });
  });

  // ==========================================
  // DISCOVERY & USERS API
  // ==========================================

  // GET /api/users/discover - Server-side filtered and sorted user list with pagination
  app.get('/api/users/discover', (req: Request, res: Response) => {
    const currentUser = getAuthUser(req);
    const myBlocked = currentUser ? blocksStore.get(currentUser.id) || new Set() : new Set();

    const gender = (req.query.gender as string) || 'All';
    const language = (req.query.language as string) || '';
    const availability = (req.query.availability as string) || 'all';
    const locationFilter = (req.query.location as string) || 'any';
    const sortBy = (req.query.sortBy as string) || 'recently_active';
    const search = ((req.query.search as string) || '').toLowerCase();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));

    let list: StoredUser[] = Array.from(usersStore.values());

    // 1. Exclude self, banned users, and blocked relationships
    list = list.filter((u) => {
      if (currentUser && u.id === currentUser.id) return false;
      if (u.isBanned) return false;
      if (myBlocked.has(u.id)) return false;
      const theirBlocks = blocksStore.get(u.id);
      if (currentUser && theirBlocks && theirBlocks.has(currentUser.id)) return false;
      return true;
    });

    // 2. Gender filter
    if (gender && gender !== 'All') {
      list = list.filter((u) => u.gender.toLowerCase() === gender.toLowerCase());
    }

    // 3. Language filter
    if (language && language !== 'All') {
      const langs = language.split(',').map((l) => l.trim().toLowerCase());
      list = list.filter((u) => {
        const uLangs = (u.languages || [u.language]).map((l) => l.toLowerCase());
        return langs.some((l) => uLangs.includes(l));
      });
    }

    // 4. Availability filter
    if (availability === 'online_now') {
      list = list.filter((u) => u.status === 'online');
    }

    // 5. Search query (by display name or interests)
    if (search) {
      list = list.filter((u) => {
        const matchName = u.displayName.toLowerCase().includes(search);
        const matchInterests = u.interests?.some((i) => i.toLowerCase().includes(search));
        const matchLoc = u.approximateLocation.toLowerCase().includes(search);
        return matchName || matchInterests || matchLoc;
      });
    }

    // 6. Nearby filter
    if (locationFilter === 'nearby' && currentUser && currentUser.lat && currentUser.lng) {
      list = list.filter((u) => {
        if (!u.lat || !u.lng) return false;
        const d = calculateDistanceKm(currentUser.lat, currentUser.lng, u.lat, u.lng);
        return d <= 300; // within 300km
      });
    }

    // 7. Server-side Sorting
    if (sortBy === 'nearby' && currentUser && currentUser.lat && currentUser.lng) {
      list.sort((a, b) => {
        const dA = calculateDistanceKm(currentUser.lat, currentUser.lng, a.lat, a.lng);
        const dB = calculateDistanceKm(currentUser.lat, currentUser.lng, b.lat, b.lng);
        return dA - dB;
      });
    } else if (sortBy === 'recently_joined') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Default: recently_active (online users first, then lastActiveAt DESC)
      list.sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (b.status === 'online' && a.status !== 'online') return 1;
        return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
      });
    }

    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const pagedUsers = list.slice(startIndex, startIndex + limit).map((u) => formatPublicProfile(u, currentUser));

    res.json({
      users: pagedUsers,
      total,
      page,
      totalPages,
    });
  });

  // GET /api/users/:id - Public profile
  app.get('/api/users/:id', (req: Request, res: Response) => {
    const user = usersStore.get(req.params.id);
    if (!user || user.isBanned) return res.status(404).json({ error: 'User not found' });
    const currentUser = getAuthUser(req);
    res.json({ user: formatPublicProfile(user, currentUser) });
  });

  // POST /api/users/:id/block - Block user
  app.post('/api/users/:id/block', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const targetId = req.params.id;
    if (targetId === user.id) return res.status(400).json({ error: 'Cannot block self' });

    let myBlocks = blocksStore.get(user.id);
    if (!myBlocks) {
      myBlocks = new Set();
      blocksStore.set(user.id, myBlocks);
    }
    myBlocks.add(targetId);

    // Notify other user to terminate any active call or session
    sendToUser(targetId, 'conversation:ended', { byUserId: user.id });

    res.json({ success: true, message: 'User has been blocked.' });
  });

  // DELETE /api/users/:id/block - Unblock user
  app.delete('/api/users/:id/block', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const targetId = req.params.id;
    const myBlocks = blocksStore.get(user.id);
    if (myBlocks) myBlocks.delete(targetId);
    res.json({ success: true, message: 'User has been unblocked.' });
  });

  // POST /api/users/:id/report - Report user
  app.post('/api/users/:id/report', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const targetUser = usersStore.get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'Reported user does not exist' });

    const { category, description } = req.body;
    const reportId = 'rep_' + crypto.randomBytes(6).toString('hex');
    const newReport: StoredReport = {
      id: reportId,
      reporterId: user.id,
      reportedUserId: targetUser.id,
      reportedUserName: targetUser.displayName,
      category: category || 'Other',
      description: description ? sanitizeText(description).slice(0, 500) : '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    reportsStore.set(reportId, newReport);
    res.json({ success: true, message: 'Thank you. The report has been received for moderation.' });
  });

  // ==========================================
  // CONVERSATIONS & REAL-TIME MESSAGING
  // ==========================================

  // GET /api/conversations - List active conversations
  app.get('/api/conversations', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const myBlocks = blocksStore.get(user.id) || new Set();
    const results: any[] = [];

    for (const conv of conversationsStore.values()) {
      if (conv.participantIds.includes(user.id)) {
        const otherId = conv.participantIds.find((id) => id !== user.id);
        if (!otherId) continue;
        if (myBlocks.has(otherId)) continue;
        const otherUser = usersStore.get(otherId);
        if (!otherUser || otherUser.isBanned) continue;

        const msgs = messagesStore.get(conv.id) || [];
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
        const unreadCount = msgs.filter((m) => m.senderId !== user.id && !m.read).length;

        results.push({
          id: conv.id,
          participantIds: conv.participantIds,
          participants: [formatPublicProfile(otherUser, user)],
          lastMessage: lastMsg,
          unreadCount,
          updatedAt: conv.updatedAt,
          createdAt: conv.createdAt,
          isMatch: conv.isMatch || false,
        });
      }
    }

    results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({ conversations: results });
  });

  // POST /api/conversations - Create or find 1-to-1 conversation
  app.post('/api/conversations', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { targetUserId } = req.body;
    if (!targetUserId || targetUserId === user.id) {
      return res.status(400).json({ error: 'Invalid target user' });
    }

    const targetUser = usersStore.get(targetUserId);
    if (!targetUser || targetUser.isBanned) {
      return res.status(404).json({ error: 'Target user is unavailable' });
    }

    // Check blocks
    const myBlocks = blocksStore.get(user.id) || new Set();
    const theirBlocks = blocksStore.get(targetUserId) || new Set();
    if (myBlocks.has(targetUserId) || theirBlocks.has(user.id)) {
      return res.status(403).json({ error: 'Cannot start conversation with this user' });
    }

    // Find existing conversation
    let existingConv: StoredConversation | null = null;
    for (const c of conversationsStore.values()) {
      if (c.participantIds.includes(user.id) && c.participantIds.includes(targetUserId)) {
        existingConv = c;
        break;
      }
    }

    if (!existingConv) {
      const convId = 'conv_' + crypto.randomBytes(8).toString('hex');
      existingConv = {
        id: convId,
        participantIds: [user.id, targetUserId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      conversationsStore.set(convId, existingConv);
      messagesStore.set(convId, []);

      // Notify other user via WebSocket
      sendToUser(targetUserId, 'conversation:created', {
        id: convId,
        participantIds: existingConv.participantIds,
        participants: [formatPublicProfile(user, targetUser)],
      });
    }

    res.json({
      conversation: {
        id: existingConv.id,
        participantIds: existingConv.participantIds,
        participants: [formatPublicProfile(targetUser, user)],
        createdAt: existingConv.createdAt,
        updatedAt: existingConv.updatedAt,
      },
    });
  });

  // GET /api/conversations/:id/messages
  app.get('/api/conversations/:id/messages', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const conv = conversationsStore.get(req.params.id);
    if (!conv || !conv.participantIds.includes(user.id)) {
      return res.status(403).json({ error: 'Unauthorized conversation access' });
    }

    const msgs = messagesStore.get(conv.id) || [];
    // Mark messages sent by other user as read
    let markedAny = false;
    for (const m of msgs) {
      if (m.senderId !== user.id && !m.read) {
        m.read = true;
        markedAny = true;
      }
    }

    if (markedAny) {
      const otherId = conv.participantIds.find((id) => id !== user.id);
      if (otherId) {
        sendToUser(otherId, 'chat:read', { conversationId: conv.id, readBy: user.id });
      }
    }

    res.json({ messages: msgs.filter((m) => !m.isDeleted) });
  });

  // POST /api/conversations/:id/messages - Send message
  app.post('/api/conversations/:id/messages', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Spam / abuse rate limiting check
    if (!checkRateLimit(`msg_${user.id}`, 6, 3000)) {
      return res.status(429).json({ error: 'You are sending messages too fast. Please slow down.' });
    }

    const conv = conversationsStore.get(req.params.id);
    if (!conv || !conv.participantIds.includes(user.id)) {
      return res.status(403).json({ error: 'Unauthorized conversation access' });
    }

    const otherId = conv.participantIds.find((id) => id !== user.id);
    if (!otherId) return res.status(400).json({ error: 'Invalid conversation recipient' });

    // Check blocks
    const myBlocks = blocksStore.get(user.id) || new Set();
    const theirBlocks = blocksStore.get(otherId) || new Set();
    if (myBlocks.has(otherId) || theirBlocks.has(user.id)) {
      return res.status(403).json({ error: 'Message blocked by user settings.' });
    }

    const { text, imageUrl } = req.body;
    if (!text && !imageUrl) {
      return res.status(400).json({ error: 'Message text or image is required' });
    }

    const sanitizedText = sanitizeText(String(text || '')).slice(0, 1000);

    const messageId = 'msg_' + crypto.randomBytes(8).toString('hex');
    const newMsg: StoredMessage = {
      id: messageId,
      conversationId: conv.id,
      senderId: user.id,
      senderName: user.displayName,
      senderAvatar: user.avatar,
      text: sanitizedText,
      imageUrl: imageUrl ? String(imageUrl).slice(0, 500000) : undefined, // allow base64 or url
      createdAt: new Date().toISOString(),
      read: false,
    };

    const msgs = messagesStore.get(conv.id) || [];
    msgs.push(newMsg);
    conv.updatedAt = newMsg.createdAt;

    // Send real-time socket message to other user
    sendToUser(otherId, 'chat:message', newMsg);
    // Also echo to current user's other open tabs
    sendToUser(user.id, 'chat:message', newMsg);

    // Award XP (+10 XP per chat message)
    awardUserXp(user.id, 10);
    recordMissionAction(user.id, 'send_message', 1);

    // Contextual Stranger Responder for seeded simulated users (Rahul, Swathi, Ananya, etc.)
    const otherUser = usersStore.get(otherId);
    if (otherUser && otherId.startsWith('user_') && !otherUser.isGuest) {
      triggerStrangerResponse(conv.id, otherUser, user, sanitizedText);
    }

    res.json({ success: true, message: newMsg });
  });

  // DELETE /api/conversations/:id/messages/:messageId - Delete own message
  app.delete('/api/conversations/:id/messages/:messageId', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const msgs = messagesStore.get(req.params.id) || [];
    const targetMsg = msgs.find((m) => m.id === req.params.messageId);
    if (!targetMsg) return res.status(404).json({ error: 'Message not found' });
    if (targetMsg.senderId !== user.id) return res.status(403).json({ error: 'Can only delete own message' });

    targetMsg.isDeleted = true;

    const conv = conversationsStore.get(req.params.id);
    if (conv) {
      for (const pId of conv.participantIds) {
        sendToUser(pId, 'chat:delete', { conversationId: conv.id, messageId: targetMsg.id });
      }
    }

    res.json({ success: true });
  });

  // ==========================================
  // PUBLIC CHATROOMS API (City, Topic, Social)
  // ==========================================

  // GET /api/rooms - List all rooms with active count and last message
  app.get('/api/rooms', (req: Request, res: Response) => {
    const { category, search } = req.query;
    let list = Array.from(roomsStore.values());

    if (category && category !== 'all') {
      list = list.filter((r) => r.category === category);
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    const roomsWithMeta = list.map((r) => {
      const liveParticipants = roomParticipantsStore.get(r.id)?.size || 0;
      const msgs = roomMessagesStore.get(r.id) || [];
      const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;

      return {
        ...r,
        activeCount: r.activeCount + liveParticipants,
        lastMessage,
      };
    });

    res.json({ rooms: roomsWithMeta });
  });

  // GET /api/rooms/:id - Get specific room details & active members
  app.get('/api/rooms/:id', (req: Request, res: Response) => {
    const room = roomsStore.get(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const liveUserIds = Array.from(roomParticipantsStore.get(room.id) || []);
    const liveUsers = liveUserIds
      .map((uid) => usersStore.get(uid))
      .filter((u): u is StoredUser => Boolean(u))
      .map((u) => formatPublicProfile(u));

    res.json({
      room: {
        ...room,
        activeCount: room.activeCount + liveUserIds.length,
        liveMembers: liveUsers,
      },
    });
  });

  // GET /api/rooms/:id/messages - Get room chat history
  app.get('/api/rooms/:id/messages', (req: Request, res: Response) => {
    const room = roomsStore.get(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const msgs = roomMessagesStore.get(room.id) || [];
    res.json({ messages: msgs.slice(-100) });
  });

  // POST /api/rooms/:id/join - Join room
  app.post('/api/rooms/:id/join', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const room = roomsStore.get(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    let participants = roomParticipantsStore.get(room.id);
    if (!participants) {
      participants = new Set();
      roomParticipantsStore.set(room.id, participants);
    }
    participants.add(user.id);

    // Broadcast room presence
    broadcastToAll('room:presence', {
      roomId: room.id,
      userId: user.id,
      user: formatPublicProfile(user),
      action: 'joined',
      activeCount: room.activeCount + participants.size,
    });

    res.json({ success: true, activeCount: room.activeCount + participants.size });
  });

  // POST /api/rooms/:id/leave - Leave room
  app.post('/api/rooms/:id/leave', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const room = roomsStore.get(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const participants = roomParticipantsStore.get(room.id);
    if (participants) {
      participants.delete(user.id);
    }

    broadcastToAll('room:presence', {
      roomId: room.id,
      userId: user.id,
      user: formatPublicProfile(user),
      action: 'left',
      activeCount: room.activeCount + (participants?.size || 0),
    });

    res.json({ success: true });
  });

  // POST /api/rooms/:id/messages - Send message to public room
  app.post('/api/rooms/:id/messages', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Spam rate limit
    if (!checkRateLimit(`room_msg_${user.id}`, 6, 3000)) {
      return res.status(429).json({ error: 'You are chatting too fast in this room. Please slow down.' });
    }

    const room = roomsStore.get(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const { text, imageUrl } = req.body;
    if (!text && !imageUrl) {
      return res.status(400).json({ error: 'Message text or image/gif is required' });
    }

    const sanitized = sanitizeText(String(text || '')).slice(0, 1000);
    const userRankInfo = calculateUserRank(user.xp || 0);

    const newMsg: StoredRoomMessage = {
      id: 'rm_msg_' + crypto.randomBytes(8).toString('hex'),
      roomId: room.id,
      senderId: user.id,
      senderName: user.displayName,
      senderAvatar: user.avatar,
      senderGender: user.gender,
      senderRank: userRankInfo.rank,
      senderStars: userRankInfo.stars,
      senderLevel: userRankInfo.level,
      text: sanitized,
      imageUrl: imageUrl ? String(imageUrl).slice(0, 500000) : undefined,
      createdAt: new Date().toISOString(),
    };

    let msgs = roomMessagesStore.get(room.id);
    if (!msgs) {
      msgs = [];
      roomMessagesStore.set(room.id, msgs);
    }
    msgs.push(newMsg);
    if (msgs.length > 200) {
      msgs.shift(); // keep last 200
    }

    // Award +5 XP for active room participation
    awardUserXp(user.id, 5);
    recordMissionAction(user.id, 'room_message', 1);
    recordMissionAction(user.id, 'send_message', 1);

    // Broadcast room message to all connected clients
    broadcastToAll('room:message', newMsg);

    // Occasional simulated community response in chatrooms
    triggerRoomBotReply(room, user, sanitized);

    res.json({ success: true, message: newMsg });
  });

  // ==========================================
  // RANDOM MATCHING ("FIND SOMEONE" / SKIP)
  // ==========================================

  // POST /api/match/find - Find random stranger with filters
  app.post('/api/match/find', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { genderPreference, languagePreference } = req.body;
    const myBlocks = blocksStore.get(user.id) || new Set();
    const mySkips = userSkipsStore.get(user.id) || new Set();

    const candidates = Array.from(usersStore.values()).filter((u) => {
      if (u.id === user.id) return false;
      if (u.isBanned) return false;
      if (myBlocks.has(u.id)) return false;
      if (mySkips.has(u.id)) return false;
      const theirBlocks = blocksStore.get(u.id);
      if (theirBlocks && theirBlocks.has(user.id)) return false;

      // Gender preference filter
      if (genderPreference && genderPreference !== 'All' && u.gender !== genderPreference) {
        return false;
      }
      // Language preference filter
      if (languagePreference && languagePreference !== 'All') {
        const uLangs = (u.languages || [u.language]).map((l) => l.toLowerCase());
        if (!uLangs.includes(languagePreference.toLowerCase())) return false;
      }
      return true;
    });

    if (candidates.length === 0) {
      // If exhausted, clear skips and retry
      mySkips.clear();
      const retryCandidates = Array.from(usersStore.values()).filter(
        (u) => u.id !== user.id && !u.isBanned && !myBlocks.has(u.id)
      );
      if (retryCandidates.length === 0) {
        return res.status(404).json({ error: 'No matching users available right now. Try expanding your filters.' });
      }
      const matched = retryCandidates[Math.floor(Math.random() * retryCandidates.length)];
      return createOrGetMatchConversation(user, matched, res);
    }

    // Pick candidate: prefer online
    candidates.sort((a, b) => (a.status === 'online' ? -1 : 1));
    const matched = candidates[Math.floor(Math.random() * Math.min(candidates.length, 3))];

    createOrGetMatchConversation(user, matched, res);
  });

  function createOrGetMatchConversation(user: StoredUser, target: StoredUser, res: Response) {
    let existingConv: StoredConversation | null = null;
    for (const c of conversationsStore.values()) {
      if (c.participantIds.includes(user.id) && c.participantIds.includes(target.id)) {
        existingConv = c;
        break;
      }
    }

    if (!existingConv) {
      const convId = 'conv_match_' + crypto.randomBytes(8).toString('hex');
      existingConv = {
        id: convId,
        participantIds: [user.id, target.id],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isMatch: true,
      };
      conversationsStore.set(convId, existingConv);
      messagesStore.set(convId, []);

      // Initial friendly greeting from the matched stranger
      const introMsgId = 'msg_intro_' + crypto.randomBytes(6).toString('hex');
      const intros = [
        `Hey there! Nice to connect with you on ChatMitra 👋`,
        `Hello! How's your day going?`,
        `Namaste! Glad we matched. What brings you to ChatMitra today?`,
        `Hey! Where are you connecting from?`,
      ];
      const introText = intros[Math.floor(Math.random() * intros.length)];
      const introMsg: StoredMessage = {
        id: introMsgId,
        conversationId: convId,
        senderId: target.id,
        senderName: target.displayName,
        senderAvatar: target.avatar,
        text: introText,
        createdAt: new Date().toISOString(),
        read: false,
      };
      messagesStore.get(convId)?.push(introMsg);
    }

    recordMissionAction(user.id, 'quick_match', 1);
    recordMissionAction(target.id, 'quick_match', 1);

    res.json({
      success: true,
      partner: formatPublicProfile(target, user),
      conversationId: existingConv.id,
    });
  }

  // POST /api/match/skip - Skip current partner
  app.post('/api/match/skip', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { targetUserId } = req.body;
    if (targetUserId) {
      let mySkips = userSkipsStore.get(user.id);
      if (!mySkips) {
        mySkips = new Set();
        userSkipsStore.set(user.id, mySkips);
      }
      mySkips.add(targetUserId);
    }

    res.json({ success: true, message: 'Skipped partner.' });
  });

  // ==========================================
  // FRIEND SYSTEM (REGISTERED ACCOUNTS)
  // ==========================================

  // GET /api/friends - List friends and requests
  app.get('/api/friends', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const friendIds = friendsStore.get(user.id) || new Set();
    const friends = Array.from(friendIds)
      .map((id) => usersStore.get(id))
      .filter((u): u is StoredUser => !!u && !u.isBanned)
      .map((u) => formatPublicProfile(u, user));

    const requests = (friendRequestsStore.get(user.id) || [])
      .map((reqItem) => {
        const sender = usersStore.get(reqItem.fromUserId);
        return sender ? { ...reqItem, sender: formatPublicProfile(sender, user) } : null;
      })
      .filter(Boolean);

    res.json({ friends, requests });
  });

  // POST /api/friends/:id - Send request or accept
  app.post('/api/friends/:id', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.isGuest) {
      return res.status(403).json({
        error: 'Create a free account to add friends and keep your connections permanently!',
        requireRegistration: true,
      });
    }

    const targetUser = usersStore.get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    let myFriends = friendsStore.get(user.id);
    if (!myFriends) {
      myFriends = new Set();
      friendsStore.set(user.id, myFriends);
    }
    let targetFriends = friendsStore.get(targetUser.id);
    if (!targetFriends) {
      targetFriends = new Set();
      friendsStore.set(targetUser.id, targetFriends);
    }

    myFriends.add(targetUser.id);
    targetFriends.add(user.id);

    sendToUser(targetUser.id, 'friend:accepted', { friend: formatPublicProfile(user, targetUser) });
    res.json({ success: true, message: `Connected as friends with ${targetUser.displayName}!` });
  });

  // DELETE /api/friends/:id - Remove friend
  app.delete('/api/friends/:id', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const targetId = req.params.id;

    friendsStore.get(user.id)?.delete(targetId);
    friendsStore.get(targetId)?.delete(user.id);
    res.json({ success: true });
  });

  // ==========================================
  // WEBRTC CALL SIGNALING (VOICE & VIDEO)
  // ==========================================

  // POST /api/calls - Start call
  app.post('/api/calls', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { receiverId, callType } = req.body;
    const receiver = usersStore.get(receiverId);
    if (!receiver) return res.status(404).json({ error: 'User is not available' });

    const myBlocks = blocksStore.get(user.id) || new Set();
    const theirBlocks = blocksStore.get(receiverId) || new Set();
    if (myBlocks.has(receiverId) || theirBlocks.has(user.id)) {
      return res.status(403).json({ error: 'Calls not allowed with this user' });
    }

    const callId = 'call_' + crypto.randomBytes(8).toString('hex');
    const callData: StoredCall = {
      id: callId,
      callerId: user.id,
      receiverId,
      type: callType === 'voice' ? 'voice' : 'video',
      status: 'ringing',
      createdAt: new Date().toISOString(),
    };
    callsStore.set(callId, callData);

    // Notify receiver
    sendToUser(receiverId, 'call:incoming', {
      id: callId,
      caller: formatPublicProfile(user, receiver),
      callType: callData.type,
    });

    res.json({ success: true, call: callData });
  });

  // POST /api/calls/:id/respond
  app.post('/api/calls/:id/respond', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const call = callsStore.get(req.params.id);
    if (!call) return res.status(404).json({ error: 'Call not found' });

    const { accept } = req.body;
    call.status = accept ? 'connected' : 'rejected';

    const otherId = call.callerId === user.id ? call.receiverId : call.callerId;
    if (accept) {
      sendToUser(otherId, 'call:accepted', { callId: call.id });
    } else {
      sendToUser(otherId, 'call:rejected', { callId: call.id });
    }

    res.json({ success: true, status: call.status });
  });

  // POST /api/calls/:id/end
  app.post('/api/calls/:id/end', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const call = callsStore.get(req.params.id);
    if (call) {
      call.status = 'ended';
      const otherId = call.callerId === user.id ? call.receiverId : call.callerId;
      sendToUser(otherId, 'call:ended', { callId: call.id });
    }
    res.json({ success: true });
  });

  // POST /api/calls/:id/signal - WebRTC Offer/Answer/ICE relay
  app.post('/api/calls/:id/signal', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const call = callsStore.get(req.params.id);
    if (!call) return res.status(404).json({ error: 'Call not found' });

    const { signal } = req.body;
    const otherId = call.callerId === user.id ? call.receiverId : call.callerId;
    sendToUser(otherId, 'call:signal', { callId: call.id, signal });
    res.json({ success: true });
  });

  // ==========================================
  // ADMIN DASHBOARD & MODERATION
  // ==========================================

  // GET /api/admin/stats
  app.get('/api/admin/stats', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    // Allow admin access or demo preview access
    const allUsers = Array.from(usersStore.values());
    const registered = allUsers.filter((u) => !u.isGuest);
    const guests = allUsers.filter((u) => u.isGuest);
    const online = allUsers.filter((u) => u.status === 'online');
    const banned = allUsers.filter((u) => u.isBanned);

    let totalMsgs = 0;
    for (const msgs of messagesStore.values()) {
      totalMsgs += msgs.length;
    }

    res.json({
      stats: {
        totalRegisteredUsers: registered.length,
        activeGuests: guests.length,
        activeRegisteredUsers: registered.filter((u) => u.status !== 'offline').length,
        dailyActiveUsers: allUsers.length,
        onlineUsers: online.length,
        totalMessages: totalMsgs,
        totalConversations: conversationsStore.size,
        totalCalls: callsStore.size,
        pendingReports: Array.from(reportsStore.values()).filter((r) => r.status === 'pending').length,
        totalBans: banned.length,
      },
      reports: Array.from(reportsStore.values()),
      recentUsers: allUsers.slice(0, 15).map((u) => formatPublicProfile(u, user)),
      moderationHistory,
    });
  });

  // POST /api/admin/reports/:id/action
  app.post('/api/admin/reports/:id/action', (req: Request, res: Response) => {
    const { action, reason } = req.body;
    const report = reportsStore.get(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const targetUser = usersStore.get(report.reportedUserId);
    if (targetUser) {
      if (action === 'ban') {
        targetUser.isBanned = true;
        broadcastPresence(targetUser.id, 'offline');
      } else if (action === 'unban') {
        targetUser.isBanned = false;
      } else if (action === 'restrict') {
        targetUser.isRestricted = true;
      }
    }

    report.status = action === 'dismiss' ? 'dismissed' : 'resolved';

    moderationHistory.unshift({
      id: 'mod_' + Date.now(),
      action: action.toUpperCase(),
      targetUserId: report.reportedUserId,
      targetUserName: report.reportedUserName,
      reason: reason || `Action taken for ${report.category}`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, report });
  });

  // POST /api/admin/users/:id/ban
  app.post('/api/admin/users/:id/ban', (req: Request, res: Response) => {
    const targetUser = usersStore.get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const { ban } = req.body;
    targetUser.isBanned = Boolean(ban);
    if (targetUser.isBanned) {
      broadcastPresence(targetUser.id, 'offline');
    }

    moderationHistory.unshift({
      id: 'mod_' + Date.now(),
      action: ban ? 'BAN' : 'UNBAN',
      targetUserId: targetUser.id,
      targetUserName: targetUser.displayName,
      reason: 'Admin override action',
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, isBanned: targetUser.isBanned });
  });

  // ==========================================
  // DAILY MISSIONS & REWARDS API
  // ==========================================

  // GET /api/missions - Get today's missions and streak data
  app.get('/api/missions', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const missionsData = getOrCreateUserMissions(user.id);
    res.json(formatUserMissions(missionsData));
  });

  // POST /api/missions/checkin - Claim daily streak checkin
  app.post('/api/missions/checkin', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const data = getOrCreateUserMissions(user.id);
    const today = getTodayString();

    if (data.lastCheckInDate === today) {
      return res.status(400).json({ error: 'Already checked in today! Come back tomorrow.' });
    }

    data.lastCheckInDate = today;
    const checkinMission = data.missions.find((m) => m.id === 'daily_checkin');
    if (checkinMission) {
      checkinMission.currentCount = 1;
      checkinMission.completed = true;
      checkinMission.claimed = true;
    }

    // Award checkin bonus XP scaled with streak
    const bonusXp = 50 + Math.min(data.streakDays * 5, 50);
    const xpResult = awardUserXp(user.id, bonusXp);

    const formatted = formatUserMissions(data);
    sendToUser(user.id, 'missions:update', formatted);

    res.json({
      success: true,
      message: `Checked in! +${bonusXp} XP awarded for Day ${data.streakDays} streak!`,
      streakDays: data.streakDays,
      bonusXp,
      xpResult,
      missionsData: formatted,
    });
  });

  // POST /api/missions/:id/claim - Claim completed mission reward
  app.post('/api/missions/:id/claim', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const data = getOrCreateUserMissions(user.id);
    const mission = data.missions.find((m) => m.id === req.params.id);

    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    if (!mission.completed) {
      return res.status(400).json({ error: 'Mission requirements not completed yet' });
    }

    if (mission.claimed) {
      return res.status(400).json({ error: 'Mission reward already claimed today' });
    }

    mission.claimed = true;
    const xpResult = awardUserXp(user.id, mission.rewardXp);

    const formatted = formatUserMissions(data);
    sendToUser(user.id, 'missions:update', formatted);

    res.json({
      success: true,
      message: `Claimed +${mission.rewardXp} XP for ${mission.title}!`,
      mission,
      xpResult,
      missionsData: formatted,
    });
  });

  // POST /api/missions/claim-all-bonus - Claim Grand Chest bonus for finishing all missions
  app.post('/api/missions/claim-all-bonus', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const data = getOrCreateUserMissions(user.id);
    const allDone = data.missions.every((m) => m.claimed);

    if (!allDone) {
      return res.status(400).json({ error: 'Complete and claim all 6 daily missions first!' });
    }

    if (data.allClaimedBonusAwarded) {
      return res.status(400).json({ error: 'Grand Chest bonus already claimed today' });
    }

    data.allClaimedBonusAwarded = true;
    const bonusXp = data.totalBonusXp || 100;
    const xpResult = awardUserXp(user.id, bonusXp);

    const formatted = formatUserMissions(data);
    sendToUser(user.id, 'missions:update', formatted);

    res.json({
      success: true,
      message: `🌟 Grand Master Chest Unlocked! +${bonusXp} XP bonus awarded!`,
      bonusXp,
      xpResult,
      missionsData: formatted,
    });
  });

  // POST /api/user/wallpaper - Update wallpaper & record stylist mission
  app.post('/api/user/wallpaper', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (user) {
      recordMissionAction(user.id, 'change_wallpaper', 1);
    }
    res.json({ success: true });
  });

  // ==========================================
  // VITE DEV MIDDLEWARE / STATIC PRODUCTION
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Create HTTP Server & Attach WebSockets
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    // Parse cookies and token from request URL
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let token = url.searchParams.get('token');

    if (!token && req.headers.cookie) {
      const parsedCookies = req.headers.cookie.split(';').reduce((acc, c) => {
        const [k, v] = c.trim().split('=');
        if (k && v) acc[k] = decodeURIComponent(v);
        return acc;
      }, {} as Record<string, string>);
      token = parsedCookies.chatmitra_token;
    }

    let authenticatedUserId: string | null = null;
    if (token) {
      authenticatedUserId = tokenToUserId.get(token) || null;
    }

    if (authenticatedUserId) {
      let sockets = userSockets.get(authenticatedUserId);
      if (!sockets) {
        sockets = new Set();
        userSockets.set(authenticatedUserId, sockets);
      }
      sockets.add(ws);
      broadcastPresence(authenticatedUserId, 'online');
    }

    ws.on('message', (rawData) => {
      try {
        const data = JSON.parse(rawData.toString());

        // Dynamic authentication message
        if (data.type === 'auth:connect' && data.payload?.token) {
          const uId = tokenToUserId.get(data.payload.token);
          if (uId) {
            authenticatedUserId = uId;
            let sockets = userSockets.get(uId);
            if (!sockets) {
              sockets = new Set();
              userSockets.set(uId, sockets);
            }
            sockets.add(ws);
            broadcastPresence(uId, 'online');
          }
        }

        // Typing indicator relay
        if (data.type === 'chat:typing' || data.type === 'chat:stop_typing') {
          const { conversationId, toUserId } = data.payload || {};
          if (toUserId && authenticatedUserId) {
            sendToUser(toUserId, data.type, {
              conversationId,
              userId: authenticatedUserId,
            });
          }
        }
      } catch (err) {
        // Safe json parse error ignore
      }
    });

    ws.on('close', () => {
      if (authenticatedUserId) {
        const sockets = userSockets.get(authenticatedUserId);
        if (sockets) {
          sockets.delete(ws);
          if (sockets.size === 0) {
            userSockets.delete(authenticatedUserId);
            // Delay marking offline to handle momentary page reload/reconnect
            setTimeout(() => {
              if (!userSockets.has(authenticatedUserId!)) {
                broadcastPresence(authenticatedUserId!, 'offline');
              }
            }, 3000);
          }
        }
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ChatMitra backend server listening on http://0.0.0.0:${PORT}`);
  });
}

// Automatic conversational simulator for active stranger dialogue
function triggerStrangerResponse(conversationId: string, botUser: StoredUser, targetUser: StoredUser, incomingText: string) {
  setTimeout(() => {
    sendToUser(targetUser.id, 'chat:typing', {
      conversationId,
      userId: botUser.id,
    });
  }, 800);

  setTimeout(() => {
    sendToUser(targetUser.id, 'chat:stop_typing', {
      conversationId,
      userId: botUser.id,
    });

    const reply = generateSmartStrangerReply(botUser, targetUser, incomingText);
    const replyMsg: StoredMessage = {
      id: 'msg_bot_' + crypto.randomBytes(6).toString('hex'),
      conversationId,
      senderId: botUser.id,
      senderName: botUser.displayName,
      senderAvatar: botUser.avatar,
      text: reply,
      createdAt: new Date().toISOString(),
      read: false,
    };

    messagesStore.get(conversationId)?.push(replyMsg);
    sendToUser(targetUser.id, 'chat:message', replyMsg);
  }, 2400);
}

function generateSmartStrangerReply(bot: StoredUser, visitor: StoredUser, input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('namaste')) {
    return `Hey ${visitor.displayName}! Great to connect with you on ChatMitra. How is your day going in ${visitor.approximateLocation}?`;
  }
  if (lower.includes('how are you') || lower.includes('sup')) {
    return `Doing great! Just relaxing here in ${bot.approximateLocation}. ChatMitra makes meeting new people so seamless without login. What are your plans for today?`;
  }
  if (lower.includes('telugu') || lower.includes('hindi') || lower.includes('language')) {
    return `Yes! I speak ${bot.languages.join(' & ')}. It's awesome being able to filter chats by mother tongue here.`;
  }
  if (lower.includes('where') || lower.includes('place') || lower.includes('location')) {
    return `I'm currently around ${bot.approximateLocation}. The privacy feature keeping coordinates approximate is super neat. Whereabouts are you?`;
  }
  if (lower.includes('movie') || lower.includes('film') || lower.includes('cinema') || lower.includes('cricket') || lower.includes('music')) {
    return `Oh I love ${bot.interests.slice(0, 2).join(' and ')} too! Have you watched any good releases recently?`;
  }
  const generalReplies = [
    `That is so true! Chatting with strangers from different places always brings fresh perspectives.`,
    `Haha completely agree! Tell me more about what you enjoy doing in your free time.`,
    `Nice! ChatMitra is really fast and hassle-free. What other topics do you like discussing?`,
    `Awesome! Are you also interested in ${bot.interests[0] || 'tech & travel'}?`,
  ];
  return generalReplies[Math.floor(Math.random() * generalReplies.length)];
}

// Simulated active community responses in chatrooms
function triggerRoomBotReply(room: StoredRoom, senderUser: StoredUser, incomingText: string) {
  // Pick a seeded user who is not the sender
  const candidateBots = Array.from(usersStore.values()).filter(
    (u) => u.id !== senderUser.id && !u.isGuest && !u.isBanned
  );
  if (candidateBots.length === 0) return;

  const bot = candidateBots[Math.floor(Math.random() * candidateBots.length)];
  const botRankInfo = calculateUserRank(bot.xp || 0);

  setTimeout(() => {
    let replyText = '';
    const lower = incomingText.toLowerCase();

    if (room.id === 'room_hyderabad') {
      const hydReplies = [
        `Totally agree with you! Hyderabad evenings have the best vibe ☕✨`,
        `Haha 100%! Paradise or Bawarchi, the debate never ends 😄`,
        `Welcome to the Hyderabad room @${senderUser.displayName}! Great to have you here.`,
      ];
      replyText = hydReplies[Math.floor(Math.random() * hydReplies.length)];
    } else if (room.id === 'room_cricket') {
      const crickReplies = [
        `Spot on point! The match yesterday had crazy momentum swings 🏏🔥`,
        `Haha let's see how the bowling attack holds up in the final overs!`,
        `Great point @${senderUser.displayName}! Who are you rooting for?`,
      ];
      replyText = crickReplies[Math.floor(Math.random() * crickReplies.length)];
    } else if (room.id === 'room_dating' || room.id === 'room_confessions') {
      const socialReplies = [
        `Such a sweet perspective ✨ Kindness and good communication matter most!`,
        `Loved reading that @${senderUser.displayName}! Tell us more 😊`,
        `Late night chats on ChatMitra always hit differently 🌙✨`,
      ];
      replyText = socialReplies[Math.floor(Math.random() * socialReplies.length)];
    } else {
      const defaultRoomReplies = [
        `Hey @${senderUser.displayName}, great point! Welcome to #${room.name} 🚀`,
        `Glad to see lively discussion happening here today!`,
        `Haha very well said! Always nice meeting cool people here.`,
      ];
      replyText = defaultRoomReplies[Math.floor(Math.random() * defaultRoomReplies.length)];
    }

    const roomMsg: StoredRoomMessage = {
      id: 'rm_msg_bot_' + crypto.randomBytes(6).toString('hex'),
      roomId: room.id,
      senderId: bot.id,
      senderName: bot.displayName,
      senderAvatar: bot.avatar,
      senderGender: bot.gender,
      senderRank: botRankInfo.rank,
      senderStars: botRankInfo.stars,
      senderLevel: botRankInfo.level,
      text: replyText,
      createdAt: new Date().toISOString(),
    };

    let msgs = roomMessagesStore.get(room.id);
    if (!msgs) {
      msgs = [];
      roomMessagesStore.set(room.id, msgs);
    }
    msgs.push(roomMsg);
    broadcastToAll('room:message', roomMsg);
  }, 2200);
}

startServer().catch((err) => {
  console.error('Failed to start ChatMitra server:', err);
  process.exit(1);
});
