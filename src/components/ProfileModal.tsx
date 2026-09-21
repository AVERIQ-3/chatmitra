import React, { useState, useRef } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import {
  X,
  User,
  MapPin,
  Globe,
  Sparkles,
  LogOut,
  Trash2,
  Check,
  Upload,
  Image as ImageIcon,
  UserMinus,
  Camera,
  AlertCircle,
  Trophy,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../server/data.ts';
import { RankBadge } from './RankBadge.tsx';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

const LOCATIONS = [
  'Hyderabad area',
  'Guntur area',
  'Vijayawada area',
  'Visakhapatnam area',
  'Bengaluru area',
  'Chennai area',
  'Mumbai area',
  'Delhi NCR',
  'Pune area',
  'Kolkata area',
];

export const ProfileModal: React.FC = () => {
  const {
    currentUser,
    isProfileOpen,
    setIsProfileOpen,
    updateProfile,
    setIsAuthModalOpen,
    logout,
    deleteAccount,
    setIsRankProgressOpen,
  } = useChat();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || DEFAULT_AVATAR);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [language, setLanguage] = useState(currentUser?.language || 'Telugu');
  const [approximateLocation, setApproximateLocation] = useState(
    currentUser?.approximateLocation || 'Hyderabad area'
  );
  const [interestsText, setInterestsText] = useState(
    currentUser?.interests?.join(', ') || ''
  );
  const [status, setStatus] = useState<'online' | 'away' | 'offline'>(
    currentUser?.status || 'online'
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isProfileOpen || !currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, GIF, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    // Reverts to a clean default avatar
    const defaultPlaceholder =
      currentUser.gender === 'Female'
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    setAvatar(defaultPlaceholder);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const interests = interestsText
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    const success = await updateProfile({
      displayName: displayName.trim() || currentUser.displayName,
      avatar,
      bio: bio.trim(),
      language,
      approximateLocation,
      interests,
      status,
    });

    setIsSaving(false);
    if (success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#14152b] border border-indigo-950 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-indigo-950/80">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-violet-400" />
            <h2 className="font-extrabold text-lg text-white">Your Profile &amp; Settings</h2>
          </div>
          <button
            onClick={() => setIsProfileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Status Card */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-indigo-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-violet-600/20 text-violet-300 flex items-center justify-center font-bold text-xs border border-violet-500/30">
              {currentUser.isGuest ? 'GST' : 'PRO'}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                <span>{currentUser.displayName}</span>
                <RankBadge
                  rank={currentUser.rank || 'Novice'}
                  stars={currentUser.stars || '★'}
                  level={currentUser.level || 1}
                  size="xs"
                />
              </div>
              <div className="text-[10px] text-slate-400">
                {currentUser.isGuest
                  ? 'Data stored locally on this browser'
                  : `Username: @${currentUser.username}`}
              </div>
            </div>
          </div>

          {currentUser.isGuest && (
            <button
              onClick={() => {
                setIsProfileOpen(false);
                setIsAuthModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-xs shadow-md shadow-violet-600/20 hover:opacity-90 transition-all"
            >
              Save Account
            </button>
          )}
        </div>

        {/* Star Rank & XP Meter */}
        <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-violet-950/40 via-indigo-950/40 to-slate-900 border border-indigo-900/40 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
              <Trophy className="w-3.5 h-3.5" />
              <span>Star Rank: {currentUser.rank || 'Novice'} ({currentUser.stars || '★'})</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Level {currentUser.level || 1} &bull; <strong className="text-violet-300 font-mono">{(currentUser.xp || 0).toLocaleString()} XP</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(false);
              setIsRankProgressOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all"
          >
            Rank Ladder
          </button>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
          {/* Profile Picture Management: Upload / Preset / Remove */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-indigo-950 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200">Profile Picture</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Upload className="w-3 h-3" />
                  Upload Photo
                </button>

                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all"
                >
                  <UserMinus className="w-3 h-3" />
                  Remove Pic
                </button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {uploadError && (
              <p className="text-rose-400 text-[11px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {uploadError}
              </p>
            )}

            {/* Current Avatar & Presets Grid */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={avatar}
                  alt="Current Avatar"
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-purple-500/40 shadow-xl"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1 rounded-full bg-violet-600 text-white shadow-md hover:bg-violet-500"
                  title="Change photo"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                  Or pick a preset avatar:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <img
                      key={idx}
                      src={preset}
                      alt="Preset"
                      onClick={() => setAvatar(preset)}
                      className={`w-10 h-10 rounded-xl object-cover cursor-pointer ring-2 transition-all shrink-0 ${
                        avatar === preset
                          ? 'ring-violet-500 scale-105 shadow-md shadow-violet-500/30'
                          : 'ring-transparent opacity-60 hover:opacity-100'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Nickname & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={30}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-950 text-white outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Activity Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-950 text-white outline-none focus:border-violet-500"
              >
                <option value="online">🟢 Online</option>
                <option value="away">🟡 Away</option>
                <option value="offline">⚪ Invisible</option>
              </select>
            </div>
          </div>

          {/* Language & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Primary Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-950 text-white outline-none focus:border-violet-500"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">City / Region</label>
              <select
                value={approximateLocation}
                onChange={(e) => setApproximateLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-950 text-white outline-none focus:border-violet-500"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Bio / Status Message</label>
            <input
              type="text"
              placeholder="e.g. Cinema enthusiast, open to polite conversations..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-950 text-white placeholder-slate-500 outline-none focus:border-violet-500"
            />
          </div>

          {/* Interests */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Interests (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Cricket, Movies, Tech, Travel..."
              value={interestsText}
              onChange={(e) => setInterestsText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-950 text-white placeholder-slate-500 outline-none focus:border-violet-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Changes Saved!</span>
              </>
            ) : isSaving ? (
              <span>Saving...</span>
            ) : (
              <span>Save Profile Changes</span>
            )}
          </button>
        </form>

        {/* Danger Zone: Reset or Logout */}
        <div className="mt-6 pt-4 border-t border-indigo-950/80 flex items-center justify-between text-xs">
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>

          <button
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to delete your profile and clear all session data?'
                )
              ) {
                deleteAccount();
              }
            }}
            className="px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Account / Reset
          </button>
        </div>
      </div>
    </div>
  );
};
