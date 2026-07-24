const ADMIN_API = "https://6a5226b5047f5c59d961130e.base44.app/api/apps/6a5226b5047f5c59d961130e/functions/adminApi";
const ADMIN_KEY = "nexplay-admin-2026";

async function req(action, params = {}, body = null, method = "GET") {
  const url = new URL(ADMIN_API);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const opts = {
    method: body ? "POST" : method,
    headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url.toString(), opts);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const adminApi = {
  // GET
  dashboard:       ()         => req("dashboard"),
  servers:         ()         => req("servers"),
  serverDetail:    (guild_id) => req("server_detail", { guild_id }),
  plans:           ()         => req("plans"),
  transactions:    (status)   => req("transactions", status && status !== "all" ? { status } : {}),
  paymentMethods:  ()         => req("payment_methods"),
  notifications:   ()         => req("notifications"),
  promoCodes:      ()         => req("promo_codes"),
  offers:          ()         => req("offers"),
  revenue:         ()         => req("revenue"),

  // Server actions
  updateServer:    (data)            => req("update_server",    {}, data),
  messageOwner:    (owner_id, message) => req("message_owner", {}, { owner_id, message }),

  // Transaction actions
  approveTransaction: (id, notes, guild_id, guild_name, plan_name) =>
    req("approve_transaction", {}, { id, notes, guild_id, guild_name, plan_name }),
  rejectTransaction: (id, notes) => req("reject_transaction", {}, { id, notes }),

  // Notification actions
  markRead:     (id)  => req("mark_notification_read", {}, { id }),
  markAllRead:  ()    => req("mark_all_read", {}, {}),
  deleteNotif:  (id)  => req("delete_notification", {}, { id }),
  resolveSupport: (id) => req("resolve_support", {}, { id }),

  // Plan CRUD
  createPlan:  (data)       => req("create_plan",  {}, data),
  updatePlan:  (id, data)   => req("update_plan",  {}, { id, ...data }),
  deletePlan:  (id)         => req("delete_plan",  {}, { id }),

  // PaymentMethod CRUD
  createPM:   (data)      => req("create_payment_method", {}, data),
  updatePM:   (id, data)  => req("update_payment_method", {}, { id, ...data }),
  deletePM:   (id)        => req("delete_payment_method", {}, { id }),

  // PromoCode CRUD
  createPromo: (data)      => req("create_promo", {}, data),
  updatePromo: (id, data)  => req("update_promo", {}, { id, ...data }),
  deletePromo: (id)        => req("delete_promo", {}, { id }),

  // Offer CRUD
  createOffer: (data)      => req("create_offer", {}, data),
  updateOffer: (id, data)  => req("update_offer", {}, { id, ...data }),
  deleteOffer: (id)        => req("delete_offer", {}, { id }),
};
