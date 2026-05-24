import { useState, useEffect } from "react";
import { CartProvider } from "@/contexts/CartContext";
import Header from "@/components/Header";
import MenuGrid from "@/components/MenuGrid";
import CartBar from "@/components/CartBar";
import CartDrawer from "@/components/CartDrawer";
import CheckoutDrawer from "@/components/CheckoutDrawer";
import OrderStatusBar from "@/components/OrderStatusBar";
import OrderTracker from "@/components/OrderTracker";
import Footer from "@/components/Footer";
import UserHistoryDrawer from "@/components/UserHistoryDrawer";
import { AnimatePresence } from "framer-motion";

const getStorageKey = (isPickup: boolean) =>
  isPickup ? "papi_pickup_active_order_id" : "papi_active_order_id";

const IndexContent = ({ isPickup = false }: { isPickup?: boolean }) => {
  // Restore any in-progress order from localStorage (survives refresh)
  const [orderId, setOrderId] = useState<string | null>(() =>
    localStorage.getItem(getStorageKey(isPickup))
  );
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [trackerOrderId, setTrackerOrderId] = useState<string | null>(null);

  // 4-hour inactivity reset for Dine-In
  useEffect(() => {
    if (isPickup) return;

    const EXPIRATION_MS = 4 * 60 * 60 * 1000; // 4 hours

    const checkActivity = () => {
      const lastActivity = localStorage.getItem("papi_last_activity");
      if (lastActivity) {
        if (Date.now() - parseInt(lastActivity, 10) > EXPIRATION_MS) {
          localStorage.removeItem("papi_active_order_id");
          localStorage.removeItem("papi_order_history");
          localStorage.removeItem("papi_current_table_number");
          localStorage.removeItem("papi_last_activity");
          localStorage.removeItem("papi_cart");
          window.location.reload();
        }
      }
    };

    checkActivity();

    const updateActivity = () => {
      localStorage.setItem("papi_last_activity", Date.now().toString());
    };

    updateActivity();
    window.addEventListener("click", updateActivity);
    window.addEventListener("touchstart", updateActivity);
    window.addEventListener("keydown", updateActivity);

    const interval = setInterval(checkActivity, 60000);

    return () => {
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("touchstart", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      clearInterval(interval);
    };
  }, [isPickup]);

  const handleOrderConfirmed = (id: string) => {
    setOrderId(id);
    setCheckoutOpen(false);
    // Auto-open tracker briefly so customer sees their order status right away
    setTimeout(() => setTrackerOpen(true), 400);
  };

  const handleDismiss = () => {
    // Called by OrderStatusBar when order is completed or cancelled
    localStorage.removeItem(getStorageKey(isPickup));
    setOrderId(null);
    setTrackerOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onShowHistory={() => setHistoryOpen(true)} />
      <MenuGrid />
      <Footer />

      {/* Cart bar — only when no active order, or slides above status bar */}
      <CartBar onOpen={() => setCartOpen(true)} hasActiveOrder={!!orderId} />

      {/* Floating live order status bar — sits below the cart bar */}
      {orderId && (
        <div style={{ paddingBottom: 72 /* leave room for OrderStatusBar if visible */ }}>
          <OrderStatusBar
            orderId={orderId}
            onTap={() => setTrackerOpen(true)}
            onDismiss={handleDismiss}
          />
        </div>
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setTimeout(() => setCheckoutOpen(true), 300);
        }}
      />

      <CheckoutDrawer
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={handleOrderConfirmed}
        isPickup={isPickup}
      />

      <UserHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectOrder={(id) => {
          setTrackerOrderId(id);
          setTrackerOpen(true);
        }}
        isPickup={isPickup}
      />

      {/* Order tracker sheet — slides up over the menu */}
      <AnimatePresence>
        {trackerOpen && (trackerOrderId || orderId) && (
          <OrderTracker
            orderId={(trackerOrderId || orderId)!}
            onClose={() => {
              setTrackerOpen(false);
              setTimeout(() => setTrackerOrderId(null), 300);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const Index = ({ isPickup = false }: { isPickup?: boolean }) => (
  <CartProvider>
    <IndexContent isPickup={isPickup} />
  </CartProvider>
);

export default Index;
