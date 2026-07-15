import React, { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { RefreshCw, DollarSign, TrendingUp, CheckCircle, Clock } from "lucide-react";

const CHART_COLORS = ["#6366f1","#a855f7","#f59e0b","#10b981","#ef4444","#06b6d4"];

export default function Revenue() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [txFilter, setTxFilter] = useState("all");

  const load = async () => { setLoading(true); try { setData(await adminApi.revenue()); } catch(e){ console.error(e); } setLoading(false); };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!data) return null;

  const { total_revenue, mrr, transactions, monthly_revenue, revenue_by_plan } = data;
  const approved = transactions.filter(t=>t.status==="approved");
  const pending  = transactions.filter(t=>t.status==="pending");
  const filtered = txFilter==="all" ? transactions : transactions.filter(t=>t.status===txFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Revenue</h1><p className="text-gray-400 text-sm mt-1">Payment history & MRR tracking</p></div>
        <button onClick={load} className="p-2 rounded-lg np-bg-card border np-border text-gray-400 hover:text-white transition-colors"><RefreshCw className="w-4 h-4"/></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:"Total Revenue",val:`NPR ${total_revenue.toLocaleString()}`,icon:DollarSign,color:"text-emerald-400"},
          {label:"MRR",val:`NPR ${mrr.toLocaleString()}`,icon:TrendingUp,color:"text-indigo-400"},
          {label:"Approved",val:approved.length,icon:CheckCircle,color:"text-emerald-400"},
          {label:"Pending",val:pending.length,icon:Clock,color:"text-yellow-400"},
        ].map(s=>(
          <div key={s.label} className="np-bg-card border np-border rounded-xl p-4 flex items-center gap-3">
            <s.icon className={`w-6 h-6 ${s.color} shrink-0`}/>
            <div><p className="text-gray-500 text-xs">{s.label}</p><p className={`text-xl font-bold ${s.color}`}>{s.val}</p></div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Monthly Revenue */}
        <div className="np-bg-card border np-border rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Monthly Revenue (NPR)</h2>
          {monthly_revenue.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No approved payments yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthly_revenue} margin={{top:0,right:0,bottom:0,left:0}}>
                <XAxis dataKey="month" tick={{fill:"#6b7280",fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#6b7280",fontSize:10}} axisLine={false} tickLine={false} width={50}/>
                <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",color:"#fff"}} formatter={v=>[`NPR ${v}`,""]}/>
                <Bar dataKey="revenue" fill="#6366f1" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue by Plan */}
        <div className="np-bg-card border np-border rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Revenue by Plan</h2>
          {revenue_by_plan.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={revenue_by_plan} dataKey="revenue" nameKey="plan" cx="50%" cy="50%" outerRadius={60}>
                    {revenue_by_plan.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",color:"#fff"}} formatter={v=>[`NPR ${v}`,""]}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {revenue_by_plan.map((r,i)=>(
                  <div key={r.plan} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:CHART_COLORS[i%CHART_COLORS.length]}}/>
                    <span className="text-gray-400 truncate">{r.plan}</span>
                    <span className="text-white font-semibold ml-auto">NPR {r.revenue}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transaction ledger */}
      <div className="np-bg-card border np-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b np-border flex items-center justify-between">
          <h2 className="text-white font-semibold">All Transactions</h2>
          <div className="flex gap-1.5">
            {["all","approved","pending","rejected"].map(f=>(
              <button key={f} onClick={()=>setTxFilter(f)} className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-colors ${txFilter===f?"bg-indigo-600 text-white":"np-bg-base border np-border text-gray-400 hover:text-white"}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b np-border text-xs text-gray-500 uppercase">{["Server","Plan","Amount","Method","TX ID","Date","Status"].map(h=><th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-gray-500">No transactions</td></tr>
              : filtered.map(t=>(
                <tr key={t.id} className="border-b np-border hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{t.guild_name}</td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{t.plan_name}</td>
                  <td className="px-4 py-3 text-emerald-400 font-bold whitespace-nowrap">NPR {t.amount}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{t.payment_method||"—"}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">{t.transaction_id}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{t.submitted_at?new Date(t.submitted_at).toLocaleDateString():"—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${t.status==="approved"?"bg-emerald-500/15 text-emerald-400 border-emerald-500/30":t.status==="pending"?"bg-yellow-500/15 text-yellow-400 border-yellow-500/30":"bg-red-500/15 text-red-400 border-red-500/30"}`}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
