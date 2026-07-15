import React, { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { Plus, Edit2, Trash2, RefreshCw, Tag, Copy, Check } from "lucide-react";

export default function PromoCodes() {
  const [codes, setCodes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);
  const [form, setForm]     = useState({ code:"", discount_percent:10, max_uses:100, expires_at:"", active:true });

  const load = async () => { setLoading(true); try { const d=await adminApi.promoCodes(); setCodes(d.promo_codes||[]); } catch(e){ console.error(e); } setLoading(false); };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm({code:"",discount_percent:10,max_uses:100,expires_at:"",active:true}); setEditId(null); setModal("edit"); };
  const openEdit = (c) => { setForm({code:c.code,discount_percent:c.discount_percent,max_uses:c.max_uses,expires_at:c.expires_at?c.expires_at.split("T")[0]:"",active:c.active!==false}); setEditId(c.id); setModal("edit"); };

  const save = async () => {
    if (!form.code) return alert("Code required");
    setSaving(true);
    const data = {...form, expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null};
    try { if(editId) await adminApi.updatePromo(editId,data); else await adminApi.createPromo(data); await load(); setModal(null); }
    catch(e){ alert(e.message); }
    setSaving(false);
  };

  const del = async (c) => { if(!confirm(`Delete "${c.code}"?`)) return; try { await adminApi.deletePromo(c.id); await load(); } catch(e){ alert(e.message); } };

  const copy = async (code) => { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(()=>setCopied(null),2000); };

  const isExpired = (c) => c.expires_at && new Date(c.expires_at) < new Date();
  const usagePct  = (c) => c.max_uses > 0 ? Math.min(100, Math.round((c.used_count||0)/c.max_uses*100)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Promo Codes</h1><p className="text-gray-400 text-sm mt-1">Manage discount codes</p></div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg np-bg-card border np-border text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4"/></button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"><Plus className="w-4 h-4"/> Add Code</button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
      : codes.length === 0 ? (
        <div className="np-bg-card border np-border rounded-xl p-12 text-center">
          <Tag className="w-10 h-10 text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400">No promo codes yet.</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Add Code</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {codes.map(c => {
            const expired = isExpired(c);
            const pct = usagePct(c);
            return (
              <div key={c.id} className={`np-bg-card border rounded-xl p-5 space-y-3 transition-all ${!c.active||expired?"border-white/5 opacity-60":"np-border"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold font-mono text-lg">{c.code}</p>
                      <button onClick={()=>copy(c.code)} className="text-gray-500 hover:text-white transition-colors">
                        {copied===c.code ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5"/>}
                      </button>
                    </div>
                    <p className="text-indigo-400 font-semibold text-sm">{c.discount_percent}% off</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={()=>openEdit(c)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"><Edit2 className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>del(c)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
                {/* Usage bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Usage</span>
                    <span className="text-white">{c.used_count||0} / {c.max_uses}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct>=90?"bg-red-500":pct>=50?"bg-yellow-500":"bg-indigo-500"}`} style={{width:`${pct}%`}}/>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  {c.expires_at ? (
                    <span className={expired?"text-red-400":"text-gray-400"}>
                      {expired?"Expired":"Expires"}: {new Date(c.expires_at).toLocaleDateString()}
                    </span>
                  ) : <span className="text-gray-500">No expiry</span>}
                  <span className={`font-semibold ${c.active&&!expired?"text-emerald-400":"text-gray-600"}`}>{c.active&&!expired?"● Active":"○ Inactive"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal === "edit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="np-bg-card border np-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-white">{editId?"Edit":"Add"} Promo Code</h2><button onClick={()=>setModal(null)} className="text-gray-500 hover:text-white">✕</button></div>
            {[{label:"Code *",key:"code",type:"text",placeholder:"NEXPLAY20"},{label:"Discount %",key:"discount_percent",type:"number"},{label:"Max Uses",key:"max_uses",type:"number"},{label:"Expires At",key:"expires_at",type:"date"}].map(f=>(
              <div key={f.key}>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:f.type==="number"?Number(e.target.value):e.target.value}))} placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 rounded-lg np-bg-base border np-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]"/>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Active</label>
              <button onClick={()=>setForm(f=>({...f,active:!f.active}))} className={`w-11 h-6 rounded-full transition-colors relative ${form.active?"bg-indigo-600":"bg-gray-700"}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${form.active?"left-5":"left-0.5"}`}/>
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setModal(null)} className="flex-1 py-2.5 rounded-xl np-bg-base border np-border text-gray-400 text-sm">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50">{saving?"Saving…":editId?"Update":"Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
