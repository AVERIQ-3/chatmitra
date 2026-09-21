import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { AdminDashboardData, ReportItem, UserProfile } from '../types.ts';
import {
  Lock,
  Users,
  ShieldAlert,
  Ban,
  CheckCircle2,
  XCircle,
  Activity,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { token } = useChat();

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'history'>('reports');
  const [searchUser, setSearchUser] = useState('');

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleReportAction = async (reportId: string, action: 'ban' | 'restrict' | 'dismiss' | 'resolve') => {
    try {
      await fetch(`/api/admin/reports/${reportId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action, reason: `Action taken by admin: ${action}` }),
      });
      fetchStats();
    } catch (e) {}
  };

  const handleToggleBan = async (userId: string, currentBan: boolean) => {
    try {
      await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ban: !currentBan }),
      });
      fetchStats();
    } catch (e) {}
  };

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-violet-400" />
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  const { stats, reports, recentUsers, moderationHistory } = data;

  const filteredUsers = (recentUsers || []).filter((u) =>
    u.displayName.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.approximateLocation.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fade-in space-y-6">
      {/* Header */}
      <div className="bg-[#14152b] border border-indigo-950 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-white">Live Admin &amp; Moderation Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time platform metrics, user moderation, report resolutions, and security controls.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-950 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#14152b] border border-indigo-950 p-4 rounded-2xl shadow">
          <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-violet-400" />
            Total Users
          </div>
          <div className="text-2xl font-black text-white">{stats.dailyActiveUsers}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{stats.activeGuests} active guests</div>
        </div>

        <div className="bg-[#14152b] border border-indigo-950 p-4 rounded-2xl shadow">
          <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Online Now
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.onlineUsers}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Live WebSocket sessions</div>
        </div>

        <div className="bg-[#14152b] border border-indigo-950 p-4 rounded-2xl shadow">
          <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            Messages Sent
          </div>
          <div className="text-2xl font-black text-white">{stats.totalMessages}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{stats.totalConversations} active rooms</div>
        </div>

        <div className="bg-[#14152b] border border-indigo-950 p-4 rounded-2xl shadow">
          <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-pink-400" />
            Calls Initiated
          </div>
          <div className="text-2xl font-black text-white">{stats.totalCalls}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Voice &amp; video streams</div>
        </div>

        <div className="bg-[#14152b] border border-indigo-950 p-4 rounded-2xl shadow">
          <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Pending Reports
          </div>
          <div className="text-2xl font-black text-amber-400">{stats.pendingReports}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Requires review</div>
        </div>

        <div className="bg-[#14152b] border border-indigo-950 p-4 rounded-2xl shadow">
          <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
            <Ban className="w-3.5 h-3.5 text-rose-400" />
            Total Banned
          </div>
          <div className="text-2xl font-black text-rose-400">{stats.totalBans}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Enforced bans</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-indigo-950/80 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'reports'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Reports Queue ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'users'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          User Management ({recentUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'history'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Audit Log ({moderationHistory.length})
        </button>
      </div>

      {/* Tab 1: Reports Queue */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="text-center py-12 bg-[#14152b]/60 border border-indigo-950 rounded-2xl text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-white">All Clear!</p>
              <p>No pending reports in the moderation queue.</p>
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-[#14152b] border border-indigo-950 p-4 rounded-2xl shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                      {rep.category}
                    </span>
                    <span className="text-slate-300">
                      Target User: <strong className="text-white">{rep.reportedUserName}</strong>
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(rep.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {rep.description && (
                    <p className="text-slate-400 italic">&ldquo;{rep.description}&rdquo;</p>
                  )}
                  <div className="text-[10px] text-slate-500">Status: {rep.status}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReportAction(rep.id, 'ban')}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md"
                  >
                    Ban User
                  </button>
                  <button
                    onClick={() => handleReportAction(rep.id, 'restrict')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all"
                  >
                    Restrict
                  </button>
                  <button
                    onClick={() => handleReportAction(rep.id, 'dismiss')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: User Management */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users by name or location..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-indigo-950 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          <div className="bg-[#14152b] border border-indigo-950 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left divide-y divide-indigo-950">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Gender / Language</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-950/40">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 flex items-center gap-2">
                      <img
                        src={u.avatar}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-purple-500/40"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-bold text-white">{u.displayName}</div>
                        <div className="text-[10px] text-slate-500">
                          {u.isGuest ? 'Guest' : `@${u.username}`}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">
                      {u.gender} &bull; {u.language}
                    </td>
                    <td className="p-3 text-slate-400">{u.approximateLocation}</td>
                    <td className="p-3">
                      {u.isBanned ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                          BANNED
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${
                            u.status === 'online'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {u.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleBan(u.id, !!u.isBanned)}
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${
                          u.isBanned
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-rose-600/80 hover:bg-rose-600 text-white'
                        }`}
                      >
                        {u.isBanned ? 'Unban' : 'Ban User'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Moderation Audit Log */}
      {activeTab === 'history' && (
        <div className="bg-[#14152b] border border-indigo-950 rounded-2xl p-4 shadow space-y-3 text-xs">
          {moderationHistory.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-slate-900/60 border border-indigo-950 flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-purple-300">{item.action}</span> on{' '}
                <strong className="text-white">{item.targetUserName}</strong>: {item.reason}
              </div>
              <div className="text-[10px] text-slate-500">
                {new Date(item.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
