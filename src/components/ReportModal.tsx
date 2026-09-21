import React, { useState } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Check,
  Send,
} from 'lucide-react';

const REPORT_CATEGORIES = [
  'Harassment or Hate Speech',
  'Inappropriate or Sexual Content',
  'Spam or Advertising',
  'Scam / Fraud Request',
  'Impersonation or Fake Account',
  'Threats or Dangerous Behavior',
  'Other',
];

export const ReportModal: React.FC = () => {
  const { reportingUser, setReportingUser, submitReport, blockUser } = useChat();

  const [category, setCategory] = useState(REPORT_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!reportingUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await submitReport(reportingUser.id, category, description);
    if (alsoBlock) {
      await blockUser(reportingUser.id);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setReportingUser(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#14152b] border border-rose-950/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close */}
        <button
          onClick={() => setReportingUser(null)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-white">
              Report {reportingUser.displayName}
            </h2>
            <p className="text-[11px] text-slate-400">
              Help keep ChatMitra safe and friendly for everyone.
            </p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-white">Report Received</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Our automated moderation system and admins will review this report promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Reason for Reporting
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-950 text-white text-xs outline-none focus:border-rose-500"
              >
                {REPORT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Describe what occurred..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={400}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-950 text-white placeholder-slate-500 text-xs outline-none focus:border-rose-500"
              />
            </div>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="w-4 h-4 rounded border-indigo-950 text-rose-600 focus:ring-rose-500 bg-slate-900"
              />
              <span>Also block this user from contacting or matching with me</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {isSubmitting ? <span>Submitting...</span> : <span>Submit Report</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
