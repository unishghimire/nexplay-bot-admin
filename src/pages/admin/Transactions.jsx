import React, { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Filter, Eye } from "lucide-react";

const STATUS_STYLES = {
  pending:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function Transactions() {
  const [txns, setTxns]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [selected, setSelected] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [saving, setSaving]     = useState(false);
  const [modal, setModal]       = useState(null);

  const load = async (f = filter) => {
    setLoading(true);
    try { const d = await adminApi.transactions(f); setTxns(d.transactions||[]); }
    catch(e){ console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const changeFilter = (f) => { setFilter(f); load(f); };

  const approve = async (t) => {
    setSaving(true);
    try {
      await adminApi.approveTransaction(t.id, "Approved by admin", t.guild_id, t.guild_name, t.plan_name);
      setModal(null); setSelected(null); await load(filter);
    } catch(e){ alert(e.message); }
    setSaving(false);
  };

  const reject = async (t) => {
    if (!rejectNote) { alert("Rejection reason required"); return; }
    setSaving(true);
    try { await adminApi.rejectTransaction(t.id, rejectNote); setModal(null); setRejectNote(""); await load(filter); }
    catch(e){ alert(e.message); }
    setSaving(false);
  };

  const pending = txns.filter(t => t.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400 text-sm mt-1">{pending.length > 0 ? `${pending.length} pending review` : "All payments"}</p>
        </div>
        <button onClick={()=>load(filter)} className="p-2 rounded-lg np-bg-card border np-border text-gray-400 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4"/>
        </button>
      </div>

      {/* Pending banner */}
      {pending.length > 0 && filter !== "pending" && (
        <div onClick={()=>changeFilter("pending")} className="cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          <AlertCircle className="w-5 h-5 shrink-0"/>
          <span className="text-sm font-medium">{pending.length} payment{pending.length>1?"s":""} waiting for review</span>
          <span className="ml-auto text-xs underline">View →</span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {["all","pending","approved","rejected"].map(f => (
          <button key={f} onClick={()=>changeFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter===f?"bg-indigo-600 text-white":"np-bg-card border np-border text-gray-400 hover:text-white"}`}>{f}</button>
        ))}
      </div>

      {/* Table */}
      <div className="np-bg-card border np-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b np-border text-xs text-gray-500 uppercase">
                {["Server","Plan","Amount","Method","TX ID","Submitted","Status","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"/></td></tr>
              ) : txns.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-500">No transactions found</td></tr>
              ) : txns.map(t => (
                <tr key={t.id} className="border-b np-border hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{t.guild_name}</td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{t.plan_name}</td>
                  <td className="px-4 py-3 text-emerald-400 font-bold whitespace-nowrap">NPR {t.amount}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{t.payment_method||"—"}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">{t.transaction_id}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{t.submitted_at?new Date(t.submitted_at).toLocaleDateString():"—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${STATUS_STYLES[t.status]||STATUS_STYLES.pending}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button onClick={()=>{setSelected(t);setModal("detail");}} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" title="View"><Eye className="w-3.5 h-3.5"/></button>
                      {t.status === "pending" && (
                        <>
                          <button onClick={()=>approve(t)} disabled={saving} className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Approve"><CheckCircle className="w-3.5 h-3.5"/></button>
                          <button onClick={()=>{setSelected(t);setRejectNote("");setModal("reject");}} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Reject"><XCircle className="w-3.5 h-3.5"/></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {modal === "detail" && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="np-bg-card border np-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Payment Detail</h3>
              <button onClick={()=>setModal(null)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {[["Server",selected.guild_name],["Plan",selected.plan_name],["Amount",`NPR ${selected.amount}`],["Method",selected.payment_method||"—"],["TX ID",selected.transaction_id],["Status",selected.status],["Submitted",selected.submitted_at?new Date(selected.submitted_at).toLocaleString():"—"],["Reviewed",selected.reviewed_at?new Date(selected.reviewed_at).toLocaleString():"—"]].map(([k,v])=>(
                <div key={k} className="np-bg-base rounded-lg p-2.5">
                  <p className="text-gray-500 text-[10px] uppercase mb-0.5">{k}</p>
                  <p className="text-white font-medium break-all">{v}</p>
                </div>
              ))}
            </div>
            {selected.notes && <div className="p-3 rounded-lg bg-white/5"><p className="text-gray-400 text-xs"><span className="text-gray-500">Notes:</span> {selected.notes}</p></div>}
            {selected.screenshot_base64 && (
              <div>
                <p className="text-gray-500 text-xs mb-2">Payment Screenshot</p>
                <img src={`data:image/jpeg;base64,${selected.screenshot_base64}`} alt="Screenshot" className="w-full rounded-lg border np-border max-h-48 object-contain"/>
              </div>
            )}
            {selected.status === "pending" && (
              <div className="flex gap-3 pt-2">
                <button onClick={()=>{setModal("reject");setRejectNote("");}} className="flex-1 py-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 text-sm">Reject</button>
                <button onClick={()=>approve(selected)} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">{saving?"Approving…":"Approve"}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject modal */}
      {modal === "reject" && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="np-bg-card border np-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="text-white font-bold text-lg">Reject Payment</h3>
            <p className="text-gray-400 text-sm">From <span className="text-white font-medium">{selected.guild_name}</span> for {selected.plan_name}</p>
            <textarea value={rejectNote} onChange={e=>setRejectNote(e.target.value)} placeholder="Reason for rejection (required)..." rows={3}
              className="w-full px-3 py-2 rounded-lg np-bg-base border np-border text-white text-sm placeholder-gray-600 focus:outline-none resize-none"/>
            <div className="flex gap-3">
              <button onClick={()=>setModal("detail")} className="flex-1 py-2.5 rounded-xl np-bg-base border np-border text-gray-400 text-sm">Cancel</button>
              <button onClick={()=>reject(selected)} disabled={saving||!rejectNote} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50">{saving?"Saving…":"Reject"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
