import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, ChevronRight, Gavel, ArrowUpCircle, ShieldBan, ShieldCheck } from "lucide-react";

export default function Servers() {
  const [servers, setServers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailData, setDetailData] = useState({ tournaments: [], messages: [], loading: false });
  const [banModal, setBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [serverData, planData] = await Promise.all([
        base44.entities.Server.list("-created_date", 500),
        base44.entities.Plan.list("-created_date", 100),
      ]);
      setServers(serverData);
      setPlans(planData);
      if (planData.length > 0) {
        setUpgradePlan(planData[0].name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadDetail = async (server) => {
    setSelected(server);
    setDetailData({ tournaments: [], messages: [], loading: true });
    try {
      const [tourns, msgs] = await Promise.all([
        base44.entities.Tournament.list("-created_date", 500),
        base44.entities.SupportMessage.list("-created_date", 500),
      ]);
      
      const filteredTourns = tourns.filter((t) => t.guild_id === server.guild_id);
      const filteredMsgs = msgs.filter((m) => m.guild_id === server.guild_id);

      setDetailData({ tournaments: filteredTourns, messages: filteredMsgs, loading: false });
    } catch (e) {
      console.error(e);
      setDetailData({ tournaments: [], messages: [], loading: false });
    }
  };

  const handleUpgrade = async () => {
    const selectedPlanObj = plans.find((p) => p.name === upgradePlan);
    if (!selectedPlanObj) return;

    try {
      await base44.entities.Server.update(selected.id, {
        plan_name: upgradePlan,
        subscription_status: "active",
        tournament_limit: selectedPlanObj.tournament_limit || 10,
      });
      toast.success(`Server upgraded to ${upgradePlan}`);
      setServers((prev) =>
        prev.map((s) =>
          s.id === selected.id
            ? { ...s, plan_name: upgradePlan, subscription_status: "active", tournament_limit: selectedPlanObj.tournament_limit || 10 }
            : s
        )
      );
      setUpgradeModal(false);
      setSelected(null);
    } catch (e) {
      toast.error("Failed to upgrade plan");
    }
  };

  const handleExtendTrial = async () => {
    try {
      await base44.entities.Server.update(selected.id, {
        subscription_status: "trial",
        tournament_limit: 3,
      });
      toast.success("Trial extended");
      setServers((prev) =>
        prev.map((s) =>
          s.id === selected.id ? { ...s, subscription_status: "trial", tournament_limit: 3 } : s
        )
      );
      setSelected(null);
    } catch (e) {
      toast.error("Failed to extend trial");
    }
  };

  const handleBan = async () => {
    if (!banReason.trim()) {
      toast.error("Please provide a ban reason");
      return;
    }
    try {
      await base44.entities.Server.update(selected.id, {
        subscription_status: "banned",
        ban_reason: banReason,
      });
      toast.success("Server banned");
      setServers((prev) =>
        prev.map((s) =>
          s.id === selected.id ? { ...s, subscription_status: "banned", ban_reason: banReason } : s
        )
      );
      setBanModal(false);
      setBanReason("");
      setSelected(null);
    } catch (e) {
      toast.error("Failed to ban server");
    }
  };

  const handleUnban = async () => {
    try {
      await base44.entities.Server.update(selected.id, {
        subscription_status: "trial",
        ban_reason: "",
      });
      toast.success("Server unbanned");
      setServers((prev) =>
        prev.map((s) =>
          s.id === selected.id ? { ...s, subscription_status: "trial", ban_reason: "" } : s
        )
      );
      setSelected(null);
    } catch (e) {
      toast.error("Failed to unban server");
    }
  };

  const filtered = servers.filter((s) => {
    const matchFilter = filter === "all" || s.subscription_status === filter;
    const matchSearch =
      !search ||
      s.guild_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.guild_id?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-gray-700 rounded-full animate-spin" style={{ borderTopColor: "#FFD700" }} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Servers" subtitle={`${servers.length} servers on the platform`} />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by Guild Name or Guild ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 np-bg-card border-np-border text-white placeholder:text-gray-600"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48 np-bg-card border-np-border text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="np-bg-card border-np-border">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="np-bg-card rounded-xl border np-border overflow-hidden">
        <div className="overflow-x-auto np-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b np-border text-gray-500">
                <th className="text-left px-4 py-3 font-semibold">Guild Name</th>
                <th className="text-left px-4 py-3 font-semibold">Guild ID</th>
                <th className="text-left px-4 py-3 font-semibold">Plan Name</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Tournaments</th>
                <th className="text-left px-4 py-3 font-semibold">Member Count</th>
                <th className="text-left px-4 py-3 font-semibold">Last Active</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => loadDetail(s)}
                  className="border-b np-border cursor-pointer hover:np-bg-card-hover transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-white">{s.guild_name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{s.guild_id}</td>
                  <td className="px-4 py-3 text-gray-300">{s.plan_name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.subscription_status} />
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    <span className="text-white">{s.tournaments_used || 0}</span> / {s.tournament_limit || 0}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{(s.member_count || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.last_active ? new Date(s.last_active).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-sm">No servers found</div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selected && !banModal && !upgradeModal} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="np-bg-card border-np-border text-white max-w-4xl max-h-[85vh] overflow-y-auto np-scroll">
          {selected && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white flex items-center justify-between">
                  <span>{selected.guild_name} Details</span>
                  <StatusBadge status={selected.subscription_status} />
                </DialogTitle>
              </DialogHeader>

              {/* Grid Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 np-bg-base rounded-lg border np-border">
                <div>
                  <p className="text-xs text-gray-500">Guild ID</p>
                  <p className="text-sm text-white font-mono">{selected.guild_id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Owner Name (ID)</p>
                  <p className="text-sm text-white">{selected.owner_name} <span className="text-xs text-gray-500 font-mono">({selected.owner_id || "—"})</span></p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Plan</p>
                  <p className="text-sm np-text-gold font-semibold">{selected.plan_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tournaments Limit</p>
                  <p className="text-sm text-white">{selected.tournaments_used || 0} / {selected.tournament_limit || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Member Count</p>
                  <p className="text-sm text-white">{(selected.member_count || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Active</p>
                  <p className="text-sm text-white">{selected.last_active ? new Date(selected.last_active).toLocaleString() : "—"}</p>
                </div>
                {selected.subscription_status === "banned" && (
                  <div className="col-span-2">
                    <p className="text-xs text-red-400">Ban Reason</p>
                    <p className="text-sm text-red-300 italic">{selected.ban_reason || "No reason given"}</p>
                  </div>
                )}
              </div>

              {/* Tabs: Tournaments and Support Messages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tournaments List */}
                <div className="p-4 np-bg-base border np-border rounded-lg space-y-3">
                  <h4 className="text-sm font-semibold text-white">Guild Tournaments ({detailData.tournaments.length})</h4>
                  {detailData.loading ? (
                    <p className="text-xs text-gray-500">Loading tournaments...</p>
                  ) : detailData.tournaments.length === 0 ? (
                    <p className="text-xs text-gray-500">No tournaments registered</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto np-scroll pr-1">
                      {detailData.tournaments.map((t) => (
                        <div key={t.id} className="p-2 rounded border np-border bg-black/20 flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-white truncate max-w-[150px]">{t.name}</span>
                            <StatusBadge status={t.status} />
                          </div>
                          <p className="text-[10px] text-gray-400">Game: {t.game} | Format: {t.format}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Support Messages List */}
                <div className="p-4 np-bg-base border np-border rounded-lg space-y-3">
                  <h4 className="text-sm font-semibold text-white">Support Messages ({detailData.messages.length})</h4>
                  {detailData.loading ? (
                    <p className="text-xs text-gray-500">Loading support messages...</p>
                  ) : detailData.messages.length === 0 ? (
                    <p className="text-xs text-gray-500">No support messages from this guild</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto np-scroll pr-1">
                      {detailData.messages.map((m) => (
                        <div key={m.id} className="p-2 rounded border np-border bg-black/20 flex flex-col gap-1">
                          <p className="text-xs text-gray-200">{m.message}</p>
                          <div className="flex justify-between text-[10px] text-gray-500">
                            <span>Status: {m.status || "Open"}</span>
                            <span>{m.created_date ? new Date(m.created_date).toLocaleDateString() : ""}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t np-border">
                <Button
                  onClick={() => setUpgradeModal(true)}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                >
                  <ArrowUpCircle className="w-4 h-4 mr-2" /> Upgrade Plan
                </Button>
                <Button
                  onClick={handleExtendTrial}
                  className="bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" /> Extend Trial
                </Button>
                {selected.subscription_status === "banned" ? (
                  <Button
                    onClick={handleUnban}
                    className="bg-gray-600 text-white hover:bg-gray-700 font-semibold"
                  >
                    <Gavel className="w-4 h-4 mr-2" /> Unban Server
                  </Button>
                ) : (
                  <Button
                    onClick={() => setBanModal(true)}
                    className="bg-red-600 text-white hover:bg-red-700 font-semibold"
                  >
                    <ShieldBan className="w-4 h-4 mr-2" /> Ban Server
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelected(null)}
                  className="border-gray-700 text-gray-300 hover:text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upgrade Plan Modal */}
      <Dialog open={upgradeModal} onOpenChange={setUpgradeModal}>
        <DialogContent className="np-bg-card border-np-border text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Upgrade Plan for {selected?.guild_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Select Target Plan</label>
              <Select value={upgradePlan} onValueChange={setUpgradePlan}>
                <SelectTrigger className="w-full np-bg-base border-np-border text-white">
                  <SelectValue placeholder="Choose plan" />
                </SelectTrigger>
                <SelectContent className="np-bg-card border-np-border">
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name} (Limit: {p.tournament_limit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setUpgradeModal(false)}
                className="border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpgrade}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Confirm Upgrade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban Modal */}
      <Dialog open={banModal} onOpenChange={setBanModal}>
        <DialogContent className="np-bg-card border-np-border text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-400">Ban Server: {selected?.guild_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Reason for ban</label>
              <Textarea
                placeholder="Enter details reason..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="np-bg-base border-np-border text-white"
              />
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setBanModal(false)}
                className="border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBan}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Confirm Ban
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
