import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Server as ServerIcon, Clock, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Revenue() {
  const [transactions, setTransactions] = useState([]);
  const [servers, setServers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = useCallback(async () => {
    try {
      const [txData, serverData, planData] = await Promise.all([
        base44.entities.Transaction.list("-created_date", 500),
        base44.entities.Server.list("-created_date", 500),
        base44.entities.Plan.list("-created_date", 100),
      ]);
      setTransactions(txData);
      setServers(serverData);
      setPlans(planData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculations for Stats Row
  const approvedTx = transactions.filter((t) => t.status === "approved");
  const pendingTx = transactions.filter((t) => t.status === "pending");
  const activeServers = servers.filter((s) => s.subscription_status === "active");

  const totalRevenue = approvedTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const mrr = activeServers.reduce((sum, s) => {
    const plan = plans.find((p) => p.name?.toLowerCase() === s.plan_name?.toLowerCase());
    return sum + (plan?.monthly_price || 0);
  }, 0);

  const pendingCount = pendingTx.length;
  const pendingSum = pendingTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Month-over-month calculation based on submitted_at date
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  const thisMonthRevenue = approvedTx.reduce((sum, t) => {
    if (!t.submitted_at) return sum;
    const date = new Date(t.submitted_at);
    if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
      return sum + (Number(t.amount) || 0);
    }
    return sum;
  }, 0);

  // Revenue by Plan calculations
  const revenueByPlan = plans.map((p) => {
    const totalForPlan = approvedTx
      .filter((t) => t.plan_name?.toLowerCase() === p.name?.toLowerCase())
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    return { name: p.name, amount: totalForPlan };
  });

  // Month-over-month chart processing
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const momData = months.map((m, index) => {
    const sum = approvedTx.reduce((acc, t) => {
      if (!t.submitted_at) return acc;
      const date = new Date(t.submitted_at);
      if (date.getMonth() === index && date.getFullYear() === 2026) {
        return acc + (Number(t.amount) || 0);
      }
      return acc;
    }, 0);
    return { month: m, revenue: sum };
  });

  const filteredTransactions = transactions.filter((t) => {
    return statusFilter === "all" || t.status === statusFilter;
  });

  const PLAN_COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-gray-700 rounded-full animate-spin" style={{ borderTopColor: "#FFD700" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Revenue & Transactions" subtitle="Detailed billing and cash-flow overview" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} accent="gold" />
        <StatCard label="MRR (Active Servers)" value={`$${mrr.toLocaleString()}`} icon={ServerIcon} accent="green" />
        <StatCard label="Pending Transactions" value={`${pendingCount} ($${pendingSum})`} icon={AlertCircle} accent="red" />
        <StatCard label="This Month Revenue" value={`$${thisMonthRevenue.toLocaleString()}`} icon={Clock} accent="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan Chart */}
        <div className="np-bg-card rounded-xl border np-border p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Revenue by Subscription Plan</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueByPlan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ background: "#0a0a0f", border: "1px solid #2a2a44", color: "#fff" }} />
              <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                {revenueByPlan.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Month over Month Chart */}
        <div className="np-bg-card rounded-xl border np-border p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Month-Over-Month Performance (2026)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={momData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ background: "#0a0a0f", border: "1px solid #2a2a44", color: "#fff" }} />
              <Bar dataKey="revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="np-bg-card rounded-xl border np-border overflow-hidden">
        <div className="px-6 py-4 border-b np-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-sm font-semibold text-white">Transaction History</h3>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 np-bg-base border-np-border text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="np-bg-card border-np-border">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto np-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b np-border text-gray-500">
                <th className="text-left px-4 py-3 font-semibold">Guild Name</th>
                <th className="text-left px-4 py-3 font-semibold">Plan Name</th>
                <th className="text-left px-4 py-3 font-semibold">Amount</th>
                <th className="text-left px-4 py-3 font-semibold">Payment Method</th>
                <th className="text-left px-4 py-3 font-semibold">Submitted Date</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="border-b np-border hover:np-bg-card-hover transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{t.guild_name}</td>
                  <td className="px-4 py-3 text-gray-300">{t.plan_name}</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">${t.amount}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{t.payment_method}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {t.submitted_at ? new Date(t.submitted_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-sm">No transactions found</div>
        )}
      </div>
    </div>
  );
}
