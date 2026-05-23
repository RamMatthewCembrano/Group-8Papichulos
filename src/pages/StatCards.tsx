import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import {
  TrendingUp,
  ClipboardList,
  ShoppingBag,
  CheckCircle2,
  LayoutGrid,
  CalendarDays,
  CalendarRange,
  BadgeDollarSign,
  ChevronDown,
} from "lucide-react";
import { C } from "./constants";
import { Order } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────────
const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const isThisMonth = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
export const StatCards = ({
  orders,
  menuCount,
}: {
  orders: Order[];
  menuCount: number;
}) => {
  const [quickStatsExpanded, setQuickStatsExpanded] = useState(false);
  const completed = orders.filter((o) => o.status === "completed");

  // ── Revenue ────────────────────────────────────────────────────────────────
  const todayRevenue = completed
    .filter((o) => isToday(o.created_at))
    .reduce((s, o) => s + Number(o.total_price), 0);

  const monthRevenue = completed
    .filter((o) => isThisMonth(o.created_at))
    .reduce((s, o) => s + Number(o.total_price), 0);

  // ── Sales counts ───────────────────────────────────────────────────────────
  const todaySales = completed.filter((o) => isToday(o.created_at)).length;
  const monthSales = completed.filter((o) => isThisMonth(o.created_at)).length;

  // ── Quick stats (original) ─────────────────────────────────────────────────
  const active = orders.filter(
    (o) => o.status === "pending" || o.status === "preparing",
  ).length;

  const fmt = (n: number) =>
    n >= 1000 ? `₱${(n / 1000).toFixed(1)}k` : `₱${formatPrice(n)}`;

  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" });
  const todayLabel = now.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        marginBottom: 28,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, alignItems: "start" }}>
        {/* ── Revenue Board ── */}
        <ExpandableStatCard
          title="Revenue Board"
          icon={<BadgeDollarSign size={15} strokeWidth={1.5} />}
          dailyLabel={`Today · ${todayLabel}`}
          dailyValue={fmt(todayRevenue)}
          dailySub={`${todaySales} order${todaySales !== 1 ? "s" : ""} completed`}
          monthlyLabel={`${monthName} Revenue`}
          monthlyValue={fmt(monthRevenue)}
          monthlySub={`${monthSales} order${monthSales !== 1 ? "s" : ""} completed`}
        />

        {/* ── Sales Tracker ── */}
        <ExpandableStatCard
          title="Sales Tracker"
          icon={<TrendingUp size={15} strokeWidth={1.5} />}
          dailyLabel="Daily Sales"
          dailyValue={todaySales}
          dailySub="today"
          monthlyLabel="Monthly Sales"
          monthlyValue={monthSales}
          monthlySub={monthName}
        />
      </div>

      {/* ── Quick Stats ── */}
      <div
        onClick={() => setQuickStatsExpanded(!quickStatsExpanded)}
        style={{
          background: C.surface,
          border: `1.5px solid ${C.border}`,
          borderRadius: 16,
          padding: "18px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          flexDirection: "column",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.mid }}>
            <ClipboardList size={15} strokeWidth={1.5} />
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Quick Stats</span>
          </div>
          <ChevronDown size={16} color={C.mid} style={{ transform: quickStatsExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
        </div>

        {/* Always visible items */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            {
              label: "Orders Today",
              value: orders.filter((o) => isToday(o.created_at)).length,
            },
            {
              label: "Menu Items",
              value: menuCount,
            },
          ].map((d) => (
            <div key={d.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: C.faint }}>
                {d.label}
              </div>
              <div style={{ fontSize: 32, fontWeight: 300, color: C.ink, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {d.value}
              </div>
            </div>
          ))}
        </div>

        {/* Expandable items */}
        <div style={{
          display: "grid",
          gridTemplateRows: quickStatsExpanded ? "1fr" : "0fr",
          transition: "grid-template-rows 0.2s ease",
        }}>
          <div style={{ overflow: "hidden" }}>
            <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                {
                  label: "Active",
                  value: active,
                },
                {
                  label: "Served Today",
                  value: completed.filter((o) => isToday(o.created_at)).length,
                },
              ].map((d) => (
                <div key={d.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: C.faint }}>
                    {d.label}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 300, color: C.ink, letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {d.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionLabel = ({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 10,
      color: C.mid,
    }}
  >
    {icon}
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: C.mid,
      }}
    >
      {text}
    </span>
  </div>
);

const ExpandableStatCard = ({
  title,
  icon,
  dailyLabel,
  dailyValue,
  dailySub,
  monthlyLabel,
  monthlyValue,
  monthlySub,
}: {
  title: string;
  icon: React.ReactNode;
  dailyLabel: string;
  dailyValue: string | number;
  dailySub: string;
  monthlyLabel: string;
  monthlyValue: string | number;
  monthlySub: string;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 16,
        padding: "18px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.mid }}>
          {icon}
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>{title}</span>
        </div>
        <ChevronDown size={16} color={C.mid} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: C.faint }}>
          {dailyLabel}
        </div>
        <div style={{ fontSize: 32, fontWeight: 300, color: C.ink, letterSpacing: "-0.03em", lineHeight: 1 }}>
          {dailyValue}
        </div>
        <div style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>
          {dailySub}
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateRows: expanded ? "1fr" : "0fr",
        transition: "grid-template-rows 0.2s ease",
      }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: C.faint }}>
              {monthlyLabel}
            </div>
            <div style={{ fontSize: 26, fontWeight: 300, color: C.ink, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {monthlyValue}
            </div>
            <div style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>
              {monthlySub}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
