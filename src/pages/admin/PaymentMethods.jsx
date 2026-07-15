import React, { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { Plus, Edit2, Trash2, X, RefreshCw, CreditCard, QrCode } from "lucide-react";

export default function PaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ name:"", description:"", account_number:"", account_name:"", qr_image_url:"", active:true });

  const load = async () => { setLoading(true); try { const d=await adminApi.paymentMethods(); setMethods(d.payment_methods||[]); } catch(e){ console.error(e); } setLoading(false); };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm({name:"",description:"",account_number:"",account_name:"",qr_image_url:"",active:true}); setEditId(null); setModal("edit"); };
  const openEdit = (m) => { setForm({name:m.name,description:m.description||"",account_number:m.account_number||"",account_name:m.account_name||"",qr_image_url:m.qr_image_url||"",active:m.active!==false}); setEditId(m.id); setModal("edit"); };

  const save = async () => {
    if (!form.name) return alert("Name required");
    setSaving(true);
    try { if (editId) await adminApi.updatePM(editId,form); else await adminApi.createPM(form); await load(); setModal(null); }
    catch(e){ alert(e.message); }
    setSaving(false);
  };

  const del = async (m) => { if (!confirm(`Delete "${m.name}"?`)) return; try { await adminApi.deletePM(m.id); await load(); } catch(e){ alert(e.message); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Payment Methods</h1><p className="text-gray-400 text-sm mt-1">Configure how server owners pay</p></div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg np-bg-card border np-border text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4"/></button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"><Plus className="w-4 h-4"/> Add Method</button>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
      : methods.length === 0 ? (
        <div className="np-bg-card border np-border rounded-xl p-12 text-center">
          <CreditCard className="w-10 h-10 text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400">No payment methods yet.</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Add Method</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {methods.map(m => (
            <div key={m.id} className={`np-bg-card border rounded-xl p-5 space-y-3 ${m.active?"np-border":"border-white/5 opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center"><CreditCard className="w-4 h-4 text-indigo-400"/></div>
                  <div>
                    <p className="text-white font-semibold">{m.name}</p>
                    <p className={`text-xs ${m.active?"text-emerald-400":"text-gray-600"}`}>{m.active?"● Active":"○ Inactive"}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>openEdit(m)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"><Edit2 className="w-3.5 h-3.5"/></button>
                  <button onClick={()=>del(m)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
              {m.description && <p className="text-gray-400 text-xs">{m.description}</p>}
              {m.account_name && <div className="np-bg-base rounded-lg p-2.5"><p className="text-[10px] text-gray-500 mb-0.5">Account Name</p><p className="text-white text-xs font-medium">{m.account_name}</p></div>}
              {m.account_number && <div className="np-bg-base rounded-lg p-2.5"><p className="text-[10px] text-gray-500 mb-0.5">Account / Phone</p><p className="text-white text-xs font-mono">{m.account_number}</p></div>}
              {m.qr_image_url && (
                <div className="np-bg-base rounded-lg p-2.5 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-gray-400 shrink-0"/>
                  <a href={m.qr_image_url} target="_blank" rel="noreferrer" className="text-indigo-400 text-xs underline truncate">View QR Code</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal === "edit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="np-bg-card border np-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-white">{editId?"Edit":"Add"} Payment Method</h2><button onClick={()=>setModal(null)} className="text-gray-500 hover:text-white">✕</button></div>
            {[{label:"Name *",key:"name",placeholder:"e.g. eSewa"},{label:"Description",key:"description",placeholder:"e.g. Mobile wallet"},{label:"Account Name",key:"account_name",placeholder:"Registered name"},{label:"Account Number / Phone",key:"account_number",placeholder:"9800000000"},{label:"QR Code Image URL",key:"qr_image_url",placeholder:"https://..."}].map(f=>(
              <div key={f.key}>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">{f.label}</label>
                <input value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 rounded-lg np-bg-base border np-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"/>
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
