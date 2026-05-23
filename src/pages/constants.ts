// ── Color tokens ──────────────────────────────────────────────────────────────
export const C = {
  bg:      "#141313",
  surface: "#1c1b1b", // lighter surface
  lift:    "#2a2a2a", // elevated inputs
  border:  "#444748",
  line:    "#353434",
  ink:     "#ffffff",
  body:    "#e5e2e1",
  mid:     "#c4c7c8",
  faint:   "#8e9192",
  white:   "#141313", // Inverted text color (dark text on white/ink backgrounds)
};

export const f = "'Inter', system-ui, -apple-system, sans-serif";
export const fHead = "'Montserrat', system-ui, -apple-system, sans-serif";

// ── Global CSS ─────────────────────────────────────────────────────────────────
export const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; margin: 0; padding: 0; }
  html { font-family: ${f}; background: ${C.bg}; -webkit-text-size-adjust: 100%; }
  body { overscroll-behavior-y: none; }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shake   { 0%,100%{transform:translateX(0)} 25%,75%{transform:translateX(-7px)} 50%{transform:translateX(7px)} }
  .a-shake { animation: shake 0.38s ease; }
  .a-fade  { animation: fadeUp 0.22s ease both; }
  input, select, textarea {
    font-family: ${f}; font-size: 15px; font-weight: 400; color: ${C.body};
    background: ${C.lift}; border: 1px solid ${C.border}; border-radius: 0px !important;
    padding: 12px 14px; width: 100%; outline: none;
    -webkit-appearance: none; appearance: none;
    transition: border-color 0.15s, box-shadow 0.15s; line-height: 1.5;
  }
  input:focus, select:focus, textarea:focus {
    border-color: ${C.ink}; box-shadow: 0 0 0 1px ${C.ink};
  }
  input::placeholder, textarea::placeholder { color: ${C.faint}; }
  ::-webkit-scrollbar { width: 0; height: 0; }
  button { font-family: ${fHead}; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 0px !important; }
  h1, h2, h3, h4, h5, h6 { font-family: ${fHead}; text-transform: uppercase; letter-spacing: -0.02em; }
  * { border-radius: 0px !important; }  @media (min-width: 768px) {
    .adm-layout     { display: flex !important; flex-direction: row !important; }
    .adm-sidebar    { display: flex !important; }
    .adm-bottomnav  { display: none !important; }
    .adm-topbar     { padding: 0 32px !important; }
    .adm-main       { margin-left: 240px; }
    .adm-content    { padding: 36px 40px 40px !important; max-width: 100%; }
    .adm-stats      { grid-template-columns: repeat(5, 1fr) !important; }
    .adm-menu-grid  { grid-template-columns: repeat(3, 1fr) !important; }
    .adm-filter-row { flex-wrap: nowrap !important; }
  }
  @media (min-width: 1200px) {
    .adm-menu-grid  { grid-template-columns: repeat(4, 1fr) !important; }
  }
`;

// ── Status map ────────────────────────────────────────────────────────────────
export const ST: Record<string, { label: string; fg: string; bg: string }> = {
  pending:   { label: "Pending",   fg: "#c4c7c8", bg: "#2a2a2a" },
  preparing: { label: "Preparing", fg: "#ffdad6", bg: "#93000a" },
  ready_for_pickup: { label: "Ready for Pickup", fg: "#e9d5ff", bg: "#581c87" },
  completed: { label: "Completed", fg: "#141313", bg: "#e2e2e2" },
  cancelled: { label: "Cancelled", fg: "#ffb4ab", bg: "#690005" },
};
export const getSt = (s: string) => ST[s] ?? ST.pending;

// ── Menu categories ───────────────────────────────────────────────────────────
export const CATS = ["Tacos", "Burritos", "Sides", "Drinks", "Desserts"];

// ── Order filter options ──────────────────────────────────────────────────────
export const ORDER_FILTERS    = ["all", "pending", "preparing", "ready_for_pickup", "pickup", "dine-in"];
export const HISTORY_FILTERS  = ["all", "completed", "cancelled"];