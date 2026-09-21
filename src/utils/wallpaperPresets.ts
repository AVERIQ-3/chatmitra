import { ChatWallpaper } from '../types.ts';

export const CHAT_WALLPAPERS: ChatWallpaper[] = [
  {
    id: 'classic-dark-doodle',
    name: 'Classic Dark Doodle',
    description: 'Signature dark doodle wallpaper with messaging icons & subtle vectors',
    previewColor: 'bg-indigo-600',
    backgroundClass:
      'bg-[#0f1124] bg-[radial-gradient(#6366f125_1px,transparent_1px),radial-gradient(#a855f720_1px,#0f1124_1px)] [background-size:24px_24px] text-slate-100',
    patternStyle: 'radial-gradient(#6366f125 1px, transparent 1px)',
    textColor: 'text-indigo-100',
  },
  {
    id: 'neon-mesh',
    name: 'Neon Mesh Glow',
    description: 'Vibrant dusk glow with purple and violet ambient mesh',
    previewColor: 'bg-fuchsia-600',
    backgroundClass:
      'bg-gradient-to-br from-[#12072b] via-[#1a0c3b] to-[#0a051d] text-slate-100',
    textColor: 'text-fuchsia-100',
  },
  {
    id: 'midnight-charcoal',
    name: 'Midnight Charcoal',
    description: 'Subtle crosshatch pattern for comfortable long-night conversations',
    previewColor: 'bg-slate-800',
    backgroundClass:
      'bg-[#0b0c16] bg-[linear-gradient(to_right,#1e293b22_1px,transparent_1px),linear-gradient(to_bottom,#1e293b22_1px,transparent_1px)] [background-size:20px_20px] text-slate-100',
    textColor: 'text-slate-100',
  },
  {
    id: 'classic-cyan',
    name: 'Classic Cyan',
    description: 'Iconic sky-blue geometric pattern with high contrast',
    previewColor: 'bg-sky-500',
    backgroundClass:
      'bg-[#0a2342] bg-[radial-gradient(#00d2ff_1.2px,transparent_1.2px)] [background-size:18px_18px] text-slate-100',
    patternStyle: 'radial-gradient(#38bdf8 1px, transparent 1px)',
    textColor: 'text-sky-100',
  },
  {
    id: 'midnight-navy',
    name: 'Midnight Navy',
    description: 'Deep navy chatroom night aesthetic',
    previewColor: 'bg-blue-900',
    backgroundClass:
      'bg-[#091026] bg-[linear-gradient(to_right,#1e293b25_1px,transparent_1px),linear-gradient(to_bottom,#1e293b25_1px,transparent_1px)] [background-size:24px_24px] text-slate-100',
    patternStyle: 'linear-gradient(to right, #1e293b 1px, transparent 1px)',
    textColor: 'text-slate-100',
  },
  {
    id: 'retro-java-grid',
    name: 'Retro Java',
    description: 'Nostalgic cyan dots grid',
    previewColor: 'bg-cyan-600',
    backgroundClass:
      'bg-[#061826] bg-[radial-gradient(#06b6d4_1.5px,transparent_1.5px)] [background-size:20px_20px] text-slate-100',
    patternStyle: 'radial-gradient(#06b6d4 1.5px, transparent 1.5px)',
    textColor: 'text-cyan-100',
  },
  {
    id: 'sunset-purple',
    name: 'Sunset Magenta',
    description: 'Rich dusk ambience with warm violet shades',
    previewColor: 'bg-purple-600',
    backgroundClass:
      'bg-gradient-to-b from-[#180933] via-[#220e44] to-[#0e051c] text-slate-100',
    textColor: 'text-purple-100',
  },
  {
    id: 'emerald-glow',
    name: 'Emerald Matrix',
    description: 'Deep forest and jade digital tone',
    previewColor: 'bg-emerald-600',
    backgroundClass:
      'bg-[#051a14] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] text-slate-100',
    patternStyle: 'radial-gradient(#10b981 1px, transparent 1px)',
    textColor: 'text-emerald-100',
  },
  {
    id: 'cyberpunk-city',
    name: 'Cyberpunk Skyline',
    description: 'Futuristic neon synthwave gradient',
    previewColor: 'bg-rose-600',
    backgroundClass:
      'bg-gradient-to-br from-[#1a0a2a] via-[#100926] to-[#08182b] text-slate-100',
    textColor: 'text-rose-100',
  },
  {
    id: 'dark-obsidian',
    name: 'Dark Obsidian',
    description: 'Ultra clean stealth minimalist theme',
    previewColor: 'bg-slate-900',
    backgroundClass: 'bg-[#090a12] text-slate-100',
    textColor: 'text-slate-100',
  },
];

export function getWallpaperById(id?: string): ChatWallpaper {
  if (!id) return CHAT_WALLPAPERS[0];
  
  // Check if it's a custom image URL
  if (id.startsWith('custom:') || id.startsWith('http://') || id.startsWith('https://') || id.startsWith('data:image')) {
    const rawUrl = id.startsWith('custom:') ? id.replace('custom:', '') : id;
    return {
      id,
      name: 'Custom User Wallpaper',
      description: 'Personalized custom uploaded / linked chat background',
      previewColor: 'bg-violet-600',
      backgroundClass: 'bg-cover bg-center bg-no-repeat text-slate-100',
      imageUrl: rawUrl,
      textColor: 'text-slate-100',
    };
  }

  const found = CHAT_WALLPAPERS.find((w) => w.id === id);
  return found || CHAT_WALLPAPERS[0];
}
