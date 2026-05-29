import { formatPrice } from "@/lib/utils";
import { Loader2, Upload, Pencil, Trash2, Check } from "lucide-react";
import { C } from "./constants";
import { Btn, Lbl, HR } from "./AdminPrimitives";
import { MenuItem } from "../types";

interface MenuCardProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
}

export const MenuItemCard = ({
  item,
  onEdit,
  onDelete,
}: MenuCardProps) => {
  // ── View mode ──────────────────────────────────────────────────────────────
  return (
    <div
      className="a-fade"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column", // ← makes card stretch full height
      }}
    >
      {/* Image */}
      <div
        style={{
          position: "relative",
          aspectRatio: "4/3",
          background: C.lift,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <img
          src={item.image}
          alt={item.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)",
          }}
        />
        <div style={{ position: "absolute", bottom: 10, left: 12, right: 12 }}>
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.75)",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}
          >
            {item.category}
          </span>
        </div>
      </div>

      {/* Info + actions — flex: 1 pushes buttons to bottom */}
      <div
        style={{
          padding: "14px 14px 16px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            alignItems: "flex-start",
            marginBottom: 5,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: C.ink,
              lineHeight: 1.3,
              flex: 1,
            }}
          >
            {item.name}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 400,
              color: C.ink,
              flexShrink: 0,
              letterSpacing: "-0.01em",
            }}
          >
            ₱{formatPrice(item.price)}
          </div>
        </div>

        <div
          style={{
            fontSize: 13,
            color: C.faint,
            lineHeight: 1.55,
            marginBottom: 14,
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.description}
        </div>

        {/* Buttons always at the bottom */}
        <div>
          <HR />
          <div style={{ display: "flex", gap: 8, paddingTop: 12, flexWrap: "wrap" }}>
            <Btn
              v="outline"
              onClick={onEdit}
              sx={{ flex: "1 1 80px", fontSize: 13, padding: "9px 8px", whiteSpace: "nowrap" }}
            >
              <Pencil size={13} strokeWidth={1.5} /> Edit
            </Btn>
            <Btn
              v="outline"
              onClick={onDelete}
              sx={{ flex: "1 1 40px", padding: "9px 8px", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.2)" }}
            >
              <Trash2 size={13} strokeWidth={1.5} color="#ef4444" />
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
};
