import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  ClipboardList,
  LayoutGrid,
  History,
  Images,
  Settings,
  QrCode,
} from "lucide-react";
import { C } from "./constants";

type TabKey = "orders" | "inventory" | "history" | "carousel" | "settings" | "tables" | "logs";


// ── Top bar ───────────────────────────────────────────────────────────────────
interface TopBarProps {
  pending: number;
  onLogout: () => void;
}

export const AdminTopBar = ({ pending, onLogout }: TopBarProps) => (
  <header
    className="adm-topbar"
    style={{
      position: "sticky",
      top: 0,
      zIndex: 30,
      background: "rgba(20, 19, 19, 0.85)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: `1px solid rgba(255, 255, 255, 0.08)`,
      padding: "0 18px",
      height: 72,
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
    }}
  >
    <div />
    <img
      src="/PAPICHOLOS-LOGO-menu.webp"
      alt="Papicholo's CDO"
      style={{
        height: 56,
        width: "auto",
        objectFit: "contain",
        display: "block",
        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
      }}
    />
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        justifyContent: "flex-end",
      }}
    >
      <AnimatePresence>
        {pending > 0 && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={{
              background: "#fff",
              color: "#000",
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 99,
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: "0 2px 10px rgba(255,255,255,0.2)",
            }}
          >
            {pending} PENDING
          </motion.span>
        )}
      </AnimatePresence>
      <button
        onClick={onLogout}
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          border: `1px solid rgba(255, 255, 255, 0.1)`,
          borderRadius: 10,
          padding: "8px 14px",
          fontSize: 13,
          fontWeight: 500,
          color: "rgba(255, 255, 255, 0.7)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
        }}
      >
        <LogOut size={14} strokeWidth={1.5} /> Logout
      </button>
    </div>
  </header>
);

// ── Mobile bottom nav ─────────────────────────────────────────────────────────
interface BottomNavProps {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  pending: number;
}

const NAV: { key: TabKey; Icon: React.ElementType; label: string }[] = [
  { key: "orders", Icon: ClipboardList, label: "Orders" },
  { key: "inventory", Icon: LayoutGrid, label: "Inventory" },
  { key: "history", Icon: History, label: "History" },
  { key: "carousel", Icon: Images, label: "Carousel" },
  { key: "tables", Icon: QrCode, label: "Tables" },
  { key: "logs", Icon: ClipboardList, label: "Logs" },
  { key: "settings", Icon: Settings, label: "Settings" },
];


export const AdminBottomNav = ({ tab, setTab, pending }: BottomNavProps) => (
  <nav
    className="adm-bottomnav no-scrollbar"
    style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: "rgba(20, 19, 19, 0.85)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderTop: `1px solid rgba(255, 255, 255, 0.08)`,
      display: "flex",
      overflowX: "auto",
      overflowY: "hidden",
      WebkitOverflowScrolling: "touch",
      padding: "10px 10px",
      paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
      gap: 6,
    }}
  >
    {NAV.map(({ key, Icon, label }) => {
      const active = tab === key;
      const badge = key === "orders" ? pending : 0;
      return (
        <button
          key={key}
          onClick={() => setTab(key)}
          style={{
            flex: "1 0 auto",
            minWidth: 72,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "8px 4px",
            border: "none",
            borderRadius: 12,
            background: active ? "rgba(255, 255, 255, 0.1)" : "transparent",
            color: active ? "#fff" : "rgba(255, 255, 255, 0.4)",
            fontSize: 11,
            fontWeight: active ? 600 : 500,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
            <AnimatePresence>
              {badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -10,
                    background: "#fff",
                    color: "#000",
                    borderRadius: "50%",
                    minWidth: 16,
                    height: 16,
                    fontSize: 9,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid rgba(20, 19, 19, 0.8)",
                  }}
                >
                  {badge}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <span>{label}</span>
          {active && (
            <motion.div
              layoutId="bottomNavDot"
              style={{
                position: "absolute",
                bottom: 2,
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#fff",
              }}
            />
          )}
        </button>
      );
    })}
  </nav>
);
