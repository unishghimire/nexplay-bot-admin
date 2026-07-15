import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/adminApi";
import { Server, Activity, Clock, DollarSign, Trophy, Bell, ShieldBan, CreditCard, AlertCircle, RefreshCw, TrendingUp, Users } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const PLAN_COLORS = { "Free Trial": "#6b7280", "Starter": "#6366f1", "Pro": "#a855f7", "Elite": "#f59e0b" };

function StatCard({ label, value, icon: Icon, color = "gold", sub }) {
  const colors = { gold:"np-text-gold", green:"text-emerald-400", purple:"text-purple-400", red:"text-red-400", blue:"text-blue-400" };
  return (
    <div className="np-bg-card border np-border rounded-xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
        <Icon className={`w-5 h-5 ${colors[color]}`} />
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs truncate">{label}</p>
        <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
        {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const SEV_COLORS = { critical:"text-red-400 bg-red-500/10 border-red-500/20", warning:"text-yellow-400 bg-yellow-500/10 border-yellow-500/20", info:"text-blue-400 bg-blue-500/10 border-blue-500/20" };

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setData(await adminApi.dashboard()); }
    catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (error) return <div className="flex flex-col items-center justify-center h-96 gap-3"><AlertCircle className="w-10 h-10 text-red-400"/><p className="text-red-400">{error}</p><button onClick={load} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Retry</button></div>;

  const { stats, plan_distribution, recent_notifications, pending_transactions } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">NexPlay SaaS — live overview</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg np-bg-card border np-border text-gray-400 hover:text-white text-sm transition-colors">
          <RefreshCw className="w-4 h-4"/> Refresh
        </button>
      </div>

      {/* Pending banner */}
      {stats.pending_transactions > 0 && (
        <div onClick={() => navigate("/transactions")} className="cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle className="w-5 h-5 shrink-0"/>
          <span className="text-sm font-medium">{stats.pending_transactions} pending payment{stats.pending_transactions > 1 ? "s" : ""} waiting for review</span>
          <span className="ml-auto text-xs underline">Review →</span>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Servers"     value={stats.total_servers}      icon={Server}    color="gold"   />
        <StatCard label="Active"            value={stats.active_servers}     icon={Activity}  color="green"  />
        <StatCard label="Trial"             value={stats.trial_servers}      icon={Clock}     color="purple" />
        <StatCard label="Banned"            value={stats.banned_servers}     icon={ShieldBan} color="red"    />
        <StatCard label="MRR"               value={`NPR ${stats.mrr.toLocaleString()}`} icon={TrendingUp} color="gold" sub="Monthly recurring" />
        <StatCard label="Total Revenue"     value={`NPR ${stats.total_revenue.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatCard label="Tournaments"       value={stats.total_tournaments}  icon={Trophy}    color="purple" sub={`${stats.live_tournaments} live`} />
        <StatCard label="Unread Notifs"     value={stats.unread_notifications} icon={Bell}    color={stats.unread_notifications > 0 ? "red" : "blue"} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Plan Distribution */}
        <div className="np-bg-card border np-border rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Plan Distribution</h2>
          {plan_distribution.filter(p => p.count > 0).length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No servers yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={plan_distribution.filter(p=>p.count>0)} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({name,count})=>`${name}: ${count}`}>
                  {plan_distribution.filter(p=>p.count>0).map((p,i) => (
                    <Cell key={i} fill={PLAN_COLORS[p.name] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v,n)=>[`${v} servers`,n]} contentStyle={{background:"#1a1a2e",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",color:"#fff"}}/>
              </PieChart>
            </ResponsiveContainer>
          )}
          {/* Plan legend */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {plan_distribution.map(p => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{background: PLAN_COLORS[p.name]||"#6b7280"}}/>
                <span className="text-gray-400">{p.name}</span>
                <span className="text-white font-semibold ml-auto">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="np-bg-card border np-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Recent Notifications</h2>
            <button onClick={() => navigate("/notifications")} className="text-xs text-indigo-400 hover:underline">View all</button>
          </div>
          {recent_notifications.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No notifications</p>
          ) : (
            <div className="space-y-2">
              {recent_notifications.map(n => (
                <div key={n.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs ${SEV_COLORS[n.severity] || SEV_COLORS.info}`}>
                  <span className="font-semibold capitalize shrink-0">{n.severity}</span>
                  <span className="flex-1 text-gray-300">{n.message}</span>
                  {!n.read_by_unish && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1 shrink-0"/>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Transactions */}
      {pending_transactions.length > 0 && (
        <div className="np-bg-card border np-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Pending Payments</h2>
            <button onClick={() => navigate("/transactions")} className="text-xs text-indigo-400 hover:underline">Review all →</button>
          </div>
          <div className="space-y-2">
            {pending_transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <div>
                  <p className="text-white text-sm font-medium">{t.guild_name}</p>
                  <p className="text-gray-400 text-xs">{t.plan_name} · {t.payment_method} · TX: {t.transaction_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">NPR {t.amount}</p>
                  <p className="text-gray-500 text-xs">{t.submitted_at ? new Date(t.submitted_at).toLocaleDateString() : "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Manage Servers",   path: "/servers",         icon: Server,    color: "from-indigo-600 to-indigo-800" },
          { label: "Review Payments",  path: "/transactions",    icon: CreditCard, color: "from-emerald-600 to-emerald-800" },
          { label: "Notifications",    path: "/notifications",   icon: Bell,      color: "from-yellow-600 to-yellow-800" },
          { label: "Payment Methods",  path: "/payment-methods", icon: DollarSign, color: "from-purple-600 to-purple-800" },
        ].map(a => (
          <button key={a.path} onClick={() => navigate(a.path)}
            className={`flex items-center gap-2.5 p-4 rounded-xl bg-gradient-to-br ${a.color} text-white text-sm font-medium hover:opacity-90 transition-opacity`}>
            <a.icon className="w-4 h-4"/> {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
