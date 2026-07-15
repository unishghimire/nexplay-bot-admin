import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Calendar, Percent, CheckCircle2 } from "lucide-react";

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null); // null means adding new offer
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_percent: 0,
    starts_at: "",
    ends_at: "",
    active: true
  });

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.Offer.list("-created_date", 100);
      setOffers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (offer) => {
    try {
      await base44.entities.Offer.update(offer.id, { active: !offer.active });
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, active: !o.active } : o)));
      toast.success(`Offer ${!offer.active ? "activated" : "deactivated"}`);
    } catch (e) {
      toast.error("Failed to toggle status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;
    try {
      await base44.entities.Offer.delete(id);
      setOffers((prev) => prev.filter((o) => o.id !== id));
      toast.success("Offer deleted");
    } catch (e) {
      toast.error("Failed to delete offer");
    }
  };

  const openAddModal = () => {
    setEditingOffer(null);
    setFormData({
      title: "",
      description: "",
      discount_percent: 10,
      starts_at: "",
      ends_at: "",
      active: true
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingOffer(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      discount_percent: item.discount_percent,
      starts_at: item.starts_at ? item.starts_at.split("T")[0] : "",
      ends_at: item.ends_at ? item.ends_at.split("T")[0] : "",
      active: item.active
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      if (editingOffer) {
        await base44.entities.Offer.update(editingOffer.id, formData);
        toast.success("Offer updated successfully");
      } else {
        await base44.entities.Offer.create(formData);
        toast.success("Offer created successfully");
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error("Failed to save offer");
    }
  };

  const isCurrentlyActive = (offer) => {
    if (!offer.active) return false;
    const now = new Date();
    const start = offer.starts_at ? new Date(offer.starts_at) : null;
    const end = offer.ends_at ? new Date(offer.ends_at) : null;

    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
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
        title="Offers"
        subtitle={`${offers.length} promotional offers`}
        actions={
          <Button onClick={openAddModal} className="np-bg-gold text-black hover:brightness-110">
            <Plus className="w-4 h-4 mr-2" /> Create Offer
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {offers.map((o) => {
          const isActiveLive = isCurrentlyActive(o);

          return (
            <div
              key={o.id}
              className={`np-bg-card rounded-xl border p-5 flex flex-col justify-between transition-all relative ${
                isActiveLive
                  ? "border-2 border-[#FFD700] shadow-lg shadow-[#FFD700]/5 scale-[1.01]"
                  : "np-border border-zinc-800"
              }`}
            >
              {isActiveLive && (
                <div className="absolute -top-3 left-4 bg-[#FFD700] text-black text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider shadow">
                  <CheckCircle2 className="w-3 h-3" /> Live & Active
                </div>
              )}

              <div>
                <div className="flex justify-between items-start gap-3 mb-3">
                  <h3 className="font-bold text-white text-lg group-hover:np-text-gold transition-colors">
                    {o.title}
                  </h3>
                  <span className="flex items-center gap-1 text-xs font-bold bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] px-2 py-1 rounded-lg">
                    <Percent className="w-3 h-3" /> {o.discount_percent}% OFF
                  </span>
                </div>

                <p className="text-gray-400 text-sm line-clamp-3 mb-4 min-h-[60px]">
                  {o.description || "No description provided."}
                </p>

                <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-lg flex items-center gap-2.5 text-xs text-gray-500 mb-5">
                  <Calendar className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-600 uppercase font-semibold block tracking-wide">Campaign Period</span>
                    <span className="font-medium text-gray-300">
                      {o.starts_at ? new Date(o.starts_at).toLocaleDateString() : "Anytime"}
                    </span>
                    <span className="mx-1.5 text-zinc-700">–</span>
                    <span className="font-medium text-gray-300">
                      {o.ends_at ? new Date(o.ends_at).toLocaleDateString() : "Forever"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-4 mt-auto">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={o.active}
                    onCheckedChange={() => toggleActive(o)}
                    className="data-[state=checked]:bg-[#FFD700]"
                  />
                  <span className={`text-xs font-semibold ${o.active ? "text-emerald-400" : "text-gray-500"}`}>
                    {o.active ? "Enabled" : "Disabled"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEditModal(o)}
                    className="text-gray-400 hover:text-white hover:bg-zinc-800 h-8 w-8"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(o.id)}
                    className="text-red-400 hover:bg-red-950/20 h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {offers.length === 0 && (
        <div className="np-bg-card rounded-xl border np-border py-20 text-center text-gray-500 text-sm">
          No offers found. Click "Create Offer" to start a new promotion.
        </div>
      )}

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="np-bg-card border-np-border text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {editingOffer ? "Edit Offer" : "Create Promotional Offer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Offer Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="np-bg-base border-np-border text-white"
                placeholder="Summer Championship Special"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="np-bg-base border-np-border text-white"
                rows={3}
                placeholder="Give details about this promotional offer..."
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Discount Percent (%)</label>
              <Input
                type="number"
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
                className="np-bg-base border-np-border text-white"
                min={1}
                max={100}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Starts At</label>
                <Input
                  type="date"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  className="np-bg-base border-np-border text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Ends At</label>
                <Input
                  type="date"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                  className="np-bg-base border-np-border text-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mt-2">
              <div>
                <label className="text-sm text-gray-300 font-semibold block">Active Status</label>
                <span className="text-[10px] text-gray-500">Allow this offer to display and activate on selected servers</span>
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
              {editingOffer ? "Save Changes" : "Create Offer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
