import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import PageHeader from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Server as ServerIcon, Activity, Clock, DollarSign, Trophy, Bell, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, active: 0, trial: 0, pendingTxCount: 0, mrr: 0, liveTournaments: 0 });
  const [planDist, setPlanDist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [pendingTx, setPendingTx] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [servers, tournaments, transactions, notificationsData, plans] = await Promise.all([
        base44.entities.Server.list("-created_date", 500),
        base44.entities.Tournament.list("-created_date", 500),
        base44.entities.Transaction.list("-created_date", 500),
        base44.entities.AdminNotification.list("-created_date", 500),
        base44.entities.Plan.list("-created_date", 100),
      ]);

      const activeServers = servers.filter((s) => s.subscription_status === "active");
      const trialServers = servers.filter((s) => s.subscription_status === "trial");
      const pendingTransactions = transactions.filter((t) => t.status === "pending");
      const liveTournaments = tournaments.filter((t) => t.status === "in_progress");

      // Calculate MRR: sum plan monthly_price for active servers
      const mrr = activeServers.reduce((sum, s) => {
        const plan = plans.find((p) => p.name?.toLowerCase() === s.plan_name?.toLowerCase());
        return sum + (plan?.monthly_price || 0);
      }, 0);

      setStats({
        total: servers.length,
        active: activeServers.length,
        trial: trialServers.length,
        pendingTxCount: pendingTransactions.length,
        mrr,
        liveTournaments: liveTournaments.length,
      });

      // Plan distribution pie chart categories
      const categories = ["Starter", "Pro", "Elite", "Free Trial"];
      const dist = categories.map((planName) => {
        let count = 0;
        if (planName === "Free Trial") {
          count = servers.filter((s) => s.plan_name?.toLowerCase() === "free trial" || s.subscription_status === "trial").length;
        } else {
          count = servers.filter((s) => s.plan_name?.toLowerCase() === planName.toLowerCase() && s.subscription_status !== "trial").length;
        }
        return { name: planName, value: count };
      });
      setPlanDist(dist);

      setNotifications(notificationsData.slice(0, 5));
      setPendingTx(pendingTransactions.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-gray-700 border-t-np-bg-gold rounded-full animate-spin" style={{ borderTopColor: "#FFD700" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title="Dashboard" subtitle="Overview of your NexPlay Tournament Bot platform" />
        {stats.pendingTxCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 rounded-lg animate-pulse">
            <Clock className="w-5 h-5" />
            <span className="font-semibold text-sm">{stats.pendingTxCount} Pending Transactions</span>
          </div>
        )}
      </div>

      {/* Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Servers" value={stats.total} icon={ServerIcon} accent="gold" />
        <StatCard label="Active Subscriptions" value={stats.active} icon={Activity} accent="green" />
        <StatCard label="Trial Servers" value={stats.trial} icon={Clock} accent="purple" />
        <StatCard label="Pending Transactions" value={stats.pendingTxCount} icon={Bell} accent="red" />
        <StatCard label="MRR" value={`$${stats.mrr.toLocaleString()}`} icon={DollarSign} accent="gold" />
        <StatCard label="Live Tournaments" value={stats.liveTournaments} icon={Trophy} accent="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Distribution */}
        <div className="np-bg-card rounded-xl border np-border p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Plan Distribution</h3>
            {planDist.every((p) => p.value === 0) ? (
              <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No server data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={planDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4}>
                    {planDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0a0a0f", border: "1px solid #2a2a44", borderRadius: 8, color: "#fff" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Side-by-Side Activity Feed */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 np-bg-card rounded-xl border np-border p-6">
          {/* Admin Notifications */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" /> Admin Notifications
            </h3>
            {notifications.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-500 text-sm border border-dashed np-border rounded-lg">No alerts</div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-lg np-bg-base border np-border flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <StatusBadge severity={n.severity} />
                      <span className="text-[10px] text-gray-500">
                        {n.type?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 mt-1 line-clamp-2">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Transactions */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Pending Transactions
            </h3>
            {pendingTx.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-500 text-sm border border-dashed np-border rounded-lg">All transactions reviewed</div>
            ) : (
              <div className="space-y-3">
                {pendingTx.map((t) => (
                  <div key={t.id} className="p-3 rounded-lg np-bg-base border np-border flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{t.guild_name}</span>
                      <span className="text-sm font-bold np-text-gold">${t.amount}</span>
                    </div>
                    <p className="text-xs text-gray-400">{t.plan_name} plan</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-500">{t.payment_method}</span>
                      <StatusBadge status="pending" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="np-bg-card rounded-xl border np-border p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button onClick={() => navigate("/admin/servers")} className="np-bg-gold text-black hover:brightness-110 font-semibold justify-between">
            Manage Servers <ArrowRight className="w-4 h-4" />
          </Button>
          <Button onClick={() => navigate("/admin/revenue")} className="bg-purple-600 text-white hover:bg-purple-700 font-semibold justify-between">
            View Revenue <ArrowRight className="w-4 h-4" />
          </Button>
          <Button onClick={() => navigate("/admin/payment-methods")} className="bg-zinc-800 text-white hover:bg-zinc-700 font-semibold justify-between border np-border">
            Payment Methods <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
