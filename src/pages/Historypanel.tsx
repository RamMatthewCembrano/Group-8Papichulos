import { formatPrice } from "@/lib/utils";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Clock,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Receipt,
  CalendarDays,
  CalendarSearch,
  Trash2,
  AlertTriangle,
  Loader2,
  Download,
  RefreshCw,
  Lock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { C, HISTORY_FILTERS } from "./constants";
import { Pill, Lbl, HR, Btn } from "./AdminPrimitives";
import { Order } from "../types";
import { logAdminAction } from "../lib/logger";
import * as xlsx from "xlsx";

// ── Helpers ───────────────────────────────────────────────────────────────────
const toDateKey = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const todayKey = () => toDateKey(new Date().toISOString());

const fmtDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const isPickupOrder = (o: Order) => {
  const t = o.table_number || "";
  return t === "STORE-PICKUP" || t.startsWith("PUP-") || t.length > 3;
};

const getPaymentLabel = (payment_method?: string | null) => {
  return payment_method === "gcash" ? "GCash" : "Pay at Counter";
};

// ── Order list ────────────────────────────────────────────────────────────────
const OrderList = ({
  orders,
  filter,
  typeFilter,
  onOrdersChange,
}: {
  orders: Order[];
  filter: string;
  typeFilter: "all" | "pickup" | "dine-in";
  onOrdersChange: (updated: Order[]) => void;
}) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [reversingOrder, setReversingOrder] = useState<string | null>(null);
  const [reversePass, setReversePass] = useState("");
  const [reverseLoading, setReverseLoading] = useState(false);
  const [reverseShake, setReverseShake] = useState(false);

  let shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (typeFilter !== "all") {
    shown = shown.filter((o) => (typeFilter === "pickup" ? isPickupOrder(o) : !isPickupOrder(o)));
  }

  if (shown.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 0",
          fontSize: 14,
          color: C.faint,
        }}
      >
        No {filter === "all" ? "" : filter} orders for this day.
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {shown.map((order) => {
          const isOpen = openId === order.id;
          const isCompleted = order.status === "completed";
          const isCancelled = order.status === "cancelled";
          const pickup = isPickupOrder(order);

          return (
            <div
              key={order.id}
              className="a-fade"
              style={{
                background: C.surface,
                borderRadius: 14,
                overflow: "hidden",
                border: `1.5px solid ${isCancelled ? "#FCA5A5" : C.border}`,
                opacity: isCancelled ? 0.7 : 1,
              }}
            >
              {/* Header row */}
              <div
                onClick={() => setOpenId((v) => (v === order.id ? null : order.id))}
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    minWidth: 42,
                    padding: pickup ? "0 8px" : 0,
                    height: 42,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: pickup ? "#F3E8FF" : C.lift,
                    color: pickup ? "#6B21A8" : C.mid,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: pickup ? 11 : 16,
                    fontWeight: pickup ? 700 : 500,
                    letterSpacing: pickup ? "0.03em" : "normal",
                  }}
                >
                  {pickup ? "PICKUP" : order.table_number}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: C.ink,
                      marginBottom: 5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {order.customer_name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Pill status={order.status} isPickup={pickup} />
                    <span
                      style={{
                        fontSize: 12,
                        color: C.faint,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Clock size={11} strokeWidth={1.5} />
                      {fmtTime(order.created_at)}
                    </span>
                  </div>
                </div>



                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 400,
                      color: isCancelled ? C.faint : C.ink,
                      letterSpacing: "-0.02em",
                      marginBottom: 4,
                      textDecoration: isCancelled ? "line-through" : "none",
                    }}
                  >
                    ₱{Number(order.total_price).toFixed(0)}
                  </div>
                  <div style={{ color: C.faint }}>
                    {isOpen ? <ChevronUp size={14} strokeWidth={1.5} /> : <ChevronDown size={14} strokeWidth={1.5} />}
                  </div>
                </div>
              </div>

              {/* Expanded */}
              {isOpen && (
                <>
                  <HR />
                  <div style={{ padding: "14px 18px 16px" }}>
                    <div style={{ background: C.lift, borderRadius: 10, padding: 12, marginBottom: 12 }}>
                      <Lbl t="Items ordered" />
                      {order.order_items?.map((item, i) => (
                        <div
                          key={item.id ?? i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: `${i === 0 ? 0 : 7}px 0 7px`,
                            borderBottom: i < order.order_items.length - 1 ? `1px solid ${C.line}` : "none",
                          }}
                        >
                          <span style={{ fontSize: 14, color: C.body }}>
                            <span style={{ color: C.faint, marginRight: 6, fontSize: 12 }}>
                              {item.quantity}×
                            </span>
                            {item.name}
                          </span>
                          {item.price != null && (
                            <span style={{ fontSize: 13, color: C.mid }}>
                              ₱{(item.price * item.quantity).toFixed(0)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {order.receipt_url && order.payment_method === "gcash" && (
                      <div style={{ marginBottom: 12 }}>
                        <Lbl t="GCash Receipt" />
                        <a href={order.receipt_url} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 6 }}>
                          <img
                            src={order.receipt_url}
                            alt="GCash Receipt"
                            style={{
                              width: "100%",
                              maxWidth: 220,
                              borderRadius: 8,
                              border: `1px solid ${C.line}`,
                              objectFit: "contain",
                              background: C.lift,
                            }}
                          />
                        </a>
                      </div>
                    )}


                    <div style={{ fontSize: 13, color: C.faint, marginBottom: order.receipt_url ? 8 : 12 }}>
                      Payment — <span style={{ color: C.mid, fontWeight: 500 }}>{getPaymentLabel(order.payment_method)}</span>
                    </div>

                    {pickup ? (
                      <>
                        <div style={{ fontSize: 13, color: C.faint, marginBottom: 12 }}>
                          Pickup ID —{" "}
                          <span style={{ color: C.ink, fontWeight: 700, letterSpacing: "0.03em" }}>{order.table_number}</span>
                        </div>
                        <div style={{ fontSize: 13, color: C.faint, marginBottom: 12 }}>
                          Phone — <span style={{ color: C.mid, fontWeight: 500 }}>{order.phone_number || "—"}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 13, color: C.faint, marginBottom: 12 }}>
                        Table —{" "}
                        <span style={{ color: C.ink, fontWeight: 700, letterSpacing: "0.03em" }}>{order.table_number || "—"}</span>
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: isCompleted ? C.mid : "#DC2626" }}>
                        {isCompleted ? (
                          <>
                            <CheckCircle2 size={13} strokeWidth={1.5} /> Completed successfully
                          </>
                        ) : (
                          <>
                            <X size={13} strokeWidth={1.5} /> Order was cancelled
                          </>
                        )}
                      </div>
                      {isCancelled && (
                        <Btn
                          v="outline"
                          onClick={() => {
                            setReversingOrder(order.id);
                            setReversePass("");
                          }}
                          sx={{ fontSize: 12, padding: "6px 12px", background: "transparent", borderColor: "#444748" }}
                        >
                          <RefreshCw size={13} strokeWidth={1.5} style={{ marginRight: 4 }} /> Restore
                        </Btn>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Password prompt for reversing cancellation */}
      {reversingOrder && (
        <div
          onClick={() => !reverseLoading && setReversingOrder(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={reverseShake ? "a-shake" : ""}
            style={{
              background: C.surface,
              width: "100%",
              maxWidth: 380,
              padding: 24,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 500, color: C.ink, marginBottom: 8 }}>
              Reverse Cancellation
            </div>
            <div style={{ fontSize: 14, color: C.faint, marginBottom: 20 }}>
              Please enter your admin password to restore this order to pending.
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setReverseLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user?.email) {
                  toast.error("Not authenticated");
                  setReverseLoading(false);
                  return;
                }

                // Verify password
                const { error: authError } = await supabase.auth.signInWithPassword({
                  email: user.email,
                  password: reversePass,
                });

                if (authError) {
                  setReverseShake(true);
                  setTimeout(() => setReverseShake(false), 420);
                  toast.error("Incorrect password");
                  setReverseLoading(false);
                  return;
                }

                // If password correct, update order status
                const { error: updateError } = await supabase
                  .from("orders")
                  .update({ status: "pending" })
                  .eq("id", reversingOrder);

                if (updateError) {
                  toast.error("Failed to restore order");
                } else {
                  toast.success("Order restored successfully");
                  logAdminAction("Restored Order", `ID: ${reversingOrder} - status reverted to pending`);
                  onOrdersChange(orders.map(o => o.id === reversingOrder ? { ...o, status: "pending" } : o));
                  setReversingOrder(null);
                }
                setReverseLoading(false);
              }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label style={{ display: "block", fontSize: 12, color: C.faint, marginBottom: 6, fontWeight: 500 }}>
                  PASSWORD
                </label>
                <input
                  type="password"
                  value={reversePass}
                  onChange={(e) => setReversePass(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  disabled={reverseLoading}
                  style={{
                    width: "100%",
                    background: C.lift,
                    border: `1px solid ${C.line}`,
                    color: C.ink,
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <Btn
                  v="outline"
                  onClick={() => setReversingOrder(null)}
                  disabled={reverseLoading}
                  sx={{ flex: 1 }}
                >
                  Cancel
                </Btn>
                <Btn
                  submit
                  disabled={reverseLoading}
                  sx={{ flex: 1, background: C.ink, color: C.white }}
                >
                  {reverseLoading ? (
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <>
                      <Lock size={16} strokeWidth={1.5} style={{ marginRight: 6 }} /> Restore
                    </>
                  )}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// ── Summary strip ─────────────────────────────────────────────────────────────
const SummaryStrip = ({ orders }: { orders: Order[] }) => {
  const revenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + Number(o.total_price), 0);

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
      {[
        { label: "Revenue", value: `₱${revenue.toLocaleString()}`, color: C.ink },
        { label: "Completed", value: orders.filter((o) => o.status === "completed").length, color: C.ink },
        { label: "Cancelled", value: orders.filter((o) => o.status === "cancelled").length, color: "#DC2626" },
      ].map((s) => (
        <div
          key={s.label}
          style={{
            flex: 1,
            minWidth: 120,
            background: C.surface,
            border: `1.5px solid ${C.border}`,
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 500, color: C.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            {s.label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 300, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export const HistoryPanel = ({
  orders,
  onOrdersChange,
}: {
  orders: Order[];
  onOrdersChange: (updated: Order[]) => void;
}) => {
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "pickup" | "dine-in">("all");
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [mode, setMode] = useState<"today" | "lookup">("today");

  const [exportMode, setExportMode] = useState<"day" | "month">("day");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);

  const maxDate = todayKey();

  const displayDate = mode === "today" ? todayKey() : selectedDate;

  const dayOrders = orders.filter((o) => toDateKey(o.created_at) === displayDate);

  // Month logic
  const currentMonthKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  const monthOrders = exportMode === "month" && selectedMonth
    ? orders.filter((o) => toDateKey(o.created_at).startsWith(selectedMonth))
    : [];

  const ordersToShow = exportMode === "month" && selectedMonth ? monthOrders : dayOrders;

  const isToday = displayDate === todayKey();

  // Count how many orders are older than 60 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const oldCount = orders.filter(
    (o) => new Date(o.created_at) < cutoff && (o.status === "completed" || o.status === "cancelled")
  ).length;

  const openDatePicker = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch {
        dateInputRef.current.click();
      }
    }
  };

  const openMonthPicker = () => {
    if (monthInputRef.current) {
      if (!selectedMonth) setSelectedMonth(currentMonthKey);
      try {
        monthInputRef.current.showPicker();
      } catch {
        monthInputRef.current.click();
      }
    }
  };

  const browseLabel =
    exportMode === "month"
      ? selectedMonth
        ? new Date(Number(selectedMonth.split("-")[0]), Number(selectedMonth.split("-")[1]) - 1, 1).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
        })
        : "Select Month"
      : mode === "lookup"
        ? new Date(
          Number(selectedDate.split("-")[0]),
          Number(selectedDate.split("-")[1]) - 1,
          Number(selectedDate.split("-")[2])
        ).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
        : "Browse by Date";

  // ── Export to Excel ────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const ordersToExport = ordersToShow.length > 0 ? ordersToShow : dayOrders;

    if (ordersToExport.length === 0) {
      toast("No orders to export");
      return;
    }

    const rows: Record<string, unknown>[] = [];

    ordersToExport.forEach((order) => {
      const date = new Date(order.created_at);
      const dateStr = date.toLocaleDateString("en-PH");
      const timeStr = date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

      if (order.order_items && order.order_items.length > 0) {
        order.order_items.forEach((item) => {
          rows.push({
            "Order ID": order.id,
            Date: dateStr,
            Time: timeStr,
            "Table Number": order.table_number,
            "Customer Name": order.customer_name,
            Status: order.status,
            "Payment Method": order.payment_method === "gcash" ? "GCash" : "Pay at Counter",
            "Item Name": item.name,
            Quantity: item.quantity,
            "Unit Price": item.price,
            "Item Total": item.price * item.quantity,
            "Order Total": order.total_price,
            "Receipt URL": order.receipt_url || "",
          });
        });
      } else {
        rows.push({
          "Order ID": order.id,
          Date: dateStr,
          Time: timeStr,
          "Table Number": order.table_number,
          "Customer Name": order.customer_name,
          Status: order.status,
          "Payment Method": order.payment_method === "gcash" ? "GCash" : "Pay at Counter",
          "Item Name": "",
          Quantity: "",
          "Unit Price": "",
          "Item Total": "",
          "Order Total": order.total_price,
          "Receipt URL": order.receipt_url || "",
        });
      }
    });

    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Orders");

    const filename = exportMode === "month" && selectedMonth ? `orders_${selectedMonth}` : `orders_${displayDate}`;
    xlsx.writeFile(wb, `${filename}.xlsx`);

    toast.success(`Exported ${exportMode === "month" && selectedMonth ? selectedMonth : displayDate} orders to Excel`);
  };

  // ── Delete old orders ──────────────────────────────────────────────────────
  const clearOldHistory = async () => {
    setCleaning(true);

    const { error } = await supabase
      .from("orders")
      .delete()
      .lt("created_at", cutoff.toISOString())
      .in("status", ["completed", "cancelled"]);

    if (error) {
      toast.error("Failed to clear history: " + error.message);
    } else {
      onOrdersChange(
        orders.filter(
          (o) => !(new Date(o.created_at) < cutoff && (o.status === "completed" || o.status === "cancelled"))
        )
      );

      logAdminAction("Cleared Old History", `Deleted ${oldCount} orders older than 60 days`);
      toast.success(`Cleared ${oldCount} old order${oldCount !== 1 ? "s" : ""}`);
    }

    setCleaning(false);
    setShowConfirm(false);
  };

  return (
    <div>
      {/* ── Confirm delete modal ── */}
      {showConfirm && (
        <>
          <div
            onClick={() => !cleaning && setShowConfirm(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 60,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
          />
          <div
            style={{
              position: "fixed",
              zIndex: 70,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "calc(100% - 36px)",
              maxWidth: 400,
              background: C.surface,
              borderRadius: 20,
              border: `1.5px solid ${C.border}`,
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
              padding: "28px 24px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={22} strokeWidth={1.5} color="#DC2626" />
            </div>

            <div style={{ fontSize: 17, fontWeight: 600, color: C.ink, marginBottom: 8, letterSpacing: "-0.01em" }}>
              Clear Old History?
            </div>
            <div style={{ fontSize: 14, color: C.mid, lineHeight: 1.6, marginBottom: 24 }}>
              This will permanently delete <span style={{ fontWeight: 600, color: C.ink }}>{oldCount} order{oldCount !== 1 ? "s" : ""}</span> older than 60 days. This cannot be undone.
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={cleaning}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  border: `1.5px solid ${C.border}`,
                  background: C.surface,
                  color: C.mid,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={clearOldHistory}
                disabled={cleaning}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#DC2626",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: cleaning ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  opacity: cleaning ? 0.7 : 1,
                }}
              >
                {cleaning ? (
                  <>
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} strokeWidth={1.5} />
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Top row ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          onClick={() => {
            setMode("today");
            setExportMode("day");
            setSelectedMonth("");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 18px",
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 500,
            border: `1.5px solid ${mode === "today" && exportMode === "day" ? C.ink : C.border}`,
            background: mode === "today" && exportMode === "day" ? C.ink : C.surface,
            color: mode === "today" && exportMode === "day" ? C.white : C.mid,
            cursor: "pointer",
            transition: "all 0.15s",
            flexShrink: 0,
          }}
        >
          <CalendarDays size={14} strokeWidth={1.5} />
          Today
        </button>

        <button
          onClick={() => {
            setMode("lookup");
            setExportMode("month");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 18px",
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 500,
            border: `1.5px solid ${exportMode === "month" ? C.ink : C.border}`,
            background: exportMode === "month" ? C.ink : C.surface,
            color: exportMode === "month" ? C.white : C.mid,
            cursor: "pointer",
            transition: "all 0.15s",
            flexShrink: 0,
          }}
        >
          <CalendarDays size={14} strokeWidth={1.5} />
          By Month
        </button>

        <button
          onClick={exportMode === "month" ? openMonthPicker : openDatePicker}
          style={{
            flex: 1,
            minWidth: 190,
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 18px",
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 500,
            border: `1.5px solid ${exportMode === "month" || mode === "lookup" ? C.ink : C.border}`,
            background: exportMode === "month" || mode === "lookup" ? C.ink : C.surface,
            color: exportMode === "month" || mode === "lookup" ? C.white : C.mid,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <CalendarSearch size={14} strokeWidth={1.5} />
          {browseLabel}
        </button>

        <input
          ref={dateInputRef}
          type="date"
          max={maxDate}
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) {
              setSelectedDate(e.target.value);
              setMode("lookup");
              setExportMode("day");
              setSelectedMonth("");
            }
          }}
          style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
        />

        <input
          ref={monthInputRef}
          type="month"
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            setExportMode("month");
          }}
          style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
        />

        <button
          onClick={exportToExcel}
          title="Export orders to Excel"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 14px",
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 500,
            border: `1.5px solid ${C.border}`,
            background: C.surface,
            color: C.mid,
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          <Download size={14} strokeWidth={1.5} />
        </button>

        <button
          onClick={() => {
            if (oldCount === 0) {
              toast("No old history", { description: "There are no orders older than 2 months to delete." });
              return;
            }
            setShowConfirm(true);
          }}
          title="Delete orders older than 2 months"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 14px",
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 500,
            border: `1.5px solid ${oldCount > 0 ? "#FECACA" : C.border}`,
            background: oldCount > 0 ? "#FEF2F2" : C.surface,
            color: oldCount > 0 ? "#DC2626" : C.faint,
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Date heading ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>
          {exportMode === "month" ? "" : isToday ? "Today — " : ""}
          {exportMode === "month"
            ? selectedMonth
              ? new Date(Number(selectedMonth.split("-")[0]), Number(selectedMonth.split("-")[1]) - 1, 1).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
              })
              : "Select Month"
            : fmtDate(displayDate)}
        </div>
        {exportMode !== "month" && isToday && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: C.ink,
              color: C.white,
              padding: "3px 8px",
              borderRadius: 99,
            }}
          >
            Live
          </span>
        )}
      </div>

      {/* ── Summary ── */}
      <SummaryStrip orders={ordersToShow} />

      {/* ── Filter pills ── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
        <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
          {HISTORY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flexShrink: 0,
                padding: "8px 16px",
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
                border: `1.5px solid ${filter === f ? C.ink : C.border}`,
                background: filter === f ? C.ink : C.surface,
                color: filter === f ? C.white : C.mid,
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
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

      {/* ── Order list ── */}
      <OrderList orders={ordersToShow} filter={filter} typeFilter={typeFilter} onOrdersChange={onOrdersChange} />
    </div>
  );
};
