import React, { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import {
  Cpu,
  MemoryStick,
  Activity,
  Server,
  Wifi,
  Clock,
  Music,
  Trophy,
  Zap,
  AlertCircle,
  RefreshCw,
  Users,
  Bot,
  Terminal,
} from "lucide-react";

function StatCard({ label, value, icon: Icon, color = "gold", sub }) {
  const colors = {
    gold: "np-text-gold",
    green: "text-emerald-400",
    purple: "text-purple-400",
    red: "text-red-400",
    blue: "text-blue-400",
  };
  return (
    <div className="np-bg-card border np-border rounded-xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
        <Icon className={`w-5 h-5 ${colors[color] || "np-text-gold"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-gray-400 text-xs truncate">{label}</p>
        <p className={`text-xl font-bold ${colors[color] || "text-white"} mt-0.5 truncate`}>
          {value}
        </p>
        {sub && <p className="text-gray-500 text-xs mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export default function BotStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchBotStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await adminApi.botStatus();
      setData(res);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Failed to fetch bot status");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await adminApi.botStatus();
        if (active) {
          setData(res);
          setError(null);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (active) setError(err.message || "Failed to fetch bot status");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    const interval = setInterval(async () => {
      try {
        const res = await adminApi.botStatus();
        if (active) {
          setData(res);
          setError(null);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (active) setError(err.message || "Failed to fetch bot status");
      }
    }, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const bot = data?.bot || null;
  const isOnline = bot && bot.status === "online" && !bot.is_stale;
  const isStale = bot && (bot.is_stale || bot.status !== "online");
  const isOffline = !bot;

  const getPlanBadgeClass = (planName) => {
    const name = (planName || "Free Trial").toLowerCase();
    if (name.includes("elite")) {
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    }
    if (name.includes("pro")) {
      return "text-purple-400 bg-purple-500/10 border-purple-500/20";
    }
    if (name.includes("starter")) {
      return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
    }
    return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-gray-400 text-sm">Loading Bot Status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Bot Status</h1>
            {isOnline && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                LIVE
              </div>
            )}
            {isStale && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                STALE
              </div>
            )}
            {isOffline && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                OFFLINE
              </div>
            )}
          </div>
          <p className="text-gray-400 text-xs mt-1">
            {bot?.bot_name ? `${bot.bot_name} • ` : ""}
            Auto-refreshes every 15s
            {lastUpdated && ` • Last updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>

        <button
          onClick={() => fetchBotStatus(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg np-bg-card border np-border text-gray-300 hover:text-white hover:border-gray-600 transition-colors text-sm font-medium disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="np-bg-card border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Offline Alert when bot is null */}
      {isOffline && (
        <div className="np-bg-card border border-red-500/20 rounded-xl p-6 flex items-start gap-4 text-red-400">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Bot Offline</h3>
            <p className="text-sm text-gray-400 mt-1">
              {data?.message ||
                "No live status received from the NexPlay bot. The bot process may be offline or not yet started."}
            </p>
          </div>
        </div>
      )}

      {/* Top Stat Cards Row (8 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <StatCard
          label="Status"
          value={bot ? (bot.is_stale ? "Stale" : bot.status?.toUpperCase() || "ONLINE") : "OFFLINE"}
          icon={Activity}
          color={isOnline ? "green" : "red"}
          sub={bot?.last_heartbeat ? `Heartbeat ${new Date(bot.last_heartbeat).toLocaleTimeString()}` : "No heartbeat"}
        />
        <StatCard
          label="Latency"
          value={bot ? `${bot.latency_ms ?? 0} ms` : "N/A"}
          icon={Zap}
          color={bot ? (bot.latency_ms < 100 ? "green" : "purple") : "red"}
          sub={bot ? "Discord Gateway" : "N/A"}
        />
        <StatCard
          label="Guilds"
          value={bot ? (bot.guild_count ?? 0) : 0}
          icon={Server}
          color="gold"
          sub="Connected servers"
        />
        <StatCard
          label="Total Members"
          value={bot ? (bot.total_members ? bot.total_members.toLocaleString() : 0) : 0}
          icon={Users}
          color="blue"
          sub="Across all guilds"
        />
        <StatCard
          label="Voice Connections"
          value={bot ? (bot.voice_connections ?? 0) : 0}
          icon={Wifi}
          color="purple"
          sub="Active voice channels"
        />
        <StatCard
          label="24/7 Sessions"
          value={bot ? (bot.music_247_count ?? 0) : 0}
          icon={Music}
          color="gold"
          sub="Always-on music"
        />
        <StatCard
          label="Active Tournaments"
          value={bot ? (bot.active_tournaments ?? 0) : 0}
          icon={Trophy}
          color="gold"
          sub="Tournaments running"
        />
        <StatCard
          label="Uptime"
          value={bot ? bot.uptime_formatted || "N/A" : "N/A"}
          icon={Clock}
          color="green"
          sub={bot?.uptime_seconds ? `${bot.uptime_seconds.toLocaleString()}s total` : "N/A"}
        />
      </div>

      {/* System Info Row */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-5 h-5 np-text-gold" />
          <h2 className="text-lg font-bold text-white">System Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="np-bg-card border np-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 np-text-gold" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">CPU Usage</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {bot ? `${bot.cpu_percent ?? 0}%` : "N/A"}
              </p>
            </div>
          </div>

          <div className="np-bg-card border np-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <MemoryStick className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Memory MB</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {bot ? `${bot.memory_mb ?? 0} MB` : "N/A"}
              </p>
            </div>
          </div>

          <div className="np-bg-card border np-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-gray-400 text-xs truncate">Python Version</p>
              <p className="text-lg font-bold text-white mt-0.5 truncate">
                {bot ? bot.python_version || "N/A" : "N/A"}
              </p>
              {bot?.platform && (
                <p className="text-gray-500 text-[10px] truncate">{bot.platform}</p>
              )}
            </div>
          </div>

          <div className="np-bg-card border np-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Commands Count</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {bot ? bot.commands_count ?? 0 : 0}
              </p>
              {bot?.version && (
                <p className="text-gray-500 text-[10px]">v{bot.version}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Per-guild Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 np-text-gold" />
            <h2 className="text-lg font-bold text-white">Guild Details</h2>
          </div>
          <span className="text-xs text-gray-400">
            {bot?.guilds ? `${bot.guilds.length} guild(s)` : "0 guilds"}
          </span>
        </div>

        <div className="np-bg-card border np-border rounded-xl overflow-x-auto np-scroll">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b np-border bg-white/[0.02]">
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Guild Name
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Members
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  VC Status
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Music
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  24/7
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
                  Tournaments
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">
                  Latency
                </th>
              </tr>
            </thead>
            <tbody className="divide-y np-border">
              {bot?.guilds && bot.guilds.length > 0 ? (
                bot.guilds.map((g, idx) => (
                  <tr key={g.guild_id || idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white text-sm">
                        {g.guild_name || "Unknown Guild"}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">{g.guild_id}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {(g.member_count ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPlanBadgeClass(
                          g.plan_name
                        )}`}
                      >
                        {g.plan_name || "Free Trial"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {g.voice_connected ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                          Disconnected
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {g.playing_music ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          Playing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                          Idle
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {g.is_247 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs np-text-gold font-medium">
                          <span className="w-2 h-2 rounded-full np-bg-gold"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300 text-center font-medium">
                      {g.tournament_count ?? 0}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300 text-right font-mono">
                      {g.latency_ms != null ? `${g.latency_ms} ms` : "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 text-sm">
                    No connected guilds found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
