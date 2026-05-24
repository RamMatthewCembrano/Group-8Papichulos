import { formatPrice } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface CartBarProps {
  onOpen: () => void;
  hasActiveOrder?: boolean;
}

const CartBar = ({ onOpen, hasActiveOrder }: CartBarProps) => {
  const { totalItems, totalPrice } = useCart();
  const bottomOffset = hasActiveOrder ? 70 : 0; // OrderStatusBar height is ~70px

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1, bottom: bottomOffset }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            zIndex: 50,
            padding: "16px 20px",
            backgroundColor: "rgba(20, 19, 19, 0.97)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: "1px solid #444748",
          }}
        >
          <button
            onClick={onOpen}
            aria-label="View cart"
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#ffffff",
              color: "#141313",
              border: "none",
              borderRadius: 0,
              padding: "16px 20px",
              cursor: "pointer",
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            }}
          >
            {/* Left: icon + label + count */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ position: "relative" }}>
                <ShoppingBag
                  style={{ width: "18px", height: "18px", color: "#141313" }}
                  strokeWidth={2}
                />
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-8px",
                    width: "16px",
                    height: "16px",
                    backgroundColor: "#141313",
                    color: "#ffffff",
                    fontSize: "9px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 0,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {totalItems}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#141313",
                }}
              >
                View Order
              </span>
            </div>

            {/* Right: total price */}
            <span
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                color: "#141313",
                letterSpacing: "-0.01em",
              }}
            >
              ₱{formatPrice(totalPrice)}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartBar;
