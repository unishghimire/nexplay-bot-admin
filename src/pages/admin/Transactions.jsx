import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, Clock, Eye, RefreshCw, Search } from "lucide-react";

const STATUS_COLORS = {
  pending:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default function Transactions() {
  const [txns, setTxns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes]     = useState("");
  const [saving, setSaving]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Transaction.list("-created_date", 200);
      setTxns(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = txns.filter(t => {
    const matchSearch = !search ||
      t.guild_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.transaction_id?.toLowerCase().includes(search.toLowerCase()) ||
      t.guild_id?.includes(search);
    const matchFilter = filter === "all" || t.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    pending:  txns.filter(t => t.status === "pending").length,
    approved: txns.filter(t => t.status === "approved").length,
    rejected: txns.filter(t => t.status === "rejected").length,
    total:    txns.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0),
  };

  const approve = async (txn) => {
    setSaving(true);
    try {
      await base44.entities.Transaction.update(txn.id, {
        status: "approved",
        reviewed_at: new Date().toISOString(),
        notes: notes || "Approved by admin",
      });
      // Also activate subscription for this guild
      const servers = await base44.entities.Server.filter({ guild_id: txn.guild_id });
      if (servers.length > 0) {
        await base44.entities.Server.update(servers[0].id, {
          subscription_status: "active",
          plan_name: txn.plan_name || servers[0].plan_name,
        });
      }
      await load();
      setSelected(null);
      setNotes("");
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const reject = async (txn) => {
    if (!notes) { alert("Please add a rejection reason in the notes field."); return; }
    setSaving(true);
    try {
      await base44.entities.Transaction.update(txn.id, {
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        notes,
      });
      await load();
      setSelected(null);
      setNotes("");
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400 text-sm mt-1">Review and approve payment submissions</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg np-bg-card border np-border text-gray-400 hover:text-white text-sm transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending",  val: stats.pending,  color: "text-yellow-400" },
          { label: "Approved", val: stats.approved, color: "text-emerald-400" },
          { label: "Rejected", val: stats.rejected, color: "text-red-400" },
          { label: "Total NPR", val: `NPR ${stats.total.toLocaleString()}`, color: "np-text-gold" },
        ].map(s => (
          <div key={s.label} className="np-bg-card border np-border rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by server name or transaction ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg np-bg-card border np-border text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div className="flex gap-2">
          {["all","pending","approved","rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? "bg-indigo-600 text-white" : "np-bg-card border np-border text-gray-400 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="np-bg-card border np-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b np-border">
                  {["Server","Plan","Amount","Transaction ID","Method","Submitted","Status","Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y np-border">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{t.guild_name || "Unknown"}</p>
                      <p className="text-gray-500 text-xs">{t.guild_id}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{t.plan_name || "—"}</td>
                    <td className="px-4 py-3 text-emerald-400 font-semibold">NPR {t.amount || "—"}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.transaction_id || "—"}</td>
                    <td className="px-4 py-3 text-gray-300">{t.payment_method || "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {t.submitted_at ? new Date(t.submitted_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[t.status] || STATUS_COLORS.pending}`}>
                        {t.status === "approved" && <CheckCircle className="w-3 h-3"/>}
                        {t.status === "rejected" && <XCircle className="w-3 h-3"/>}
                        {t.status === "pending"  && <Clock className="w-3 h-3"/>}
                        {t.status || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelected(t); setNotes(t.notes || ""); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 text-xs font-medium transition-colors">
                        <Eye className="w-3.5 h-3.5"/> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="np-bg-card border np-border rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="px-6 py-5 border-b np-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Review Transaction</h2>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["Server",         selected.guild_name],
                  ["Guild ID",       selected.guild_id],
                  ["Plan",           selected.plan_name],
                  ["Amount",         `NPR ${selected.amount}`],
                  ["Transaction ID", selected.transaction_id],
                  ["Method",         selected.payment_method],
                  ["Status",         selected.status],
                  ["Submitted",      selected.submitted_at ? new Date(selected.submitted_at).toLocaleString() : "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-gray-500 text-xs uppercase mb-1">{k}</p>
                    <p className="text-white font-medium">{v || "—"}</p>
                  </div>
                ))}
              </div>

              {selected.screenshot_url && (
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-2">Payment Screenshot</p>
                  <img src={selected.screenshot_url} alt="Payment proof"
                    className="w-full rounded-lg border np-border max-h-64 object-contain bg-black/30"/>
                </div>
              )}

              <div>
                <label className="text-gray-500 text-xs uppercase block mb-2">Admin Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add notes (required for rejection)..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg np-bg-base border np-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none"
                />
              </div>

              {selected.status === "pending" && (
                <div className="flex gap-3">
                  <button onClick={() => approve(selected)} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors disabled:opacity-50">
                    <CheckCircle className="w-4 h-4"/> {saving ? "Saving…" : "Approve & Activate"}
                  </button>
                  <button onClick={() => reject(selected)} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-semibold text-sm transition-colors disabled:opacity-50">
                    <XCircle className="w-4 h-4"/> {saving ? "Saving…" : "Reject"}
                  </button>
                </div>
              )}
              {selected.status !== "pending" && (
                <p className="text-center text-gray-500 text-sm">This transaction has already been reviewed.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
