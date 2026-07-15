import React, { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { Search, RefreshCw, ChevronRight, ShieldBan, ShieldCheck, ArrowUpCircle, Clock, X, Trophy, MessageSquare, Send } from "lucide-react";

const STATUS_STYLES = {
  active:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  trial:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  expired: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  banned:  "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function Servers() {
  const [servers, setServers]   = useState([]);
  const [plans, setPlans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("all");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [upgradePlan, setUpgradePlan] = useState("");
  const [banReason, setBanReason]     = useState("");
  const [dmMsg, setDmMsg]             = useState("");
  const [modal, setModal]             = useState(null); // 'upgrade'|'ban'|'dm'

  const load = async () => {
    setLoading(true);
    try {
      const [sv, pl] = await Promise.all([adminApi.servers(), adminApi.plans()]);
      setServers(sv.servers || []);
      setPlans(pl.plans || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadDetail = async (server) => {
    setSelected(server); setDetail(null); setDetailLoading(true);
    try { const d = await adminApi.serverDetail(server.guild_id); setDetail(d); }
    catch (e) { setDetail({ error: e.message }); }
    setDetailLoading(false);
  };

  const filtered = servers.filter(s => {
    const m = !search || s.guild_name?.toLowerCase().includes(search.toLowerCase()) || s.guild_id?.includes(search);
    const f = filter === "all" || s.subscription_status === filter;
    return m && f;
  });

  const updateServer = async (id, data) => {
    setSaving(true);
    try {
      await adminApi.updateServer({ id, guild_id: selected?.guild_id, guild_name: selected?.guild_name, ...data });
      await load();
      if (selected) setSelected(prev => ({ ...prev, ...data }));
      setModal(null);
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const sendDm = async () => {
    if (!dmMsg || !selected?.owner_id) return;
    setSaving(true);
    try { await adminApi.messageOwner(selected.owner_id, dmMsg); alert("Message sent!"); setModal(null); setDmMsg(""); }
    catch (e) { alert(e.message); }
    setSaving(false);
  };

  return (
    <div className="flex gap-5 h-[calc(100vh-8rem)]">
      {/* Server list */}
      <div className="flex-1 flex flex-col min-w-0 np-bg-card border np-border rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b np-border space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white">Servers <span className="text-gray-500 text-sm font-normal">({filtered.length})</span></h1>
            <button onClick={load} className="p-2 rounded-lg np-bg-base border np-border text-gray-400 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4"/>
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search server name or ID..."
              className="w-full pl-9 pr-3 py-2 rounded-lg np-bg-base border np-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["all","active","trial","expired","banned"].map(f => (
              <button key={f} onClick={()=>setFilter(f)} className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${filter===f?"bg-indigo-600 text-white":"np-bg-base border np-border text-gray-400 hover:text-white"}`}>{f}</button>
            ))}
          </div>
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto np-scroll">
          {loading ? (
            <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">No servers found</div>
          ) : filtered.map(s => (
            <button key={s.id} onClick={()=>loadDetail(s)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b np-border hover:bg-white/3 transition-colors text-left ${selected?.id===s.id?"bg-indigo-600/10":""}`}>
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {s.guild_name?.[0]?.toUpperCase()||"?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{s.guild_name}</p>
                <p className="text-gray-500 text-xs">{s.plan_name} · {s.member_count?.toLocaleString()||0} members</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${STATUS_STYLES[s.subscription_status]||STATUS_STYLES.trial}`}>{s.subscription_status}</span>
                <ChevronRight className="w-4 h-4 text-gray-600"/>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div className="w-80 np-bg-card border np-border rounded-xl flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">Select a server</div>
        ) : (
          <>
            <div className="p-4 border-b np-border flex items-start justify-between">
              <div>
                <h2 className="text-white font-bold text-base">{selected.guild_name}</h2>
                <p className="text-gray-500 text-xs font-mono">{selected.guild_id}</p>
              </div>
              <button onClick={()=>setSelected(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto np-scroll p-4 space-y-4">
              {/* Server stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[["Plan", selected.plan_name], ["Status", selected.subscription_status], ["Members", selected.member_count?.toLocaleString()||"0"], ["Tournaments", `${selected.tournaments_used||0}/${selected.tournament_limit||0}`], ["Owner", selected.owner_name], ["Last Active", selected.last_active ? new Date(selected.last_active).toLocaleDateString() : "—"]].map(([k,v]) => (
                  <div key={k} className="np-bg-base rounded-lg p-2">
                    <p className="text-gray-500 text-[10px] uppercase mb-0.5">{k}</p>
                    <p className="text-white font-medium truncate">{v||"—"}</p>
                  </div>
                ))}
              </div>

              {selected.ban_reason && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-xs font-semibold mb-0.5">Ban Reason</p>
                  <p className="text-gray-300 text-xs">{selected.ban_reason}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider">Actions</p>
                <button onClick={()=>{ setUpgradePlan(selected.plan_name||"Starter"); setModal("upgrade"); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 text-xs font-medium transition-colors">
                  <ArrowUpCircle className="w-3.5 h-3.5"/> Upgrade / Change Plan
                </button>
                <button onClick={()=>updateServer(selected.id,{subscription_status:"trial",plan_name:"Free Trial",tournament_limit:3})} disabled={saving}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-xs font-medium transition-colors">
                  <Clock className="w-3.5 h-3.5"/> Reset to Trial
                </button>
                {selected.subscription_status === "banned" ? (
                  <button onClick={()=>updateServer(selected.id,{subscription_status:"trial",ban_reason:null})} disabled={saving}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5"/> Unban Server
                  </button>
                ) : (
                  <button onClick={()=>{ setBanReason(""); setModal("ban"); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors">
                    <ShieldBan className="w-3.5 h-3.5"/> Ban Server
                  </button>
                )}
                <button onClick={()=>{ setDmMsg(""); setModal("dm"); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-xs font-medium transition-colors">
                  <Send className="w-3.5 h-3.5"/> Message Owner
                </button>
              </div>

              {/* Tournaments */}
              {detailLoading ? <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
              : detail && !detail.error && (
                <>
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Tournaments ({detail.tournaments?.length||0})</p>
                    {detail.tournaments?.length === 0 ? <p className="text-gray-600 text-xs">No tournaments yet</p>
                    : detail.tournaments?.slice(0,5).map(t => (
                      <div key={t.id} className="flex items-center gap-2 py-1.5 border-b np-border">
                        <Trophy className="w-3 h-3 text-gray-500 shrink-0"/>
                        <span className="text-gray-300 text-xs truncate flex-1">{t.name}</span>
                        <span className="text-[10px] text-gray-500 capitalize">{t.status}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Support Messages ({detail.support_messages?.length||0})</p>
                    {detail.support_messages?.length === 0 ? <p className="text-gray-600 text-xs">No messages</p>
                    : detail.support_messages?.slice(0,3).map(m => (
                      <div key={m.id} className="flex items-start gap-2 py-1.5 border-b np-border">
                        <MessageSquare className="w-3 h-3 text-gray-500 shrink-0 mt-0.5"/>
                        <p className="text-gray-400 text-xs line-clamp-2">{m.message}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {modal === "upgrade" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="np-bg-card border np-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="text-white font-bold text-lg">Change Plan</h3>
            <select value={upgradePlan} onChange={e=>setUpgradePlan(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg np-bg-base border np-border text-white text-sm focus:outline-none focus:border-indigo-500/50">
              {plans.map(p => <option key={p.id} value={p.name}>{p.name} — NPR {p.monthly_price}/mo</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={()=>setModal(null)} className="flex-1 py-2.5 rounded-xl np-bg-base border np-border text-gray-400 text-sm">Cancel</button>
              <button onClick={()=>updateServer(selected.id,{plan_name:upgradePlan,subscription_status:"active",tournament_limit:plans.find(p=>p.name===upgradePlan)?.tournament_limit||10})} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50">
                {saving?"Saving…":"Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
      {modal === "ban" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="np-bg-card border np-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="text-white font-bold text-lg">Ban Server</h3>
            <textarea value={banReason} onChange={e=>setBanReason(e.target.value)} placeholder="Reason for ban (required)..." rows={3}
              className="w-full px-3 py-2 rounded-lg np-bg-base border np-border text-white text-sm placeholder-gray-600 focus:outline-none resize-none"/>
            <div className="flex gap-3">
              <button onClick={()=>setModal(null)} className="flex-1 py-2.5 rounded-xl np-bg-base border np-border text-gray-400 text-sm">Cancel</button>
              <button onClick={()=>{ if(!banReason){alert("Reason required");return;} updateServer(selected.id,{subscription_status:"banned",ban_reason:banReason}); }} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50">
                {saving?"Saving…":"Ban"}
              </button>
            </div>
          </div>
        </div>
      )}
      {modal === "dm" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="np-bg-card border np-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="text-white font-bold text-lg">Message {selected?.owner_name}</h3>
            <textarea value={dmMsg} onChange={e=>setDmMsg(e.target.value)} placeholder="Type your message..." rows={4}
              className="w-full px-3 py-2 rounded-lg np-bg-base border np-border text-white text-sm placeholder-gray-600 focus:outline-none resize-none"/>
            <div className="flex gap-3">
              <button onClick={()=>setModal(null)} className="flex-1 py-2.5 rounded-xl np-bg-base border np-border text-gray-400 text-sm">Cancel</button>
              <button onClick={sendDm} disabled={saving||!dmMsg}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold disabled:opacity-50">
                {saving?"Sending…":"Send DM"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
