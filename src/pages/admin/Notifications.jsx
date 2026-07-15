import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Bell, Trash2, Mail, MessageSquare } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadData = useCallback(async () => {
    try {
      const [notifsData, supportData] = await Promise.all([
        base44.entities.AdminNotification.list("-created_date", 200),
        base44.entities.SupportMessage.list("-created_date", 200)
      ]);
      setNotifications(notifsData);
      setSupportMessages(supportData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubNotif = base44.entities.AdminNotification.subscribe(() => loadData());
    const unsubSupport = base44.entities.SupportMessage.subscribe(() => loadData());
    return () => {
      if (unsubNotif) unsubNotif();
      if (unsubSupport) unsubSupport();
    };
  }, [loadData]);

  const markAsRead = async (id) => {
    try {
      await base44.entities.AdminNotification.update(id, { read_by_unish: true });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_by_unish: true } : n)));
      toast.success("Marked as read");
    } catch (e) {
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read_by_unish);
      if (unread.length === 0) {
        toast.info("No unread notifications");
        return;
      }
      await Promise.all(
        unread.map((n) => base44.entities.AdminNotification.update(n.id, { read_by_unish: true }))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read_by_unish: true })));
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await base44.entities.AdminNotification.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (e) {
      toast.error("Failed to delete notification");
    }
  };

  const resolveSupportMessage = async (id) => {
    try {
      await base44.entities.SupportMessage.update(id, { status: "resolved" });
      setSupportMessages((prev) => prev.map((s) => (s.id === id ? { ...s, status: "resolved" } : s)));
      toast.success("Support ticket marked as resolved");
    } catch (e) {
      toast.error("Failed to update support message");
    }
  };

  const viewNotification = async (n) => {
    if (!n.read_by_unish) {
      await markAsRead(n.id);
    }
  };

  // Stats
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.read_by_unish).length;
  const criticalCount = notifications.filter((n) => n.severity === "critical").length;

  // Filtering
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read_by_unish;
    if (filter === "critical") return n.severity === "critical";
    if (filter === "info") return n.severity === "info";
    if (filter === "warning") return n.severity === "warning";
    return true;
  });

  const openSupportTickets = supportMessages.filter((s) => s.status === "open");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-gray-700 rounded-full animate-spin" style={{ borderTopColor: "#FFD700" }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Notifications"
          subtitle={`${unreadCount} unread of ${totalCount} total`}
          actions={
            <Button
              onClick={markAllAsRead}
              className="bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 transition-colors"
            >
              <Check className="w-4 h-4 mr-2" /> Mark All Read
            </Button>
          }
        />

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="np-bg-card rounded-xl border np-border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Notifications</p>
              <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center border np-border">
              <Bell className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="np-bg-card rounded-xl border np-border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Unread</p>
              <p className="text-2xl font-bold np-text-gold mt-1">{unreadCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
              <Mail className="w-5 h-5 text-[#FFD700]" />
            </div>
          </div>
          <div className="np-bg-card rounded-xl border np-border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Critical</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{criticalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Bell className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b np-border pb-4">
          {[
            { id: "all", label: "All" },
            { id: "unread", label: "Unread" },
            { id: "critical", label: "Critical" },
            { id: "warning", label: "Warning" },
            { id: "info", label: "Info" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                filter === tab.id
                  ? "bg-[#FFD700] text-black border-[#FFD700]"
                  : "bg-zinc-900/50 text-gray-400 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="np-bg-card rounded-xl border np-border py-16 text-center">
              <Bell className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No notifications found</p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => viewNotification(n)}
                className={`np-bg-card rounded-xl border np-border p-4 flex items-start gap-4 transition-all cursor-pointer hover:np-bg-card-hover ${
                  !n.read_by_unish ? "border-l-4 border-l-[#FFD700]" : "opacity-60"
                }`}
              >
                <div className="flex-shrink-0">
                  <StatusBadge severity={n.severity} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                      {n.type ? n.type.replace(/_/g, " ") : "NOTIFICATION"}
                    </span>
                    <span className="text-[10px] text-gray-600">·</span>
                    <span className="text-[10px] text-gray-500">{new Date(n.created_date).toLocaleString()}</span>
                    {!n.read_by_unish && (
                      <span className="w-1.5 h-1.5 bg-[#FFD700] rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-gray-200">{n.message}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {!n.read_by_unish && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(n.id)}
                      className="text-gray-400 hover:text-white hover:bg-zinc-800"
                    >
                      <Check className="w-4 h-4 mr-1" /> Mark Read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteNotification(n.id)}
                    className="text-red-400 hover:bg-red-950/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Support Messages Section */}
      <div className="pt-6 border-t np-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 np-text-gold" />
              Open Support Tickets
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage and resolve user tickets submitted from servers.</p>
          </div>
          <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
            {openSupportTickets.length} Open
          </span>
        </div>

        <div className="space-y-3">
          {openSupportTickets.length === 0 ? (
            <div className="np-bg-card rounded-xl border np-border py-12 text-center text-gray-500 text-sm">
              All support tickets are resolved. Nice job!
            </div>
          ) : (
            openSupportTickets.map((s) => (
              <div key={s.id} className="np-bg-card rounded-xl border np-border p-4 flex items-start gap-4 justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-sm text-white">{s.guild_name || "Unknown Guild"}</span>
                    <span className="text-[10px] text-gray-600">·</span>
                    <span className="text-[10px] text-gray-500">ID: {s.guild_id || "N/A"}</span>
                  </div>
                  <p className="text-sm text-gray-300 bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/50 italic">
                    "{s.message}"
                  </p>
                  <p className="text-[10px] text-gray-500 mt-2">Submitted: {new Date(s.created_date).toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <StatusBadge status={s.status} />
                  <Button
                    size="sm"
                    onClick={() => resolveSupportMessage(s.id)}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" /> Resolve Ticket
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
