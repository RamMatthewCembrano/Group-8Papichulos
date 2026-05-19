import {
  ClipboardList,
  LayoutGrid,
  History,
  LogOut,
  Images,
  ExternalLink,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { C } from "./constants";

type TabKey = "orders" | "inventory" | "history" | "carousel" | "settings" | "tables";


interface AdminSidebarProps {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  pending: number;
  onLogout: () => void;
}

const NAV: { key: TabKey; Icon: React.ElementType; label: string }[] = [
  { key: "orders", Icon: ClipboardList, label: "Orders" },
  { key: "inventory", Icon: LayoutGrid, label: "Inventory" },
  { key: "history", Icon: History, label: "History" },
  { key: "carousel", Icon: Images, label: "Carousel" },
  { key: "tables", Icon: LayoutGrid, label: "Tables" },
  { key: "settings", Icon: Settings, label: "Settings" },
];

export const AdminSidebar = ({
  tab,
  setTab,
  pending,
  onLogout,
}: AdminSidebarProps) => (
  <aside
    className="adm-sidebar"
    style={{
      display: "flex",
      width: 240,
      flexShrink: 0,
      background: "rgba(20, 19, 19, 0.8)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderRight: `1px solid rgba(255, 255, 255, 0.08)`,
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 40,
      flexDirection: "column",
      padding: "28px 0",
    }}
  >
    {/* Logo + active count */}
    <div style={{ padding: "0 24px 28px", borderBottom: `1px solid rgba(255, 255, 255, 0.08)` }}>
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}
      >
        <img
          src="/PAPICHOLOS-LOGO-menu.webp"
          alt="Papicholo's CDO"
          style={{ width: "100%", height: "auto", objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}
        />
      </div>
      <AnimatePresence>
        {pending > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              textAlign: "center",
            }}
          >
            <span style={{ color: "#fff", fontWeight: 600 }}>{pending}</span>{" "}
            pending order{pending !== 1 ? "s" : ""}
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Nav */}
    <nav style={{ padding: "16px 12px", flex: 1 }}>
      {NAV.map(({ key, Icon, label }) => {
        const active = tab === key;
        const badge = key === "orders" ? pending : 0;
        return (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              marginBottom: 4,
              background: active ? "rgba(255, 255, 255, 0.08)" : "transparent",
              color: active ? "#fff" : "rgba(255, 255, 255, 0.5)",
              fontSize: 14,
              fontWeight: active ? 600 : 500,
              textAlign: "left",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {active && (
              <motion.div
                layoutId="activeNav"
                style={{
                  position: "absolute",
                  left: 0,
                  top: "20%",
                  bottom: "20%",
                  width: 3,
                  background: "#fff",
                  borderRadius: "0 4px 4px 0",
                }}
              />
            )}
            <Icon size={18} strokeWidth={active ? 2 : 1.5} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge > 0 && (
              <span
                style={{
                  background: active ? "#fff" : "rgba(255, 255, 255, 0.15)",
                  color: active ? "#000" : "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 6,
                  minWidth: 18,
                  textAlign: "center",
                }}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>

    {/* Footer */}
    <div style={{ padding: "16px 12px", borderTop: `1px solid rgba(255, 255, 255, 0.08)` }}>
      <button
        onClick={() => (window.location.href = "/")}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 8,
          border: "none",
          background: "transparent",
          color: "rgba(255, 255, 255, 0.4)",
          fontSize: 13,
          fontWeight: 400,
          marginBottom: 4,
          cursor: "pointer",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)")}
      >
        <ExternalLink size={14} />
        View Live Site
      </button>
      <button
        onClick={onLogout}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 8,
          border: "none",
          background: "transparent",
          color: "rgba(255, 255, 255, 0.4)",
          fontSize: 13,
          fontWeight: 400,
          cursor: "pointer",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ff4d4d")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)")}
      >
        <LogOut size={14} strokeWidth={1.5} /> Logout
      </button>
    </div>
  </aside>
);
