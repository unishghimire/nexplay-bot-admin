import React, { useState, useEffect, useMemo } from "react";
import { adminApi } from "@/lib/adminApi";
import {
  Trophy,
  Search,
  RefreshCw,
  AlertCircle,
  Users,
  Calendar,
  Crown,
  Gamepad2,
  Server,
  Layers,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const STATUS_BADGES = {
  registration_open: {
    label: "Registration Open",
    bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    color: "#10b981",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    color: "#3b82f6",
  },
  completed: {
    label: "Completed",
    bg: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    color: "#6b7280",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-500/10 text-red-400 border-red-500/20",
    color: "#ef4444",
  },
  groups_generated: {
    label: "Groups Generated",
    bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    color: "#a855f7",
  },
};

function getStatusInfo(status) {
  if (STATUS_BADGES[status]) {
    return STATUS_BADGES[status];
  }
  const formatted = status ? status.replace(/_/g, " ") : "Unknown";
  return {
    label: formatted.charAt(0).toUpperCase() + formatted.slice(1),
    bg: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    color: "#9ca3af",
  };
}

function getPlanBadge(plan) {
  const p = (plan || "").toLowerCase();
  if (p.includes("elite")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (p.includes("pro")) return "bg-purple-500/10 text-purple-400 border-purple-500/20";
  if (p.includes("starter")) return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
  return "bg-gray-500/10 text-gray-400 border-gray-500/20";
}

export default function Tournaments() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await adminApi.allTournaments();
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to fetch tournaments data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const tournaments = data?.tournaments || [];
  const summary = data?.summary || {};

  // Computed summary metrics with fallbacks
  const totalTournaments = summary.total ?? tournaments.length;
  const totalRegistrations =
    summary.total_registrations ??
    tournaments.reduce((acc, t) => acc + (t.registered_count || 0), 0);
  const liveCount =
    summary.by_status?.in_progress ??
    tournaments.filter((t) => t.status === "in_progress").length;
  const openCount =
    summary.by_status?.registration_open ??
    tournaments.filter((t) => t.status === "registration_open").length;

  // Chart data calculation
  const chartData = useMemo(() => {
    const counts = {
      registration_open: 0,
      groups_generated: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    if (summary.by_status) {
      Object.entries(summary.by_status).forEach(([key, val]) => {
        counts[key] = val;
      });
    } else {
      tournaments.forEach((t) => {
        if (t.status) {
          counts[t.status] = (counts[t.status] || 0) + 1;
        }
      });
    }

    return [
      {
        statusKey: "registration_open",
        name: "Open",
        count: counts.registration_open || 0,
        color: STATUS_BADGES.registration_open.color,
      },
      {
        statusKey: "groups_generated",
        name: "Groups",
        count: counts.groups_generated || 0,
        color: STATUS_BADGES.groups_generated.color,
      },
      {
        statusKey: "in_progress",
        name: "Live",
        count: counts.in_progress || 0,
        color: STATUS_BADGES.in_progress.color,
      },
      {
        statusKey: "completed",
        name: "Completed",
        count: counts.completed || 0,
        color: STATUS_BADGES.completed.color,
      },
      {
        statusKey: "cancelled",
        name: "Cancelled",
        count: counts.cancelled || 0,
        color: STATUS_BADGES.cancelled.color,
      },
    ];
  }, [summary, tournaments]);

  // Filtering
  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      // Status filter
      if (statusFilter !== "all" && t.status !== statusFilter) {
        return false;
      }

      // Search filter (matches name, guild_name, or status, game, format)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (t.name || "").toLowerCase().includes(query);
        const matchesGuild = (t.guild_name || "").toLowerCase().includes(query);
        const matchesStatus = (t.status || "").toLowerCase().includes(query);
        const matchesGame = (t.game || "").toLowerCase().includes(query);
        const matchesFormat = (t.format || "").toLowerCase().includes(query);
        return matchesName || matchesGuild || matchesStatus || matchesGame || matchesFormat;
      }

      return true;
    });
  }, [tournaments, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="text-center">
          <p className="text-red-400 font-semibold">{error}</p>
          <p className="text-gray-500 text-sm mt-1">
            Could not fetch tournament records from admin service.
          </p>
        </div>
        <button
          onClick={() => loadData()}
          className="px-4 py-2 rounded-lg bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 np-text-gold" />
            Tournaments
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Monitor and manage tournaments across all connected Discord servers
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="p-2.5 rounded-xl np-bg-card border np-border text-gray-400 hover:text-white transition-all duration-200 flex items-center gap-2 text-sm font-medium self-start sm:self-auto hover:border-gray-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin np-text-gold" : ""}`} />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* 2. Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="np-bg-card border np-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Trophy className="w-6 h-6 np-text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-400 text-xs font-medium truncate">Total Tournaments</p>
            <p className="text-2xl font-bold np-text-gold mt-0.5">{totalTournaments}</p>
            <p className="text-gray-500 text-[11px] mt-0.5 truncate">Across all servers</p>
          </div>
        </div>

        <div className="np-bg-card border np-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-400 text-xs font-medium truncate">Total Registrations</p>
            <p className="text-2xl font-bold text-blue-400 mt-0.5">{totalRegistrations}</p>
            <p className="text-gray-500 text-[11px] mt-0.5 truncate">Registered players/teams</p>
          </div>
        </div>

        <div className="np-bg-card border np-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Gamepad2 className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-400 text-xs font-medium truncate">Live Tournaments</p>
            <p className="text-2xl font-bold text-indigo-400 mt-0.5">{liveCount}</p>
            <p className="text-gray-500 text-[11px] mt-0.5 truncate">In progress</p>
          </div>
        </div>

        <div className="np-bg-card border np-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Crown className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-400 text-xs font-medium truncate">Open Registration</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">{openCount}</p>
            <p className="text-gray-500 text-[11px] mt-0.5 truncate">Accepting entries</p>
          </div>
        </div>
      </div>

      {/* 3. Status Bar Chart */}
      <div className="np-bg-card border np-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-semibold text-base flex items-center gap-2">
              <Layers className="w-4 h-4 np-text-gold" />
              Tournaments by Status
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              Distribution of tournaments across lifecycle stages
            </p>
          </div>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f0f17",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                }}
                cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                formatter={(value) => [`${value} Tournaments`, "Count"]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Controls: Search + Filter Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tournament name, server guild, game..."
            className="w-full bg-[#0a0a0f] border np-border text-white text-sm rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 np-scroll">
          {[
            { id: "all", label: "All" },
            { id: "registration_open", label: "Registration Open" },
            { id: "in_progress", label: "In Progress" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((btn) => {
            const isActive = statusFilter === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? "np-bg-gold text-black border-amber-400 shadow-md"
                    : "bg-white/5 text-gray-400 hover:text-white border-transparent hover:bg-white/10"
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Tournament Table */}
      <div className="np-bg-card border np-border rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto np-scroll">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b np-border bg-white/[0.02] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Tournament</th>
                <th className="py-3.5 px-4">Game</th>
                <th className="py-3.5 px-4">Server</th>
                <th className="py-3.5 px-4">Plan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Players / Max</th>
                <th className="py-3.5 px-4">Prize Pool</th>
                <th className="py-3.5 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y np-border text-sm">
              {filteredTournaments.length > 0 ? (
                filteredTournaments.map((t) => {
                  const statusInfo = getStatusInfo(t.status);
                  const planBadgeClass = getPlanBadge(t.plan_name);
                  const regCount = t.registered_count || 0;
                  const maxCount = t.max_players || 0;
                  const percent = maxCount > 0 ? Math.min(100, Math.round((regCount / maxCount) * 100)) : 0;

                  return (
                    <tr
                      key={t.id || t.name}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Name & Format */}
                      <td className="py-4 px-4 min-w-[200px]">
                        <div className="font-semibold text-white group-hover:np-text-gold transition-colors flex items-center gap-2">
                          <span>{t.name}</span>
                        </div>
                        {t.format && (
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            {t.format}
                          </div>
                        )}
                      </td>

                      {/* Game */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Gamepad2 className="w-4 h-4 text-indigo-400" />
                          <span>{t.game || "Free Fire"}</span>
                        </div>
                      </td>

                      {/* Server / Guild */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-300 font-medium">
                          <Server className="w-3.5 h-3.5 text-gray-400" />
                          <span>{t.guild_name || "N/A"}</span>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${planBadgeClass}`}
                        >
                          {t.plan_name || "Standard"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.bg}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full mr-1.5"
                            style={{ backgroundColor: statusInfo.color }}
                          />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Registered / Max */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[140px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-white font-medium">
                            {regCount} / {maxCount || "∞"}
                          </span>
                          <span className="text-gray-400">{percent}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </td>

                      {/* Prize */}
                      <td className="py-4 px-4 whitespace-nowrap font-medium np-text-gold">
                        {t.prize_pool || "N/A"}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <div>
                            <p className="text-gray-300 font-medium">
                              {t.tournament_date || "TBD"}
                            </p>
                            {t.tournament_time && (
                              <p className="text-gray-500">{t.tournament_time}</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : null}
            </tbody>
          </table>
        </div>

        {/* 6. Empty State */}
        {filteredTournaments.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mb-4 border np-border">
              <Trophy className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-white text-base font-semibold">No tournaments found</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-sm">
              {searchQuery || statusFilter !== "all"
                ? "No tournaments match your current search or filter criteria."
                : "No tournaments have been registered yet across any server."}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
