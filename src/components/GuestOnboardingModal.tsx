import React, { useState, useRef } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import {
  Sparkles,
  MapPin,
  Globe2,
  Users2,
  ShieldCheck,
  ArrowRight,
  Smile,
  Zap,
  Upload,
  Camera,
  UserMinus,
  AlertCircle,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../server/data.ts';

const POPULAR_LOCATIONS = [
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

const ONBOARDING_AVATARS_MALE = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
];

const ONBOARDING_AVATARS_FEMALE = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

export const GuestOnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, loginAsGuest } = useChat();

  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [language, setLanguage] = useState('Telugu');
  const [approximateLocation, setApproximateLocation] = useState('Hyderabad area');
  const [avatar, setAvatar] = useState<string>(ONBOARDING_AVATARS_MALE[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOnboardingOpen) return null;

  const handleGenderChange = (newGender: 'Male' | 'Female') => {
    setGender(newGender);
    setAvatar(newGender === 'Female' ? ONBOARDING_AVATARS_FEMALE[0] : ONBOARDING_AVATARS_MALE[0]);
  };

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
      setUploadError('Failed to read image.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar(gender === 'Female' ? ONBOARDING_AVATARS_FEMALE[0] : ONBOARDING_AVATARS_MALE[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await loginAsGuest({
      displayName: displayName.trim() || undefined,
      gender,
      language,
      approximateLocation,
      avatar,
    });
    setIsSubmitting(false);
  };

  const handleQuickJoin = async () => {
    setIsSubmitting(true);
    await loginAsGuest({
      gender,
      language,
      approximateLocation,
      avatar,
    });
    setIsSubmitting(false);
  };

  const currentPresets = gender === 'Female' ? ONBOARDING_AVATARS_FEMALE : ONBOARDING_AVATARS_MALE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#15172e] border border-indigo-900/60 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-b from-violet-600/30 via-pink-500/20 to-transparent blur-2xl pointer-events-none" />

        <div className="relative z-10 text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            No Email &bull; No Password &bull; Instant Access
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-pink-400">ChatMitra</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Connect and chat with people around you. Choose your preferences to get matched right away.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Profile Photo: Upload / Preset / Remove */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-950 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-pink-400" />
                Profile Picture
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-0.8 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-[11px] font-semibold flex items-center gap-1 transition-all"
                >
                  <Upload className="w-3 h-3" />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="px-2 py-0.8 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all"
                >
                  <UserMinus className="w-3 h-3" />
                  Remove
                </button>
              </div>
            </div>

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

            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt="Selected Avatar"
                className="w-13 h-13 rounded-2xl object-cover ring-2 ring-purple-500/40 shadow"
                referrerPolicy="no-referrer"
              />
              <div className="flex items-center gap-2 overflow-x-auto">
                {currentPresets.map((preset, idx) => (
                  <img
                    key={idx}
                    src={preset}
                    alt="Preset"
                    onClick={() => setAvatar(preset)}
                    className={`w-9 h-9 rounded-xl object-cover cursor-pointer ring-2 transition-all ${
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

          {/* Display Name (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-violet-400" />
              Nickname / Display Name <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. FriendlyStranger, Rahul, Ananya..."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={25}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-indigo-950 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-white placeholder-slate-500 text-sm outline-none transition-all"
            />
          </div>

          {/* Gender Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users2 className="w-4 h-4 text-pink-400" />
              Your Gender
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleGenderChange('Male')}
                className={`py-2.5 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  gender === 'Male'
                    ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10'
                    : 'bg-slate-900/60 border-indigo-950 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>👦</span> Male
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange('Female')}
                className={`py-2.5 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  gender === 'Female'
                    ? 'bg-gradient-to-r from-pink-600/30 to-rose-600/30 border-pink-500 text-pink-300 shadow-md shadow-pink-500/10'
                    : 'bg-slate-900/60 border-indigo-950 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>👧</span> Female
              </button>
            </div>
          </div>

          {/* Primary Language */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-emerald-400" />
              Preferred Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-indigo-950 focus:border-violet-500 text-white text-sm outline-none transition-all cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang} className="bg-slate-900 text-white">
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Location Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                Approximate Region / City
              </span>
              <span className="text-[11px] text-slate-500 font-normal">Exact GPS is never shared</span>
            </label>
            <select
              value={approximateLocation}
              onChange={(e) => setApproximateLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-indigo-950 focus:border-violet-500 text-white text-sm outline-none transition-all cursor-pointer"
            >
              {POPULAR_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} className="bg-slate-900 text-white">
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy & Safety Guarantee */}
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/40 flex items-start gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              ChatMitra is anonymous &amp; safe. We never sell data. You can disconnect or block anyone at any moment.
            </span>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Joining ChatMitra...</span>
              ) : (
                <>
                  <span>Start Chatting Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleQuickJoin}
              disabled={isSubmitting}
              className="w-full py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/40 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Quick 1-Click Guest Join
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
