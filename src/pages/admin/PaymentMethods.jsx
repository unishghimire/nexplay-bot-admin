import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, CreditCard, QrCode } from "lucide-react";

const EMPTY = { name: "", description: "", account_number: "", account_name: "", qr_image_url: "", active: true };

export default function PaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null); // null | 'add' | 'edit'
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [editId, setEditId]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.PaymentMethod.list("-created_date", 100);
      setMethods(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal("edit"); };
  const openEdit = (m) => { setForm({ name: m.name, description: m.description || "", account_number: m.account_number || "", account_name: m.account_name || "", qr_image_url: m.qr_image_url || "", active: m.active !== false }); setEditId(m.id); setModal("edit"); };

  const save = async () => {
    if (!form.name) { alert("Name is required."); return; }
    setSaving(true);
    try {
      if (editId) {
        await base44.entities.PaymentMethod.update(editId, form);
      } else {
        await base44.entities.PaymentMethod.create(form);
      }
      await load();
      setModal(null);
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const toggleActive = async (m) => {
    await base44.entities.PaymentMethod.update(m.id, { active: !m.active });
    await load();
  };

  const del = async (m) => {
    if (!confirm(`Delete "${m.name}"? This cannot be undone.`)) return;
    await base44.entities.PaymentMethod.delete(m.id);
    await load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Methods</h1>
          <p className="text-gray-400 text-sm mt-1">Configure payment options shown to server owners</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4"/> Add Method
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : methods.length === 0 ? (
        <div className="np-bg-card border np-border rounded-xl p-12 text-center">
          <CreditCard className="w-10 h-10 text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400 font-medium">No payment methods yet</p>
          <p className="text-gray-600 text-sm mt-1">Add eSewa, Khalti, bank details, etc.</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
            Add First Method
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {methods.map(m => (
            <div key={m.id} className={`np-bg-card border rounded-xl p-5 transition-all ${m.active ? "np-border" : "border-white/5 opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-indigo-400"/>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{m.name}</p>
                    <span className={`text-xs font-medium ${m.active ? "text-emerald-400" : "text-gray-500"}`}>
                      {m.active ? "● Active" : "○ Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                    <Edit2 className="w-3.5 h-3.5"/>
                  </button>
                  <button onClick={() => toggleActive(m)} className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-600/10 transition-colors">
                    {m.active ? <ToggleRight className="w-4 h-4"/> : <ToggleLeft className="w-4 h-4"/>}
                  </button>
                  <button onClick={() => del(m)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>

              {m.description && <p className="text-gray-400 text-xs mb-3">{m.description}</p>}

              <div className="space-y-1.5 text-xs">
                {m.account_name   && <div className="flex gap-2"><span className="text-gray-500 w-24">Account Name</span><span className="text-gray-200">{m.account_name}</span></div>}
                {m.account_number && <div className="flex gap-2"><span className="text-gray-500 w-24">Account No.</span><span className="text-gray-200 font-mono">{m.account_number}</span></div>}
              </div>

              {m.qr_image_url && (
                <div className="mt-3 pt-3 border-t np-border">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2"><QrCode className="w-3 h-3"/> QR Code</div>
                  <img src={m.qr_image_url} alt="QR" className="w-24 h-24 rounded-lg border np-border object-contain bg-white p-1"/>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal === "edit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="np-bg-card border np-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-5 border-b np-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editId ? "Edit" : "Add"} Payment Method</h2>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Method Name *", key: "name",           placeholder: "e.g. eSewa, Khalti, Bank Transfer" },
                { label: "Description",   key: "description",    placeholder: "Short description..." },
                { label: "Account Name",  key: "account_name",   placeholder: "Unish Ghimire" },
                { label: "Account Number/ID", key: "account_number", placeholder: "9841234567" },
                { label: "QR Code Image URL", key: "qr_image_url",   placeholder: "https://..." },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">{f.label}</label>
                  <input
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-lg np-bg-base border np-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Active</label>
                <button onClick={() => setForm(p => ({ ...p, active: !p.active }))}
                  className={`w-11 h-6 rounded-full transition-colors ${form.active ? "bg-indigo-600" : "bg-gray-700"} relative`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${form.active ? "left-5" : "left-0.5"}`}/>
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl np-bg-base border np-border text-gray-400 text-sm font-medium hover:text-white transition-colors">Cancel</button>
                <button onClick={save} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                  {saving ? "Saving…" : editId ? "Update" : "Add Method"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
