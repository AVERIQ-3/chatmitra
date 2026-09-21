import React, { useState } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { CHAT_WALLPAPERS, getWallpaperById } from '../utils/wallpaperPresets.ts';
import {
  X,
  Palette,
  Check,
  Sparkles,
  Upload,
  Link,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';

export const WallpaperSelector: React.FC = () => {
  const {
    isWallpaperModalOpen,
    setIsWallpaperModalOpen,
    selectedWallpaper,
    setSelectedWallpaper,
  } = useChat();

  const [customUrlInput, setCustomUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [customError, setCustomError] = useState('');

  if (!isWallpaperModalOpen) return null;

  const currentWp = getWallpaperById(selectedWallpaper);

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    const url = customUrlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image')) {
      setCustomError('Please enter a valid HTTP/HTTPS image URL');
      return;
    }
    setCustomError('');
    setSelectedWallpaper(`custom:${url}`);
    setCustomUrlInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCustomError('Please upload an image file (PNG, JPG, WebP, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCustomError('Image size should be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSelectedWallpaper(`custom:${dataUrl}`);
        setCustomError('');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#11122a] border border-indigo-900/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-violet-900/80 via-indigo-900/70 to-purple-950/80 border-b border-indigo-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Chat Wallpapers</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Themes &amp; Backgrounds
                </span>
              </h2>
              <p className="text-xs text-indigo-200/80">
                Personalize your 1-on-1 chats and community chatroom backdrops
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWallpaperModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Presets vs Custom Wallpaper */}
        <div className="px-5 pt-3 pb-0 bg-[#141530] border-b border-indigo-950 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'presets'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Preset Themes ({CHAT_WALLPAPERS.length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'border-pink-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Custom Image / URL</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {CHAT_WALLPAPERS.map((wp) => {
                const isSelected = selectedWallpaper === wp.id;

                return (
                  <button
                    key={wp.id}
                    onClick={() => {
                      setSelectedWallpaper(wp.id);
                    }}
                    className={`relative group flex flex-col items-start p-2.5 rounded-xl border text-left transition-all overflow-hidden ${
                      isSelected
                        ? 'border-violet-400 ring-2 ring-violet-500/50 shadow-lg shadow-violet-900/50 bg-slate-900/90 scale-[1.01]'
                        : 'border-indigo-950 hover:border-indigo-700 bg-slate-900/40 hover:bg-slate-900/70'
                    }`}
                  >
                    {/* Wallpaper Preview Box */}
                    <div
                      className={`w-full h-24 rounded-lg ${wp.backgroundClass} border border-white/10 flex flex-col justify-between p-2.5 shadow-inner transition-transform group-hover:scale-[1.02]`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/60 text-white/90 backdrop-blur-sm font-semibold">
                          Preview
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      {/* Mini simulated chat bubbles */}
                      <div className="space-y-1.5">
                        <div className="w-20 h-2 rounded-full bg-white/25"></div>
                        <div className="w-14 h-2 rounded-full bg-violet-500/70 ml-auto"></div>
                      </div>
                    </div>

                    {/* Title & info */}
                    <div className="mt-2.5 w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white truncate">
                          {wp.name}
                        </span>
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: wp.previewColor }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {wp.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upload or Link Area */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-950 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Upload className="w-4 h-4 text-violet-400" />
                  <span>Upload Wallpaper Image From Device</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Upload any wallpaper or photo (JPG, PNG, GIF, WebP). Saved locally on your browser.
                </p>

                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-indigo-800 hover:border-violet-500 bg-indigo-950/30 hover:bg-violet-950/20 cursor-pointer transition-colors text-xs font-semibold text-slate-300 hover:text-white">
                  <ImageIcon className="w-4 h-4 text-pink-400" />
                  <span>Choose Wallpaper Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Paste URL */}
              <form
                onSubmit={handleCustomUrlSubmit}
                className="p-4 rounded-xl bg-slate-900/60 border border-indigo-950 space-y-3"
              >
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Link className="w-4 h-4 text-pink-400" />
                  <span>Or Enter Image URL</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/wallpaper.jpg"
                    className="flex-1 bg-[#141530] border border-indigo-900 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-colors"
                  >
                    Set URL
                  </button>
                </div>
                {customError && (
                  <p className="text-[11px] text-rose-400 font-medium">{customError}</p>
                )}
              </form>

              {/* Reset to Default Option */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40">
                <span className="text-xs text-slate-300">Reset to classic default</span>
                <button
                  type="button"
                  onClick={() => setSelectedWallpaper('classic-dark-doodle')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>
          )}

          {/* Current Active Wallpaper Banner */}
          <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg border border-white/20 shadow-inner flex items-center justify-center text-xs"
                style={{
                  backgroundImage: currentWp?.imageUrl ? `url(${currentWp.imageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!currentWp?.imageUrl && <Palette className="w-4 h-4 text-violet-300" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Active: {currentWp.name}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Applied to all private conversations and public lounges
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0d0e22] border-t border-indigo-900/40 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant sync across all rooms &amp; chats</span>
          </span>
          <button
            onClick={() => setIsWallpaperModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
