import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

import { C, GLOBAL_CSS, ORDER_FILTERS } from "./constants";
import { Btn } from "./AdminPrimitives";
import { LoginGate } from "./LoginGate";
import { StatCards } from "./StatCards";
import { OrderCard } from "./OrderCard";
import { HistoryPanel } from "./Historypanel";
import { MenuItemCard } from "./MenuItemCard";
import { MenuItemModal } from "./MenuItemModal";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar, AdminBottomNav } from "./AdminNav";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryManager } from "./Categorymanager";
import { CarouselManager } from "./Carouselmanager";
import { SettingsManager } from "./SettingsManager";
import TablesManager from "./TablesManager";
import { AdminLogsManager } from "./AdminLogsManager";
import { logAdminAction } from "../lib/logger";

type TabKey = "orders" | "inventory" | "history" | "carousel" | "settings" | "tables" | "logs";



import { useOrderAlert } from "./Userorderalert";
import { MenuItem, Order, CarouselImage } from "../types";

export default function Admin() {
  const [authed, setAuthed] = useState(false);

  // ── Check existing Supabase session on mount ───────────────────────────────
  useEffect(() => {
    const isTabActive = () => !!sessionStorage.getItem("admin_tab_active");

    // Check if a session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !isTabActive()) {
        // Tab was closed or new tab opened. Force logout!
        supabase.auth.signOut();
        setAuthed(false);
      } else if (session) {
        setAuthed(true);
      } else {
        setAuthed(false);
      }
    });

    // Listen for auth state changes (login / logout / token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        sessionStorage.setItem("admin_tab_active", "1");
        setAuthed(true);
      } else if (event === "SIGNED_OUT") {
        sessionStorage.removeItem("admin_tab_active");
        setAuthed(false);
      } else if (session) {
        // INITIAL_SESSION, TOKEN_REFRESHED, USER_UPDATED
        if (!isTabActive()) {
          supabase.auth.signOut();
          setAuthed(false);
        } else {
          setAuthed(true);
        }
      } else {
        setAuthed(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  const [tab, setTab] = useState<TabKey>("orders");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "pickup" | "dine-in">("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [carouselEnabled, setCarouselEnabled] = useState(true);
  const [carouselSpeed, setCarouselSpeed] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [confirmDeleteMenu, setConfirmDeleteMenu] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ── Sound alert on new orders ──────────────────────────────────────────────
  useOrderAlert(orders);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      supabase.auth.signOut();
      toast("Session expired", {
        description: "You were logged out after 30 minutes of inactivity.",
      });
    }, INACTIVITY_MS);
  };

  // Start/reset timer on any user activity
  useEffect(() => {
    if (!authed) return;

    // Kick off the timer immediately on login
    resetInactivityTimer();

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach((e) =>
        window.removeEventListener(e, resetInactivityTimer),
      );
    };
  }, [authed]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = () => {
    // Session is handled by Supabase Auth — onAuthStateChange fires setAuthed(true)
    toast.success("Welcome back, Admin!");
  };
  const logout = async () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    await supabase.auth.signOut();
    // onAuthStateChange will fire setAuthed(false) automatically
  };

  // ── Data fetching + realtime ───────────────────────────────────────────────
  useEffect(() => {
    if (!authed) return;

    // Initial data fetch
    (async () => {
      setLoading(true);
      const [
        { data: m },
        { data: o },
        { data: cats },
        { data: cImgs },
        { data: cSettings },
      ] = await Promise.all([
        supabase.from("menu_items").select("*").order("name"),
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("name").order("name"),
        supabase
          .from("carousel_images")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase.from("carousel_settings").select("*").eq("id", 1).maybeSingle(),
      ]);
      if (m) setItems(m as MenuItem[]);
      if (o) setOrders(o as Order[]);
      if (cats) setCategories(cats.map((c: { name: string }) => c.name));
      if (cImgs) setCarouselImages(cImgs);
      if (cSettings) {
        setCarouselEnabled(cSettings.enabled ?? true);
        setCarouselSpeed(cSettings.speed ?? 0.8);
      }
      setLoading(false);
    })();

    // Realtime subscription — listens for INSERT and UPDATE
    const ch = supabase
      .channel("papi-admin-v2")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          // Re-fetch full row so order_items jsonb is always complete
          const { data } = await supabase
            .from("orders")
            .select("*")
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setOrders((prev) => {
              // Guard against duplicates if initial fetch already caught it
              if (prev.find((o) => o.id === data.id)) return prev;
              return [data, ...prev];
            });
            toast.success(`New order — Table ${data.table_number}`, {
              description: data.customer_name,
              duration: 5000,
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          // Keep state in sync if status is changed from another device
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id ? { ...o, ...payload.new } : o,
            ),
          );
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("[Realtime] Channel error — orders may not update live");
        }
      });

    return () => {
      supabase.removeChannel(ch);
    };
  }, [authed]);

  // ── Order actions ──────────────────────────────────────────────────────────
  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
    if (!error) {
      setOrders((p) => p.map((o) => (o.id === id ? { ...o, status } : o)));
      if (status === "preparing") toast.success("Order is now being prepared");
      if (status === "completed") toast.success("Order marked as served ✓");
      if (status === "cancelled")
        toast("Order cancelled", { description: "Moved to history" });
      const order = orders.find(o => o.id === id);
      const customerName = order?.customer_name || 'Unknown';
      logAdminAction("Updated Order Status", `Customer: ${customerName} - changed to '${status}' | ID: ${id}`);
    }
  };

  // ── Menu actions ───────────────────────────────────────────────────────────
  const handleSaveModal = async (savedItem: Partial<MenuItem>, isNew: boolean) => {
    if (isNew) {
      const { data, error } = await supabase
        .from("menu_items")
        .insert([savedItem])
        .select();
      if (!error && data) {
        setItems((p) => [data[0], ...p]);
        setShowItemModal(false);
        setEditingItem(null);
        toast.success("Item created");
        logAdminAction("Added Menu Item", `Name: ${savedItem.name || 'Unknown'}`);
      } else {
        toast.error(error?.message ?? "Failed to save item");
      }
    } else {
      if (!editingItem) return;
      const { error } = await supabase
        .from("menu_items")
        .update(savedItem)
        .eq("id", editingItem.id);
      if (!error) {
        setItems((p) =>
          p.map((i) => (i.id === editingItem.id ? { ...i, ...savedItem } : i)),
        );
        setShowItemModal(false);
        
        const changes: string[] = [];
        if (savedItem.name !== undefined && savedItem.name !== editingItem.name) changes.push(`name to '${savedItem.name}'`);
        if (savedItem.price !== undefined && savedItem.price !== editingItem.price) changes.push(`price to ₱${savedItem.price}`);
        if (savedItem.category !== undefined && savedItem.category !== editingItem.category) changes.push(`category to '${savedItem.category}'`);
        if (savedItem.description !== undefined && savedItem.description !== editingItem.description) changes.push(`description updated`);
        if (savedItem.image !== undefined && savedItem.image !== editingItem.image) changes.push(`photo changed`);
        if (savedItem.is_available !== undefined && savedItem.is_available !== editingItem.is_available) changes.push(savedItem.is_available ? "marked available" : "marked unavailable");
        
        const details = changes.length > 0 ? `Changes: ${changes.join(", ")}` : "No changes made";
        logAdminAction("Updated Menu Item", `Item: ${savedItem.name || editingItem.name} | ${details}`);
        
        setEditingItem(null);
        toast.success("Saved");
      } else {
        toast.error(error?.message ?? "Failed to update item");
      }
    }
  };

  const addItem = () => {
    setEditingItem(null);
    setShowItemModal(true);
  };

  const deleteItem = (id: string, name: string) => {
    // UI-only dummy items defense
    if (id.startsWith("new-")) {
      setItems((p) => p.filter((i) => i.id !== id));
      return;
    }
    setConfirmDeleteMenu({ id, name });
  };

  const executeDeleteItem = async () => {
    if (!confirmDeleteMenu) return;
    const { id } = confirmDeleteMenu;
    const itemToDelete = items.find((i) => i.id === id);

    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (!error) {
      setItems((p) => p.filter((i) => i.id !== id));
      toast.success("Removed");
      logAdminAction("Deleted Menu Item", `ID: ${id}, Name: ${confirmDeleteMenu.name}`);
      
      // Delete the actual image file from storage
      if (itemToDelete?.image && !itemToDelete.image.includes("placeholder")) {
        try {
          const urlParts = itemToDelete.image.split("/menu-items/");
          if (urlParts.length === 2) {
            await supabase.storage.from("menu-items").remove([urlParts[1]]);
          }
        } catch (e) {
          console.error("Failed to delete image:", e);
        }
      }
    } else {
      toast.error(error.message || "Failed to remove item.");
    }
    setConfirmDeleteMenu(null);
  };

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!authed) return <LoginGate onLogin={login} />;

  // Active orders = pending + preparing + ready_for_pickup
  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "preparing" || o.status === "ready_for_pickup",
  );
  const historyOrders = orders.filter(
    (o) => o.status === "completed" || o.status === "cancelled",
  );
  const pending = orders.filter((o) => o.status === "pending").length;

  const shown = activeOrders.filter((o) => {
    const isPickup = o.table_number === "STORE-PICKUP" || o.table_number.startsWith("PUP-");
    
    if (typeFilter === "pickup" && !isPickup) return false;
    if (typeFilter === "dine-in" && isPickup) return false;

    if (filter === "all") return true;
    return o.status === filter;
  });

  return (
    <div
      className="adm-layout"
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{GLOBAL_CSS}</style>

      {/* Desktop sidebar */}
      <AdminSidebar
        tab={tab}
        setTab={setTab}
        pending={pending}
        onLogout={logout}
      />

      {/* Main content area */}
      <div
        className="adm-main"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          width: "100%",
        }}
      >
        <AdminTopBar pending={pending} onLogout={logout} />

        <AnimatePresence mode="wait">
          <motion.main
            key={tab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              flex: 1,
              width: "100%",
              display: "block",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              paddingBottom: 80,
            }}
          >
            <div
              style={{ padding: "36px 40px", width: "100%", display: "block" }}
            >
              {/* ── Page heading — unique per tab ── */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h1
                      style={{
                        fontSize: 28,
                        fontWeight: 500,
                        color: C.ink,
                        letterSpacing: "-0.025em",
                        lineHeight: 1.15,
                        marginBottom: 5,
                      }}
                    >
                      {tab === "orders"
                        ? "Orders"
                        : tab === "inventory"
                          ? "Inventory"
                          : tab === "history"
                            ? "Order History"
                            : tab === "carousel"
                              ? "Carousel"
                              : tab === "tables"
                                ? "Tables"
                                : tab === "logs"
                                  ? "Admin Logs"
                                  : "Checkout Settings"}
                    </h1>
                    <p style={{ fontSize: 14, color: C.faint, fontWeight: 400 }}>
                      {tab === "orders"
                        ? `${activeOrders.length} active · ${pending} pending`
                        : tab === "inventory"
                          ? `${items.length} item${items.length !== 1 ? "s" : ""} on the menu`
                          : tab === "history"
                            ? new Date().toLocaleDateString("en-PH", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                            : tab === "carousel"
                              ? "Manage your menu carousel"
                              : tab === "tables"
                                ? "Manage table QR codes"
                                : tab === "logs"
                                  ? "Track admin actions"
                                  : "Manage checkout fees and payment QR"}
                    </p>
                  </div>

                  {/* Inventory action buttons — in the header */}
                  {tab === "inventory" && (
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <Btn
                        v="outline"
                        onClick={() => setShowCatMgr(true)}
                        sx={{ fontSize: 13, padding: "10px 14px" }}
                      >
                        <Tag size={13} strokeWidth={1.5} /> Categories
                      </Btn>
                      <Btn
                        onClick={addItem}
                        sx={{ fontSize: 13, padding: "10px 14px" }}
                      >
                        <Plus size={14} strokeWidth={1.5} /> Add item
                      </Btn>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats — orders and inventory tabs only */}
              {(tab === "orders" || tab === "inventory") && (
                <StatCards orders={orders} menuCount={items.length} />
              )}

              {/* Filter pills — orders tab only */}
              {tab === "orders" && (
                <div
                  className="adm-filter-row no-scrollbar"
                  style={{
                    display: "flex",
                    gap: 16,
                    overflowX: "auto",
                    WebkitOverflowScrolling: "touch",
                    marginBottom: 18,
                    paddingBottom: 2,
                    flexWrap: "nowrap",
                  }}
                >
                  <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                    {["all", "pending", "preparing", "ready_for_pickup"].map((fl) => (
                      <button
                        key={fl}
                        onClick={() => setFilter(fl)}
                        style={{
                          flexShrink: 0,
                          padding: "8px 16px",
                          borderRadius: 99,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          border: `1.5px solid ${filter === fl ? C.ink : C.border}`,
                          background: filter === fl ? C.ink : C.surface,
                          color: filter === fl ? C.white : C.mid,
                        }}
                      >
                        {fl === "ready_for_pickup" ? "Ready" : fl.charAt(0).toUpperCase() + fl.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div style={{ width: 1, background: C.border, margin: "2px 0", flexShrink: 0 }} />

                  <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                    {(["all", "pickup", "dine-in"] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTypeFilter(tf)}
                        style={{
                          flexShrink: 0,
                          padding: "8px 16px",
                          borderRadius: 99,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          border: `1.5px solid ${typeFilter === tf ? C.ink : C.border}`,
                          background: typeFilter === tf ? C.ink : C.surface,
                          color: typeFilter === tf ? C.white : C.mid,
                        }}
                      >
                        {tf === "all" ? "All Types" : tf === "pickup" ? "Pickup Only" : "Dine-in Only"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "80px 0",
                    color: C.faint,
                  }}
                >
                  <Loader2
                    size={22}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                </div>
              )}

              {/* ── Orders tab ── */}
              {!loading && tab === "orders" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {shown.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "80px 0",
                        fontSize: 15,
                        color: C.faint,
                      }}
                    >
                      No active orders.
                    </div>
                  ) : (
                    shown.map((o) => (
                      <OrderCard
                        key={o.id}
                        order={o}
                        onUpdateStatus={updateOrderStatus}
                      />
                    ))
                  )}
                </div>
              )}

              {/* ── Inventory tab ── */}
              {!loading && tab === "inventory" && (
                <>
                  <div className="grid-responsive">
                    {items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onEdit={() => {
                          setEditingItem(item);
                          setShowItemModal(true);
                        }}
                        onDelete={() => deleteItem(item.id, item.name)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* ── History tab ── */}
              {!loading && tab === "history" && (
                <HistoryPanel
                  orders={historyOrders}
                  onOrdersChange={(updated) =>
                    setOrders((prev) =>
                      prev.filter(
                        (o) =>
                          o.status === "pending" ||
                          o.status === "preparing" ||
                          updated.find((u) => u.id === o.id),
                      ),
                    )
                  }
                />
              )}

              {/* ── Carousel tab ── */}
              {!loading && tab === "carousel" && carouselSpeed !== null && (
                <CarouselManager
                  images={carouselImages}
                  enabled={carouselEnabled}
                  speed={carouselSpeed}
                  onImagesChange={setCarouselImages}
                  onEnabledChange={setCarouselEnabled}
                  onSpeedChange={(v) => setCarouselSpeed(v)}
                />
              )}

              {/* ── Tables tab ── */}
              {!loading && tab === "tables" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <TablesManager />
                </div>
              )}


              {/* ── Settings tab ── */}
              {!loading && tab === "settings" && <SettingsManager />}

              {/* ── Logs tab ── */}
              {!loading && tab === "logs" && <AdminLogsManager />}

            </div>
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Mobile bottom nav */}
      <AdminBottomNav tab={tab} setTab={setTab} pending={pending} />

      {/* Category manager modal */}
      {showCatMgr && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCatMgr(false)}
          onCategoriesChange={setCategories}
        />
      )}

      {/* Add/Edit Item Modal */}
      {showItemModal && (
        <MenuItemModal
          item={editingItem}
          categories={categories}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
          onSave={handleSaveModal}
        />
      )}

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteMenu && (
          <div key="delete-modal">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteMenu(null)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9998,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                position: "fixed",
                zIndex: 9999,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "calc(100% - 40px)",
                maxWidth: 340,
                background: "rgba(25, 24, 24, 0.98)",
                borderRadius: 24,
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
                padding: "36px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  background: "rgba(239, 68, 68, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                  color: "#ef4444",
                }}
              >
                <Trash2 size={30} />
              </div>

              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 8,
                  letterSpacing: "-0.01em",
                }}
              >
                Remove Item?
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255, 255, 255, 0.6)",
                  lineHeight: 1.6,
                  marginBottom: 32,
                }}
              >
                Are you sure you want to remove{" "}
                <strong style={{ color: "#fff" }}>
                  "{confirmDeleteMenu.name}"
                </strong>?
                This item will be permanently deleted.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  width: "100%",
                }}
              >
                <button
                  onClick={executeDeleteItem}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 16,
                    border: "none",
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 8px 20px rgba(239, 68, 68, 0.2)",
                  }}
                >
                  Yes, Remove Item
                </button>
                <button
                  onClick={() => setConfirmDeleteMenu(null)}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 16,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
