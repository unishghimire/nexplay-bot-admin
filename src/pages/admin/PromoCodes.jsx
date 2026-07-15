import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Copy, Trash2, Check, Edit2, AlertCircle } from "lucide-react";

export default function PromoCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null); // null means adding new code
  const [formData, setFormData] = useState({
    code: "",
    discount_percent: 10,
    max_uses: 100,
    expires_at: "",
    active: true
  });
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.PromoCode.list("-created_date", 100);
      setCodes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copyCode = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const toggleActive = async (item) => {
    try {
      await base44.entities.PromoCode.update(item.id, { active: !item.active });
      setCodes((prev) => prev.map((c) => (c.id === item.id ? { ...c, active: !c.active } : c)));
      toast.success(`Promo code ${!item.active ? "activated" : "deactivated"}`);
    } catch (e) {
      toast.error("Failed to toggle status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promo code?")) return;
    try {
      await base44.entities.PromoCode.delete(id);
      setCodes((prev) => prev.filter((c) => c.id !== id));
      toast.success("Promo code deleted");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const openAddModal = () => {
    setEditingCode(null);
    setFormData({
      code: "",
      discount_percent: 10,
      max_uses: 100,
      expires_at: "",
      active: true
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingCode(item);
    setFormData({
      code: item.code,
      discount_percent: item.discount_percent,
      max_uses: item.max_uses,
      expires_at: item.expires_at ? item.expires_at.split("T")[0] : "",
      active: item.active
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.code.trim()) {
      toast.error("Code is required");
      return;
    }
    try {
      if (editingCode) {
        await base44.entities.PromoCode.update(editingCode.id, formData);
        toast.success("Promo code updated");
      } else {
        await base44.entities.PromoCode.create(formData);
        toast.success("Promo code created");
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(`Failed to save promo code`);
    }
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-gray-700 rounded-full animate-spin" style={{ borderTopColor: "#FFD700" }} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Promo Codes"
        subtitle={`${codes.length} promo codes`}
        actions={
          <Button onClick={openAddModal} className="np-bg-gold text-black hover:brightness-110">
            <Plus className="w-4 h-4 mr-2" /> Create Promo Code
          </Button>
        }
      />

      <div className="np-bg-card rounded-xl border np-border overflow-hidden">
        <div className="overflow-x-auto np-scroll">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b np-border text-gray-500 bg-zinc-950/20">
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Code</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Discount</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Usage Progress (Used/Max)</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Expires</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Active</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {codes.map((c) => {
    const expired = isExpired(c.expires_at);
    const uses = c.used_count || 0;
    const max = c.max_uses || 0;
    const pct = max > 0 ? Math.min((uses / max) * 100, 100) : 0;

    return (
      <tr
        key={c.id}
        className={`hover:np-bg-card-hover transition-colors ${
          expired ? "opacity-40 bg-red-950/5" : ""
        }`}
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold np-text-gold tracking-wide text-base">{c.code}</span>
            <button
              onClick={() => copyCode(c.code, c.id)}
              className="text-gray-500 hover:np-text-gold transition-colors p-1 rounded hover:bg-zinc-850"
            >
              {copiedId === c.id ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            {expired && (
              <span className="flex items-center gap-1 text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-semibold">
                <AlertCircle className="w-3 h-3" /> Expired
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="text-white font-semibold text-sm bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
            {c.discount_percent}% OFF
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="max-w-[180px]">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-gray-400 font-medium">
                {uses} / {max}
              </span>
              <span className="text-gray-500 text-[10px]">{Math.round(pct)}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pct >= 100 ? "bg-red-500" : "bg-[#FFD700]"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-gray-400 font-medium text-xs">
          {c.expires_at ? new Date(c.expires_at).toLocaleDateString(undefined, { dateStyle: "medium" }) : "Unlimited"}
        </td>
        <td className="px-6 py-4">
          <Switch
            checked={c.active}
            onCheckedChange={() => toggleActive(c)}
            disabled={expired}
            className="data-[state=checked]:bg-[#FFD700]"
          />
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openEditModal(c)}
              className="text-gray-400 hover:text-white hover:bg-zinc-800 h-8 w-8"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDelete(c.id)}
              className="text-red-400 hover:bg-red-950/20 h-8 w-8"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  })}
            </tbody>
          </table>
        </div>
        {codes.length === 0 && (
          <div className="py-16 text-center text-gray-500 text-sm">
            No promo codes found
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="np-bg-card border-np-border text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {editingCode ? "Edit Promo Code" : "Create Promo Code"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Code</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="np-bg-base border-np-border text-white font-mono uppercase tracking-wider"
                placeholder="PROMO50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Discount %</label>
                <Input
                  type="number"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
                  className="np-bg-base border-np-border text-white"
                  min={1}
                  max={100}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Max Uses</label>
                <Input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: Number(e.target.value) })}
                  className="np-bg-base border-np-border text-white"
                  min={1}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Expires At</label>
              <Input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="np-bg-base border-np-border text-white"
              />
            </div>
            <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mt-2">
              <div>
                <label className="text-sm text-gray-300 font-semibold block">Active Status</label>
                <span className="text-[10px] text-gray-500">Allow users to redeem this promo code instantly</span>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                className="data-[state=checked]:bg-[#FFD700]"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end border-t border-zinc-800 pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-np-border text-white hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="np-bg-gold text-black hover:brightness-110"
            >
              {editingCode ? "Save Changes" : "Create Code"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
