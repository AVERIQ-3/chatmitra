import React, { useState, useRef } from 'react';
import { Search, X, Sparkles, Flame, Upload, HardDrive, Smartphone } from 'lucide-react';

export interface GifItem {
  id: string;
  title: string;
  url: string;
  category: string;
}

const CURATED_GIFS: GifItem[] = [
  // Trending & Reactions
  {
    id: 'g1',
    title: 'Namaste / Greeting',
    category: 'Greetings',
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  },
  {
    id: 'g2',
    title: 'Happy Dance',
    category: 'Trending',
    url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif',
  },
  {
    id: 'g3',
    title: 'Thumbs Up Cool',
    category: 'Reactions',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
  },
  {
    id: 'g4',
    title: 'Cinema Celebration',
    category: 'Cinema',
    url: 'https://media.giphy.com/media/3o7bu3XilJ5BOiSGic/giphy.gif',
  },
  {
    id: 'g5',
    title: 'Laughing Out Loud',
    category: 'Funny',
    url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif',
  },
  {
    id: 'g6',
    title: 'Mind Blown',
    category: 'Reactions',
    url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
  },
  {
    id: 'g7',
    title: 'Love & Heart',
    category: 'Love',
    url: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif',
  },
  {
    id: 'g8',
    title: 'Clapping Applause',
    category: 'Reactions',
    url: 'https://media.giphy.com/media/fnK0jeA8vIh2QLq3IZ/giphy.gif',
  },
  {
    id: 'g9',
    title: 'Cricket Cheer / Six',
    category: 'Trending',
    url: 'https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif',
  },
  {
    id: 'g10',
    title: 'Shocked / Omg',
    category: 'Reactions',
    url: 'https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif',
  },
  {
    id: 'g11',
    title: 'Party Vibes',
    category: 'Trending',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
  },
  {
    id: 'g12',
    title: 'Coffee Cheers',
    category: 'Greetings',
    url: 'https://media.giphy.com/media/3oriO04qxVReM5rJEA/giphy.gif',
  },
  {
    id: 'g13',
    title: 'Dancing Bollywood',
    category: 'Cinema',
    url: 'https://media.giphy.com/media/3ohfFqGOeHQC280PMk/giphy.gif',
  },
  {
    id: 'g14',
    title: 'Blowing Kiss / Love',
    category: 'Love',
    url: 'https://media.giphy.com/media/l4pTdcifPZLpDjL1e/giphy.gif',
  },
  {
    id: 'g15',
    title: 'Waving Hi Friend',
    category: 'Greetings',
    url: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif',
  },
  {
    id: 'g16',
    title: 'Cool Sunglasses',
    category: 'Reactions',
    url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
  },
];

interface GifPickerProps {
  onSelectGif: (url: string) => void;
  onClose: () => void;
}

export const GifPicker: React.FC<GifPickerProps> = ({ onSelectGif, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const localGifInputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', 'Trending', 'Reactions', 'Greetings', 'Cinema', 'Funny', 'Love'];

  const filteredGifs = CURATED_GIFS.filter((gif) => {
    const matchesCategory = selectedCategory === 'All' || gif.category === selectedCategory;
    const matchesSearch =
      gif.title.toLowerCase().includes(search.toLowerCase()) ||
      gif.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && (search === '' || matchesSearch);
  });

  const handleLocalGifUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('gif') && !file.type.startsWith('image/')) {
      setUploadError('Please select a GIF or image file from your device.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('GIF file size should be under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSelectGif(reader.result);
      }
    };
    reader.onerror = () => {
      setUploadError('Could not load local GIF.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="bg-[#14152c] border border-indigo-950 rounded-2xl shadow-2xl p-4 w-full max-w-sm sm:max-w-md animate-fade-in z-30 space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-indigo-950/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
            <Flame className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-xs text-white">GIFs &amp; Stickers</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Stored GIF from Device (PC/Mobile) Banner */}
      <input
        type="file"
        ref={localGifInputRef}
        onChange={handleLocalGifUpload}
        accept="image/gif,image/*"
        className="hidden"
      />
      <div className="p-2.5 rounded-xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-slate-900/60 border border-pink-900/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="p-1.5 rounded-lg bg-pink-600/20 text-pink-300">
            <Upload className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="font-bold text-slate-200 text-[11px]">Load GIF from PC or Phone</p>
            <p className="text-[10px] text-slate-400">Send animated GIFs stored on your device</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => localGifInputRef.current?.click()}
          className="px-2.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-[11px] shadow-sm shadow-pink-600/30 flex items-center gap-1 transition-all shrink-0 active:scale-95"
        >
          <Upload className="w-3 h-3" />
          <span>Upload GIF</span>
        </button>
      </div>

      {uploadError && (
        <p className="text-rose-400 text-[11px] px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
          {uploadError}
        </p>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search trending GIFs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-indigo-950 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500"
        />
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all ${
              selectedCategory === cat
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* GIF Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
        {filteredGifs.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-slate-400">
            No GIFs found. Try another search or upload a local GIF above!
          </div>
        ) : (
          filteredGifs.map((gif) => (
            <button
              key={gif.id}
              onClick={() => onSelectGif(gif.url)}
              className="relative aspect-video rounded-xl overflow-hidden group bg-slate-950 border border-indigo-950/60 hover:border-pink-500 focus:outline-none transition-all"
            >
              <img
                src={gif.url}
                alt={gif.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                <span className="text-[10px] text-white font-medium truncate drop-shadow">
                  {gif.title}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

