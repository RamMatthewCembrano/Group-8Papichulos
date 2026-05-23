import { formatPrice } from "@/lib/utils";
import { motion } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { MenuItem } from "@/contexts/CartContext";
import { useCart } from "@/contexts/CartContext";

interface MenuCardProps {
  item: MenuItem;
  onSelect?: () => void;
}

const MenuCard = ({ item, onSelect }: MenuCardProps) => {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleAdd = () => {
    addItem(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "3 / 4",
        overflow: "hidden",
        border: "1px solid #444748",
        backgroundColor: "#0e0e0e",
        borderRadius: 0,
        cursor: item.is_available === false ? "not-allowed" : "pointer",
        opacity: item.is_available === false ? 0.6 : 1,
        filter: item.is_available === false ? "grayscale(100%)" : "none",
      }}
      onClick={item.is_available === false ? undefined : onSelect}
    >
      {/* ── Food Photo ──────────────────────────────────────────────── */}
      {item.image && (
        <img
          src={item.image}
          alt={item.name}
          onLoad={() => setImgLoaded(true)}
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "none",
            opacity: imgLoaded ? 1 : 0,
            transition: "opacity 0.4s ease, transform 0.3s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLImageElement).style.transform = "scale(1.03)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLImageElement).style.transform = "scale(1)";
          }}
        />
      )}

      {/* ── Gradient Overlay ──────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, #141313 0%, rgba(20,19,19,0.55) 45%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {item.is_available === false && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#ffffff",
            padding: "8px 16px",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            border: "1px solid #444748",
            zIndex: 10,
          }}
        >
          OUT OF STOCK
        </div>
      )}

      {/* ── Bottom Content Area ──────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "8px",
        }}
      >
        {/* Left: category chip + name + description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {item.category && (
            <span
              style={{
                display: "inline-block",
                marginBottom: "8px",
                padding: "3px 10px",
                backgroundColor: "#2a2a2a",
                border: "1px solid #444748",
                fontFamily: "'Inter', sans-serif",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#ffffff",
                borderRadius: 0,
              }}
            >
              {item.category}
            </span>
          )}

          <h3
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "clamp(13px, 3vw, 17px)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              textTransform: "uppercase",
              margin: 0,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
            }}
          >
            {item.name}
          </h3>

          {item.description && (
            <p
              style={{
                marginTop: "4px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                lineHeight: 1.4,
                color: "#c4c7c8",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical" as const,
              }}
            >
              {item.description}
            </p>
          )}
        </div>

        {/* Right: price + add button */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "15px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            ₱{formatPrice(item.price)}
          </span>

          {item.is_available !== false && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleAdd();
              }}
              aria-label={added ? "Added to cart" : `Add ${item.name} to cart`}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                color: "#141313",
                border: "none",
                borderRadius: 0,
                cursor: "pointer",
                transition: "opacity 0.15s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              }}
            >
              {added ? (
                <Check strokeWidth={2.5} style={{ width: "16px", height: "16px" }} />
              ) : (
                <Plus strokeWidth={2.5} style={{ width: "16px", height: "16px" }} />
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default MenuCard;
