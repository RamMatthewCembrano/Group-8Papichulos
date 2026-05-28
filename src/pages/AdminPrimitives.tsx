import React from "react";
import { C, f, getSt } from "./constants";

// ── Status Pill ───────────────────────────────────────────────────────────────
export const Pill = ({ status, isPickup }: { status: string; isPickup?: boolean }) => {
  const s = getSt(status);
  const label = status === "ready_for_pickup" && isPickup === false ? "Ready to Serve" : s.label;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        color: s.fg,
        background: s.bg,
        padding: "4px 10px",
        borderRadius: 0,
        whiteSpace: "nowrap",
        flexShrink: 0
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: 0,
          background: s.fg,
          opacity: 0.55,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
};

// ── Button ────────────────────────────────────────────────────────────────────
type BV = "primary" | "outline" | "ghost";

export const Btn = ({
  children,
  onClick,
  v = "primary",
  full = false,
  disabled = false,
  sx = {},
  submit = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  v?: BV;
  full?: boolean;
  disabled?: boolean;
  sx?: React.CSSProperties;
  submit?: boolean;
}) => {
  const vs: Record<BV, React.CSSProperties> = {
    primary: { background: C.ink, color: C.white, border: "none" },
    outline: {
      background: C.white,
      color: C.body,
      border: `1px solid ${C.border}`,
    },
    ghost: {
      background: "transparent",
      color: C.mid,
      border: `1px solid ${C.border}`,
    },
  };
  return (
    <button
      type={submit ? "submit" : "button"}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "11px 18px",
        fontSize: 14,
        fontWeight: 600,
        borderRadius: 0,
        letterSpacing: "0.05em",
        transition: "opacity 0.15s",
        fontFamily: f,
        opacity: disabled ? 0.4 : 1,
        width: full ? "100%" : undefined,
        ...vs[v],
        ...sx,
      }}
    >
      {children}
    </button>
  );
};

// ── Field label ───────────────────────────────────────────────────────────────
export const Lbl = ({ t }: { t: string }) => (
  <div
    style={{
      fontSize: 11,
      fontWeight: 500,
      color: C.faint,
      textTransform: "uppercase",
      letterSpacing: "0.09em",
      marginBottom: 7,
    }}
  >
    {t}
  </div>
);

// ── Divider ───────────────────────────────────────────────────────────────────
export const HR = ({ my = 0 }: { my?: number }) => (
  <div style={{ height: 1, background: C.line, margin: `${my}px 0` }} />
);
