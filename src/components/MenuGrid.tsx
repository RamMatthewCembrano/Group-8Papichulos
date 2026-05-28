import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import MenuCard from "./MenuCard";
import DishDetailModal from "./DishDetailModal";
import { MenuItem } from "@/contexts/CartContext";

const MenuGrid = () => {
  const [active, setActive] = useState("All");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const chipBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [{ data: menuData, error: menuError }, { data: catData }] =
        await Promise.all([
          supabase
            .from("menu_items")
            .select("*")
            .order("name", { ascending: true }),
          supabase
            .from("categories")
            .select("name")
            .order("name", { ascending: true }),
        ]);

      if (menuError) {
        console.error("Error fetching menu:", menuError.message);
      } else if (menuData) {
        setItems(menuData);
      }

      if (catData) {
        setCategories(catData.map((c: { name: string }) => c.name));
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const dynamicCategories = ["All", ...categories];

  const filtered =
    active === "All" ? items : items.filter((i) => i.category === active);

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 gap-6"
        style={{ backgroundColor: "#141313" }}
      >
        {/* Editorial loading skeleton */}
        <div
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.15em",
            color: "#8e9192",
            textTransform: "uppercase",
          }}
        >
          Loading Menu...
        </div>
        <div className="flex flex-col w-full max-w-lg px-5 gap-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="w-full animate-pulse"
              style={{
                aspectRatio: "3/4",
                backgroundColor: "#0e0e0e",
                border: "1px solid #444748",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section style={{ backgroundColor: "#141313" }}>
      {/* ── Category Chip Bar ─────────────────────────────────────── */}
      <div
        className="sticky top-16 z-30"
        style={{
          backgroundColor: "rgba(20, 19, 19, 0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #444748",
        }}
      >
        <div
          ref={chipBarRef}
          className="flex overflow-x-auto no-scrollbar px-5 py-3 gap-2"
        >
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              style={{
                whiteSpace: "nowrap",
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "8px 16px",
                border: active === cat ? "1px solid #ffffff" : "1px solid #444748",
                backgroundColor: active === cat ? "#ffffff" : "transparent",
                color: active === cat ? "#141313" : "#c4c7c8",
                cursor: "pointer",
                transition: "all 0.15s ease",
                borderRadius: 0,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (active !== cat) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#8e9192";
                  (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (active !== cat) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#444748";
                  (e.currentTarget as HTMLButtonElement).style.color = "#c4c7c8";
                }
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section Label ─────────────────────────────────────────── */}
      <div className="px-5 pt-8 pb-4">
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.15em",
            color: "#8e9192",
            textTransform: "uppercase",
          }}
        >
          {active === "All" ? "All Items" : active} — {filtered.length}{" "}
          {filtered.length === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="grid-responsive px-5 pb-20">
        {filtered.length > 0 ? (
          filtered.map((item, index) => (
            <MenuCard
              key={item.id}
              item={item}
              onSelect={() => setSelectedItem(item)}
              priority={index < 4}
            />
          ))
        ) : (
          <div
            className="py-20 text-center"
            style={{
              color: "#8e9192",
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              letterSpacing: "0.05em",
            }}
          >
            No items in this category.
          </div>
        )}
      </div>

      {/* ── Dish Detail Modal ──────────────────────────────────── */}
      <DishDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </section>
  );
};

export default MenuGrid;
