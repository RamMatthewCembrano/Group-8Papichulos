// ── TableQRs.tsx ──────────────────────────────────────────────────────────────
// Access this page at /table-qrs (admin only, not linked publicly)
// Print this page to get all 10 QR codes ready for each table.
// Each QR links to: https://papicholoscdo.vercel.app/?table=N

const BASE_URL = "https://papicholoscdo.vercel.app";
const TABLE_COUNT = 10;

// Uses Google Charts QR API — no library needed
const qrUrl = (table: number) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    `${BASE_URL}/?table=${table}`,
  )}`;

const TableQRs = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7f7",
        padding: "40px 24px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <img
          src="/PAPICHOLOS-LOGO-menu.webp"
          alt="Papicholo's CDO"
          style={{ height: 80, objectFit: "contain", marginBottom: 12 }}
        />
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "#0A0A0A",
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}
        >
          Table QR Codes
        </h1>
        <p style={{ fontSize: 14, color: "#AAAAAA" }}>
          Print and place each QR code on its corresponding table. Customers
          scan to order directly.
        </p>
        <button
          onClick={() => window.print()}
          style={{
            marginTop: 16,
            padding: "10px 24px",
            borderRadius: 99,
            background: "#0A0A0A",
            color: "#fff",
            border: "none",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          🖨️ Print All QR Codes
        </button>
      </div>

      {/* QR Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 20,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((table) => (
          <div
            key={table}
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1.5px solid #E8E8E8",
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              pageBreakInside: "avoid",
            }}
          >
            {/* Table number */}
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#AAAAAA",
              }}
            >
              Table
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 300,
                color: "#0A0A0A",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {table}
            </div>

            {/* QR code */}
            <img
              src={qrUrl(table)}
              alt={`QR for Table ${table}`}
              style={{
                width: 180,
                height: 180,
                borderRadius: 8,
              }}
            />

            {/* URL label */}
            <div
              style={{
                fontSize: 11,
                color: "#AAAAAA",
                textAlign: "center",
                wordBreak: "break-all",
              }}
            >
              {BASE_URL}/?table={table}
            </div>

            {/* Scan instruction */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#5A5A5A",
                textAlign: "center",
              }}
            >
              Scan to order from this table
            </div>
          </div>
        ))}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          button { display: none !important; }
          body { background: white; }
          div { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default TableQRs;
