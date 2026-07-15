import React, { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { Plus, Edit2, Trash2, Check, X, RefreshCw, Trophy } from "lucide-react";

const PLAN_COLORS = { "Free Trial":"text-gray-400", "Starter":"text-indigo-400", "Pro":"text-purple-400", "Elite":"text-yellow-400" };

export default function Plans() {
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ name:"", monthly_price:0, yearly_price:0, tournament_limit:10, features:[], active:true });
  const [featInput, setFeatInput] = useState("");

  const load = async () => {
    setLoading(true);
    try { const d = await adminApi.plans(); setPlans(d.plans||[]); }
    catch(e){ console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm({name:"",monthly_price:0,yearly_price:0,tournament_limit:10,features:[],active:true}); setEditId(null); setModal("edit"); };
  const openEdit = (p) => { setForm({name:p.name,monthly_price:p.monthly_price,yearly_price:p.yearly_price,tournament_limit:p.tournament_limit,features:p.features||[],active:p.active!==false}); setEditId(p.id); setModal("edit"); };

  const save = async () => {
    if (!form.name) return alert("Name required");
    setSaving(true);
    try {
      if (editId) await adminApi.updatePlan(editId, form);
      else await adminApi.createPlan(form);
      await load(); setModal(null);
    } catch(e){ alert(e.message); }
    setSaving(false);
  };

  const del = async (p) => {
    if (!confirm(`Delete plan "${p.name}"?`)) return;
    try { await adminApi.deletePlan(p.id); await load(); }
    catch(e){ alert(e.message); }
  };

  const addFeature = () => { if (featInput.trim()) { setForm(f=>({...f,features:[...f.features,featInput.trim()]})); setFeatInput(""); } };
  const removeFeature = (i) => setForm(f=>({...f,features:f.features.filter((_,j)=>j!==i)}));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Plans</h1><p className="text-gray-400 text-sm mt-1">Manage subscription tiers</p></div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg np-bg-card border np-border text-gray-400 hover:text-white transition-colors"><RefreshCw className="w-4 h-4"/></button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"><Plus className="w-4 h-4"/> Add Plan</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : plans.length === 0 ? (
        <div className="np-bg-card border np-border rounded-xl p-12 text-center">
          <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400">No plans yet. Add your first plan.</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Add Plan</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map(p => (
            <div key={p.id} className={`np-bg-card border rounded-xl p-5 flex flex-col transition-all ${p.active?"np-border":"border-white/5 opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className={`text-lg font-bold ${PLAN_COLORS[p.name]||"text-white"}`}>{p.name}</p>
                  <p className="text-2xl font-bold text-white mt-1">NPR {p.monthly_price}<span className="text-gray-500 text-sm font-normal">/mo</span></p>
                  {p.yearly_price > 0 && <p className="text-gray-500 text-xs">NPR {p.yearly_price}/yr</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>openEdit(p)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"><Edit2 className="w-3.5 h-3.5"/></button>
                  <button onClick={()=>del(p)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2">Up to <span className="text-white font-semibold">{p.tournament_limit === 999 ? "Unlimited" : p.tournament_limit}</span> tournaments</p>
              <div className="flex-1 space-y-1.5">
                {(p.features||[]).map((f,i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5"/>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t np-border">
                <span className={`text-xs font-semibold ${p.active?"text-emerald-400":"text-gray-600"}`}>{p.active?"● Active":"○ Inactive"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {modal === "edit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="np-bg-card border np-border rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b np-border flex items-center justify-between sticky top-0 np-bg-card">
              <h2 className="text-lg font-bold text-white">{editId?"Edit":"Add"} Plan</h2>
              <button onClick={()=>setModal(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                {label:"Plan Name *", key:"name", type:"text", placeholder:"e.g. Pro"},
                {label:"Monthly Price (NPR)", key:"monthly_price", type:"number"},
                {label:"Yearly Price (NPR)", key:"yearly_price", type:"number"},
                {label:"Tournament Limit", key:"tournament_limit", type:"number", placeholder:"999 for unlimited"},
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:f.type==="number"?Number(e.target.value):e.target.value}))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-lg np-bg-base border np-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"/>
                </div>
              ))}
              {/* Features */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Features</label>
                <div className="space-y-1.5 mb-2">
                  {form.features.map((f,i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                      <span className="text-gray-300 text-sm flex-1">{f}</span>
                      <button onClick={()=>removeFeature(i)} className="text-red-400 hover:text-red-300"><X className="w-3.5 h-3.5"/></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={featInput} onChange={e=>setFeatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFeature()}
                    placeholder="Add feature..." className="flex-1 px-3 py-2 rounded-lg np-bg-base border np-border text-white text-sm placeholder-gray-600 focus:outline-none"/>
                  <button onClick={addFeature} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm"><Plus className="w-4 h-4"/></button>
                </div>
              </div>
              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Active</label>
                <button onClick={()=>setForm(f=>({...f,active:!f.active}))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${form.active?"bg-indigo-600":"bg-gray-700"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${form.active?"left-5":"left-0.5"}`}/>
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setModal(null)} className="flex-1 py-2.5 rounded-xl np-bg-base border np-border text-gray-400 text-sm">Cancel</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50">
                  {saving?"Saving…":editId?"Update":"Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
