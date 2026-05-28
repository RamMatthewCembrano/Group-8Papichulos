import { motion, AnimatePresence } from "framer-motion";
import { useOrderStatus, OrderStatus } from "@/hooks/useOrderStatus";
import { Clock, ChefHat, CheckCircle, XCircle, Loader2, X } from "lucide-react";

interface OrderTrackerProps {
  orderId: string;
  onClose: () => void;
}

const OrderTracker = ({ orderId, onClose }: OrderTrackerProps) => {
  const { order, loading, estimatedMinutes } = useOrderStatus(orderId);

  const isPickup = order?.table_number === "STORE-PICKUP" || order?.table_number?.startsWith("PUP-");
  const isCash = order?.payment_method !== "gcash";

  const STEPS = isPickup ? [
    { key: "received", label: "Pending Order Received", sub: "Waiting for confirmation." },
    ...(isCash ? [{ key: "pay", label: "Pay at the Counter", sub: "Please proceed to the counter." }] : []),
    { key: "preparing", label: "Preparing the Order", sub: "We are packing your items." },
    { key: "ready_for_pickup", label: "Order Ready for Pickup", sub: "Please proceed to the counter." },
    { key: "completed", label: "Order Picked Up", sub: "Thank you!" },
  ] : [
    { key: "received", label: "Order Received", sub: "We got your order!" },
    ...(isCash ? [{ key: "pay", label: "Pay at the Counter", sub: "Please settle your payment." }] : []),
    { key: "preparing", label: "Preparing", sub: "The kitchen is on it." },
    { key: "ready_for_pickup", label: "Ready to Serve", sub: "Your food is on the way!" },
    { key: "completed", label: "Completed", sub: "Enjoy your meal!" },
  ];

  const activeStep = (() => {
    if (!order) return 0;
    if (order.status === "pending") return isCash ? 1 : 0;
    const idx = STEPS.findIndex((s) => s.key === order.status);
    return idx >= 0 ? idx : 0;
  })();

  const isCancelled = order?.status === "cancelled";
  const isDone = order?.status === "completed";

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 70,
          backgroundColor: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 71,
          backgroundColor: "#141313",
          borderTop: "1px solid #444748",
          maxHeight: "92dvh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#444748" }} />
        </div>

        {/* Close button */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 20px" }}>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#8e9192", cursor: "pointer", padding: 4, display: "flex" }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "8px 24px 40px", display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Status icon */}
          <motion.div
            key={order?.status ?? "loading"}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            style={{
              width: 72,
              height: 72,
              border: `1px solid ${isCancelled ? "#7f1d1d" : "#ffffff"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            {loading ? (
              <Loader2 style={{ width: 30, height: 30, color: "#8e9192" }} className="animate-spin" />
            ) : isCancelled ? (
              <XCircle style={{ width: 32, height: 32, color: "#ef4444" }} />
            ) : isDone ? (
              <CheckCircle style={{ width: 32, height: 32, color: "#4ade80" }} />
            ) : activeStep === 1 ? (
              <ChefHat style={{ width: 32, height: 32, color: "#fbbf24" }} />
            ) : (
              <Clock style={{ width: 32, height: 32, color: "#ffffff" }} />
            )}
          </motion.div>

          {/* Table + Name */}
          {order && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", color: "#8e9192", textTransform: "uppercase", marginBottom: 6, textAlign: "center" }}>
              {isPickup ? `Pickup Code: ${order.table_number}` : `Table ${order.table_number}`} · {order.customer_name}
            </p>
          )}

          {/* Headline */}
          <motion.h2
            key={`hl-${order?.status}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "clamp(26px, 7vw, 36px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: isCancelled ? "#ef4444" : isDone ? "#4ade80" : "#ffffff",
              textTransform: "uppercase",
              lineHeight: 1.05,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            {loading ? "Loading…"
              : isCancelled ? "Cancelled"
                : isDone ? (isPickup ? "Picked Up!" : "Served!")
                  : (activeStep === 1 && isCash) ? "Pay at Counter"
                  : (activeStep === 1 && !isCash) ? STEPS[1].label
                  : (activeStep === 2) ? STEPS[2].label
                  : "Order Received"}
          </motion.h2>

          {/* Wait time badge */}
          <AnimatePresence>
            {!loading && !isCancelled && !isDone && estimatedMinutes > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  width: "auto",
                  alignSelf: "center",
                  maxWidth: "100%",

                  backgroundColor: "#1c1b1b",
                  border: "1px solid #444748",
                  padding: "7px 16px",
                  marginBottom: 28,
                }}
              >
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#c4c7c8" }}>
                  Estimated wait: <strong style={{ color: "#ffffff", whiteSpace: "nowrap" }}>15–20 min</strong>


                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Stepper ── */}
          {!loading && !isCancelled && (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", marginBottom: 32 }}>
              {STEPS.map((step, idx) => {
                const isCompleted = activeStep > idx;
                const isActive = activeStep === idx;
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.08 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 0",
                      borderBottom: idx < STEPS.length - 1 ? "1px solid #2a2a2a" : "none",
                      opacity: isCompleted || isActive ? 1 : 0.3,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        flexShrink: 0,
                        border: `1px solid ${isCompleted || isActive ? "#ffffff" : "#444748"}`,
                        backgroundColor: isCompleted ? "#ffffff" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {isCompleted ? (
                        <svg width="12" height="10" viewBox="0 0 14 10" fill="none">
                          <polyline points="1 5 5 9 13 1" stroke="#141313" strokeWidth="2" strokeLinecap="square" />
                        </svg>
                      ) : isActive ? (
                        <div style={{ width: 8, height: 8, backgroundColor: "#ffffff", borderRadius: "50%", animation: "dotPulse 1.5s ease-in-out infinite" }} />
                      ) : (
                        <span style={{ fontSize: 10, color: "#8e9192", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{idx + 1}</span>
                      )}
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: isActive ? 600 : 400, color: isCompleted || isActive ? "#ffffff" : "#8e9192", marginBottom: 2 }}>
                        {step.label}
                      </p>
                      {isActive && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#8e9192" }}>
                          {step.sub}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Order items summary */}
          {order && Array.isArray(order.order_items) && order.order_items.length > 0 && (
            <div style={{ width: "100%", marginBottom: 28 }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "#8e9192", textTransform: "uppercase", marginBottom: 12 }}>
                Your Items
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {order.order_items.map((item: { name: string; quantity: number; price: number }, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#e5e2e1" }}>
                      <span style={{ color: "#8e9192", marginRight: 6 }}>×{item.quantity}</span>
                      {item.name}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancelled / Done messages */}
          {isCancelled && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, lineHeight: 1.6, color: "#c4c7c8", textAlign: "center", marginBottom: 28 }}>
              Your order was cancelled. Please speak to a staff member.
            </p>
          )}
          {isDone && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, lineHeight: 1.6, color: "#c4c7c8", textAlign: "center", marginBottom: 28 }}
            >
              {isPickup ? "Your order has been picked up. Enjoy! 🎉" : "Your food is ready. Enjoy your meal! 🎉"}
            </motion.p>
          )}

          <button
            onClick={onClose}
            style={{
              width: "100%",
              backgroundColor: "#ffffff",
              color: "#141313",
              border: "none",
              borderRadius: 0,
              padding: "18px",
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Back to Menu
          </button>
        </div>
      </motion.div>

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </>
  );
};

export default OrderTracker;
