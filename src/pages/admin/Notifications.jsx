import React, { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { Bell, RefreshCw, CheckCheck, Trash2, AlertTriangle, Info, AlertCircle, MessageSquare, CheckCircle } from "lucide-react";

const SEV = {
  critical: { style:"bg-red-500/10 border-red-500/20 text-red-300", icon: AlertCircle, label:"Critical" },
  warning:  { style:"bg-yellow-500/10 border-yellow-500/20 text-yellow-300", icon: AlertTriangle, label:"Warning" },
  info:     { style:"bg-blue-500/10 border-blue-500/20 text-blue-300", icon: Info, label:"Info" },
};

export default function Notifications() {
  const [notifs, setNotifs]   = useState([]);
  const [msgs, setMsgs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("notifications");
  const [saving, setSaving]   = useState(false);

  const load = async () => {
    setLoading(true);
    try { const d=await adminApi.notifications(); setNotifs(d.notifications||[]); setMsgs(d.support_messages||[]); }
    catch(e){ console.error(e); }
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const markRead = async (id) => {
    try { await adminApi.markRead(id); setNotifs(ns=>ns.map(n=>n.id===id?{...n,read_by_unish:true}:n)); }
    catch(e){ console.error(e); }
  };

  const markAll = async () => {
    setSaving(true);
    try { await adminApi.markAllRead(); setNotifs(ns=>ns.map(n=>({...n,read_by_unish:true}))); }
    catch(e){ alert(e.message); }
    setSaving(false);
  };

  const del = async (id) => {
    try { await adminApi.deleteNotif(id); setNotifs(ns=>ns.filter(n=>n.id!==id)); }
    catch(e){ console.error(e); }
  };

  const resolveSupport = async (id) => {
    try { await adminApi.resolveSupport(id); setMsgs(ms=>ms.map(m=>m.id===id?{...m,status:"resolved"}:m)); }
    catch(e){ console.error(e); }
  };

  const unread = notifs.filter(n=>!n.read_by_unish).length;
  const openMsgs = msgs.filter(m=>m.status!=="resolved").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-400 text-sm mt-1">{unread} unread · {openMsgs} open support messages</p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAll} disabled={saving||unread===0} className="flex items-center gap-2 px-3 py-2 rounded-lg np-bg-card border np-border text-gray-400 hover:text-white text-sm disabled:opacity-40 transition-colors">
            <CheckCheck className="w-4 h-4"/> Mark all read
          </button>
          <button onClick={load} className="p-2 rounded-lg np-bg-card border np-border text-gray-400 hover:text-white transition-colors"><RefreshCw className="w-4 h-4"/></button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[["Total",notifs.length,"text-white"],["Unread",unread,"text-yellow-400"],["Open Support",openMsgs,"text-red-400"]].map(([l,v,c])=>(
          <div key={l} className="np-bg-card border np-border rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
            <p className="text-gray-500 text-xs mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {[["notifications","Notifications",notifs.length],["support","Support Messages",msgs.length]].map(([t,l,cnt])=>(
          <button key={t} onClick={()=>setTab(t)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===t?"bg-indigo-600 text-white":"np-bg-card border np-border text-gray-400 hover:text-white"}`}>
            {l} {cnt > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-xs">{cnt}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : tab === "notifications" ? (
        notifs.length === 0 ? (
          <div className="np-bg-card border np-border rounded-xl p-12 text-center">
            <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3"/>
            <p className="text-gray-400">No notifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map(n => {
              const cfg = SEV[n.severity] || SEV.info;
              const Icon = cfg.icon;
              return (
                <div key={n.id} className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${cfg.style} ${!n.read_by_unish?"ring-1 ring-current/20":""}`}>
                  <Icon className="w-4 h-4 shrink-0 mt-0.5"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold uppercase">{cfg.label}</span>
                      {!n.read_by_unish && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"/>}
                    </div>
                    <p className="text-sm text-gray-200">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(n.created_date).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!n.read_by_unish && <button onClick={()=>markRead(n.id)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Mark read"><CheckCircle className="w-3.5 h-3.5"/></button>}
                    <button onClick={()=>del(n.id)} className="p-1.5 rounded-lg hover:bg-white/10 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        msgs.length === 0 ? (
          <div className="np-bg-card border np-border rounded-xl p-12 text-center">
            <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-3"/>
            <p className="text-gray-400">No support messages</p>
          </div>
        ) : (
          <div className="space-y-2">
            {msgs.map(m => (
              <div key={m.id} className={`flex items-start gap-3 p-4 rounded-xl border ${m.status==="resolved"?"border-white/10 opacity-60 bg-white/2":"np-bg-card np-border"}`}>
                <MessageSquare className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white text-sm font-medium">{m.guild_name||m.guild_id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.status==="resolved"?"bg-emerald-500/15 text-emerald-400":"bg-yellow-500/15 text-yellow-400"}`}>{m.status||"open"}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{m.message}</p>
                  <p className="text-gray-500 text-xs mt-1">{new Date(m.created_date).toLocaleString()}</p>
                </div>
                {m.status !== "resolved" && (
                  <button onClick={()=>resolveSupport(m.id)} className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-colors">Resolve</button>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
