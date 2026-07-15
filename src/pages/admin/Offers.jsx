import React, { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { Plus, Edit2, Trash2, RefreshCw, Gift, Clock, Zap } from "lucide-react";

function offerStatus(o) {
  const now = Date.now();
  const start = o.starts_at ? new Date(o.starts_at).getTime() : 0;
  const end   = o.ends_at   ? new Date(o.ends_at).getTime()   : Infinity;
  if (!o.active) return "inactive";
  if (now < start) return "upcoming";
  if (now > end)   return "expired";
  return "active";
}

const STATUS_STYLES = {
  active:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  upcoming: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  expired:  "bg-gray-500/15 text-gray-400 border-gray-500/30",
  inactive: "bg-gray-500/15 text-gray-500 border-gray-500/20",
};

export default function Offers() {
  const [offers, setOffers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ title:"", description:"", discount_percent:0, starts_at:"", ends_at:"", active:true });

  const load = async () => { setLoading(true); try { const d=await adminApi.offers(); setOffers(d.offers||[]); } catch(e){ console.error(e); } setLoading(false); };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm({title:"",description:"",discount_percent:0,starts_at:"",ends_at:"",active:true}); setEditId(null); setModal("edit"); };
  const openEdit = (o) => { setForm({title:o.title,description:o.description||"",discount_percent:o.discount_percent||0,starts_at:o.starts_at?o.starts_at.split("T")[0]:"",ends_at:o.ends_at?o.ends_at.split("T")[0]:"",active:o.active!==false}); setEditId(o.id); setModal("edit"); };

  const save = async () => {
    if (!form.title) return alert("Title required");
    setSaving(true);
    const data = {...form, starts_at:form.starts_at?new Date(form.starts_at).toISOString():null, ends_at:form.ends_at?new Date(form.ends_at).toISOString():null};
    try { if(editId) await adminApi.updateOffer(editId,data); else await adminApi.createOffer(data); await load(); setModal(null); }
    catch(e){ alert(e.message); }
    setSaving(false);
  };

  const del = async (o) => { if(!confirm(`Delete "${o.title}"?`)) return; try { await adminApi.deleteOffer(o.id); await load(); } catch(e){ alert(e.message); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Offers</h1><p className="text-gray-400 text-sm mt-1">Limited time deals & promotions</p></div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg np-bg-card border np-border text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4"/></button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"><Plus className="w-4 h-4"/> Add Offer</button>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
      : offers.length === 0 ? (
        <div className="np-bg-card border np-border rounded-xl p-12 text-center">
          <Gift className="w-10 h-10 text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400">No offers yet.</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Add Offer</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {offers.map(o => {
            const status = offerStatus(o);
            return (
              <div key={o.id} className={`np-bg-card border rounded-xl p-5 space-y-3 relative overflow-hidden ${status==="active"?"np-border ring-1 ring-emerald-500/20":"border-white/5 opacity-70"}`}>
                {status === "active" && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2"/>}
                <div className="flex items-start justify-between relative">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {status === "active" && <Zap className="w-4 h-4 text-emerald-400"/>}
                      <p className="text-white font-bold">{o.title}</p>
                    </div>
                    {o.discount_percent > 0 && <p className="text-2xl font-bold text-indigo-400">{o.discount_percent}% off</p>}
                  </div>
                  <div className="flex items-start gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${STATUS_STYLES[status]}`}>{status}</span>
                    <button onClick={()=>openEdit(o)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"><Edit2 className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>del(o)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
                {o.description && <p className="text-gray-400 text-sm">{o.description}</p>}
                {(o.starts_at || o.ends_at) && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5 shrink-0"/>
                    <span>{o.starts_at?new Date(o.starts_at).toLocaleDateString():"—"} → {o.ends_at?new Date(o.ends_at).toLocaleDateString():"No end"}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal === "edit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="np-bg-card border np-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-white">{editId?"Edit":"Add"} Offer</h2><button onClick={()=>setModal(null)} className="text-gray-500 hover:text-white">✕</button></div>
            {[{label:"Title *",key:"title",type:"text",placeholder:"e.g. Launch Special"},{label:"Description",key:"description",type:"text",placeholder:"Short promo description"},{label:"Discount %",key:"discount_percent",type:"number"},{label:"Starts At",key:"starts_at",type:"date"},{label:"Ends At",key:"ends_at",type:"date"}].map(f=>(
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
