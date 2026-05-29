import React, { useState, useEffect, useRef } from "react";
import { Loader2, Upload, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { C } from "./constants";
import { Btn, Lbl } from "./AdminPrimitives";
import { MenuItem } from "../types";

interface MenuItemModalProps {
  item: MenuItem | null; // null if adding new, otherwise the item to edit
  categories: string[];
  onClose: () => void;
  onSave: (savedItem: Partial<MenuItem>, isNew: boolean) => void;
}

export const MenuItemModal: React.FC<MenuItemModalProps> = ({
  item,
  categories,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<Partial<Omit<MenuItem, "price">> & { price?: string | number }>({});
  const [detailsText, setDetailsText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isNew = !item;

  useEffect(() => {
    if (item) {
      setForm({ ...item });
      setDetailsText(Array.isArray(item.details) ? item.details.join("\n") : "");
    } else {
      setForm({
        name: "",
        description: "",
        price: "",
        image: "/placeholder.svg",
        category: categories[0] ?? "Uncategorized",
        is_available: true,
      });
      setDetailsText("");
    }
  }, [item, categories]);

  const uploadImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const file = e.target.files[0];
    const path = `menu/${Date.now()}.${file.name.split(".").pop()}`;
    
    // Compress image before upload
    const options = {
      maxSizeMB: 0.2, // 200KB max size for menu items
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };
    const compressedFile = await imageCompression(file, options);

    const { error } = await supabase.storage.from("menu-items").upload(path, compressedFile, {
      cacheControl: "2592000",
      upsert: true,
    });
    if (!error) {
      const { data } = supabase.storage.from("menu-items").getPublicUrl(path);
      setForm((p) => ({ ...p, image: data.publicUrl }));
      toast.success("Photo updated");
    } else {
      toast.error("Upload failed: " + error.message);
      console.error("Supabase upload error:", error);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast.error("Item name is required");
      return;
    }
    if (form.price === "" || form.price === null || form.price === undefined) {
      toast.error("Price is required");
      return;
    }

    if (form.description) {
      const wordCount = form.description.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 50) {
        toast.error("Description cannot exceed 50 words");
        return;
      }
    }

    const details = detailsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const sanitized = {
      name: form.name.trim(),
      description: form.description?.trim() ?? "",
      price: Number(form.price) || 0,
      image: form.image ?? "/placeholder.svg",
      category: form.category ?? (categories[0] || "Uncategorized"),
      details: details.length > 0 ? details : null,
      is_available: form.is_available ?? true,
    };

    onSave(sanitized, isNew);
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          className="a-slide-up"
          style={{
            pointerEvents: "auto",
            width: "calc(100% - 36px)",
          maxWidth: 440,
          background: C.surface,
          borderRadius: 0,
          border: `1px solid ${C.border}`,
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>
            {isNew ? "Add Menu Item" : "Edit Menu Item"}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: C.faint,
              cursor: "pointer",
              padding: 4,
              display: "flex",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div
          style={{
            padding: 20,
            overflowY: "auto",
            display: "grid",
            gridAutoFlow: "row",
            alignContent: "start",
            gap: 16,
            flex: 1,
          }}
        >
          {/* Photo zone */}
          <input
            type="file"
            ref={fileRef}
            accept="image/*"
            onChange={uploadImg}
            style={{ display: "none" }}
          />
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              position: "relative",
              height: 160,
              flexShrink: 0,
              background: C.lift,
              cursor: "pointer",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${C.border}`,
            }}
          >
            {form.image && (
              <img
                src={form.image}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.3,
                }}
              />
            )}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                background: "transparent",
                padding: "9px 16px",
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 14,
                color: "#ffffff",
              }}
            >
              {uploading ? (
                <>
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />{" "}
                  Uploading…
                </>
              ) : (
                <>
                  <Upload size={14} strokeWidth={1.5} /> {form.image && form.image !== "/placeholder.svg" ? "Change photo" : "Upload photo"}
                </>
              )}
            </div>
          </div>

          <div>
            <Lbl t="Item Name" />
            <input
              className="input-papi"
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Classic Burger"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Lbl t="Price (₱)" />
              <input
                className="input-papi"
                type="number"
                value={form.price ?? ""}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Lbl t="Category" />
              <div style={{ position: "relative" }}>
                <select
                  className="input-papi"
                  value={form.category ?? ""}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ width: "100%", appearance: "none" }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: C.faint }}>
                  ▼
                </div>
              </div>
            </div>
          </div>

          <div>
            <Lbl t="Availability" />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setForm({ ...form, is_available: true })}
                style={{
                  flex: 1,
                  padding: "10px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: 0,
                  border: `1px solid ${form.is_available !== false ? C.ink : C.border}`,
                  background: form.is_available !== false ? C.ink : "transparent",
                  color: form.is_available !== false ? C.bg : C.mid,
                  transition: "all 0.15s",
                  fontFamily: "'Montserrat', sans-serif",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                In Stock
              </button>
              <button
                onClick={() => setForm({ ...form, is_available: false })}
                style={{
                  flex: 1,
                  padding: "10px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: 0,
                  border: `1px solid ${form.is_available === false ? "#ef4444" : C.border}`,
                  background: form.is_available === false ? "#ef4444" : "transparent",
                  color: form.is_available === false ? "#fff" : C.mid,
                  transition: "all 0.15s",
                  fontFamily: "'Montserrat', sans-serif",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Out of Stock
              </button>
            </div>
          </div>

          <div>
            <Lbl t="Description" />
            <textarea
              className="input-papi"
              style={{ minHeight: 90, resize: "vertical" }}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Briefly describe the item..."
            />
          </div>

          {/* Details / Tags */}
          <div>
            <Lbl t="Details" />
            <p style={{ fontSize: 11, color: C.faint, marginBottom: 6, lineHeight: 1.5 }}>
              One description per line — e.g. Spicy, Cold, Beef, Vegetarian…
            </p>
            <textarea
              className="input-papi"
              style={{ minHeight: 90, resize: "vertical", fontFamily: "monospace", fontSize: 13 }}
              value={detailsText}
              onChange={(e) => setDetailsText(e.target.value)}
              placeholder={`Spicy\nCold\nBeef`}
            />
            {/* Live preview tags */}
            {detailsText.trim() && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {detailsText
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: C.lift,
                        border: `1px solid ${C.border}`,
                        color: C.ink,
                        fontSize: 11,
                        fontWeight: 500,
                        padding: "3px 10px",
                        borderRadius: 2,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            background: C.lift,
          }}
        >
          <Btn v="ghost" onClick={onClose} sx={{ fontSize: 13, padding: "0 20px" }}>
            Cancel
          </Btn>
          <Btn onClick={handleSave} sx={{ fontSize: 13, padding: "0 24px" }}>
            <Check size={14} strokeWidth={2} style={{ marginRight: 6 }} />{" "}
            Save Changes
          </Btn>
        </div>
      </div>
      </div>
    </>
  );
};
