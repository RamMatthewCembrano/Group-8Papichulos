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
      {/* ── Revenue Board ── */}
      <div>
        <SectionLabel
          icon={<BadgeDollarSign size={13} strokeWidth={1.5} />}
          text="Revenue Board"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          <RevenueCard
            label={`Today · ${todayLabel}`}
            value={fmt(todayRevenue)}
            sub={`${todaySales} order${todaySales !== 1 ? "s" : ""} completed`}
            icon={<CalendarDays size={14} strokeWidth={1.5} />}
          />
          <RevenueCard
            label={`${monthName}`}
            value={fmt(monthRevenue)}
            sub={`${monthSales} order${monthSales !== 1 ? "s" : ""} completed`}
            icon={<CalendarRange size={14} strokeWidth={1.5} />}
          />
        </div>
      </div>

      {/* ── Sales Tracker ── */}
      <div>
        <SectionLabel
          icon={<TrendingUp size={13} strokeWidth={1.5} />}
          text="Sales Tracker"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          <SalesCard label="Daily Sales" value={todaySales} sub="today" />
          <SalesCard label="Monthly Sales" value={monthSales} sub={monthName} />
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div>
        <SectionLabel
          icon={<ClipboardList size={13} strokeWidth={1.5} />}
          text="Quick Stats"
        />
        <div
          className="adm-stats"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          {[
            {
              label: "Orders Today",
              value: orders.filter((o) => isToday(o.created_at)).length,
              icon: <ClipboardList size={15} strokeWidth={1.5} />,
            },
            {
              label: "Active",
              value: active,
              icon: <ShoppingBag size={15} strokeWidth={1.5} />,
            },
            {
              label: "Served Today",
              value: completed.filter((o) => isToday(o.created_at)).length,
              icon: <CheckCircle2 size={15} strokeWidth={1.5} />,
            },
            {
              label: "Menu Items",
              value: menuCount,
              icon: <LayoutGrid size={15} strokeWidth={1.5} />,
            },
          ].map((d) => (
            <div
              key={d.label}
              style={{
                background: C.surface,
                border: `1.5px solid ${C.border}`,
                borderRadius: 14,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <span style={{ color: C.faint }}>{d.icon}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: C.faint,
                  }}
                >
                  {d.label}
                </span>
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 300,
                  color: C.ink,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {d.value}
              </div>
            </div>
          ))}
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

const RevenueCard = ({
  label,
  value,
  sub,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent?: boolean;
}) => (
  <div
    style={{
      background: accent ? C.ink : C.surface,
      border: `1.5px solid ${accent ? C.ink : C.border}`,
      borderRadius: 16,
      padding: "18px 18px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
        color: accent ? "rgba(255,255,255,0.5)" : C.faint,
      }}
    >
      {icon}
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
    </div>
    <div
      style={{
        fontSize: 26,
        fontWeight: 300,
        color: accent ? C.white : C.ink,
        letterSpacing: "-0.03em",
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: 12,
        color: accent ? "rgba(255,255,255,0.4)" : C.faint,
        marginTop: 6,
      }}
    >
      {sub}
    </div>
  </div>
);

const SalesCard = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub: string;
}) => (
  <div
    style={{
      background: C.surface,
      border: `1.5px solid ${C.border}`,
      borderRadius: 16,
      padding: "18px 18px 16px",
    }}
  >
    <div
      style={{
        fontSize: 11,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: C.faint,
        marginBottom: 10,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 36,
        fontWeight: 300,
        color: C.ink,
        letterSpacing: "-0.03em",
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: 12,
        color: C.faint,
        marginTop: 6,
      }}
    >
      {sub}
    </div>
  </div>
);
