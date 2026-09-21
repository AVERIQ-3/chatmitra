import React from 'react';
import { useChat } from '../context/ChatContext.tsx';
import {
  X,
  ShieldCheck,
  Lock,
  EyeOff,
  AlertTriangle,
  UserX,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';

export const SafetyGuidelinesModal: React.FC = () => {
  const { isSafetyOpen, setIsSafetyOpen } = useChat();

  if (!isSafetyOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#14152b] border border-indigo-950 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[85vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setIsSafetyOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">ChatMitra Safety &amp; Privacy Rules</h2>
            <p className="text-xs text-slate-400">Our guidelines to ensure safe, respectful encounters.</p>
          </div>
        </div>

        {/* Safety Cards */}
        <div className="space-y-3.5 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-950 flex items-start gap-3">
            <EyeOff className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-100 mb-0.5">Approximate Location Only</h4>
              <p className="text-slate-400 leading-relaxed">
                ChatMitra never broadcasts your exact GPS coordinates. Only a broad city or neighborhood label is shown.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-950 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-100 mb-0.5">Never Share Sensitive Information</h4>
              <p className="text-slate-400 leading-relaxed">
                Do not share bank account details, UPI PINs, OTPs, phone numbers, or passwords with anyone on the platform.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-950 flex items-start gap-3">
            <UserX className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-100 mb-0.5">Zero Tolerance for Abuse &amp; Harassment</h4>
              <p className="text-slate-400 leading-relaxed">
                Hate speech, unsolicited explicit content, and blackmail will result in permanent hardware/IP bans.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-950 flex items-start gap-3">
            <HeartHandshake className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-100 mb-0.5">Instant Block &amp; Skip Controls</h4>
              <p className="text-slate-400 leading-relaxed">
                You can disconnect immediately, skip to the next person, or block and report any profile with a single click.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-indigo-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">ChatMitra &bull; Safe Community Protocol</span>
          <button
            onClick={() => setIsSafetyOpen(false)}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
