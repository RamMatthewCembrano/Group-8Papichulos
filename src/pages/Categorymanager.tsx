import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Tag, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { C } from "./constants";
import { Btn, Lbl } from "./AdminPrimitives";
import { logAdminAction } from "../lib/logger";

interface CategoryManagerProps {
  categories: string[];
  onClose: () => void;
  onCategoriesChange: (cats: string[]) => void;
}

export const CategoryManager = ({
  categories,
  onClose,
  onCategoriesChange,
}: CategoryManagerProps) => {
  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const addCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    if (categories.map((c) => c.toLowerCase()).includes(name.toLowerCase())) {
      toast.error("Category already exists");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("categories").insert([{ name }]);
    if (error) {
      toast.error("Failed to add category");
    } else {
      const updated = [...categories, name];
      onCategoriesChange(updated);
      setNewCat("");
      toast.success(`"${name}" added`);
      logAdminAction("Added Category", `Name: ${name}`);
    }
    setSaving(false);
  };

  const deleteCategory = async (name: string) => {
    // Check if any menu items use this category
    const { data: usedBy, error } = await supabase
      .from("menu_items")
      .select("id")
      .eq("category", name)
      .limit(1);

    if (error) {
      toast.error(`Error checking usage: ${error.message}`);
      return;
    }

    if (usedBy && usedBy.length > 0) {
      toast.error(`"${name}" is used by menu items. Reassign them first.`);
      return;
    }

    setConfirmDelete(name);
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const name = confirmDelete;
    setConfirmDelete(null);
    setDeleting(name);
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("name", name);
    if (error) {
      toast.error(`Failed: ${error.message}`);
    } else {
      onCategoriesChange(categories.filter((c) => c !== name));
      toast.success(`"${name}" removed`);
      logAdminAction("Deleted Category", `Name: ${name}`);
    }
    setDeleting(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
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
          style={{
            pointerEvents: "auto",
            width: "calc(100% - 36px)",
          maxWidth: 440,
          background: C.surface,
          borderRadius: 20,
          border: `1.5px solid ${C.border}`,
          boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 22px",
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Tag size={17} strokeWidth={1.5} color={C.mid} />
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: C.ink,
                letterSpacing: "-0.01em",
              }}
            >
              Manage Categories
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: C.lift,
              border: "none",
              borderRadius: 8,
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: C.mid,
            }}
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{ padding: "20px 22px", maxHeight: "60vh", overflowY: "auto" }}
        >
          {/* Add new */}
          <div style={{ marginBottom: 24 }}>
            <Lbl t="New Category" />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="e.g. Appetizers"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                style={{ flex: 1 }}
              />
              <Btn
                onClick={addCategory}
                disabled={saving || !newCat.trim()}
                sx={{ padding: "11px 16px", flexShrink: 0 }}
              >
                {saving ? (
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <>
                    <Plus size={14} strokeWidth={1.5} /> Add
                  </>
                )}
              </Btn>
            </div>
          </div>

          {/* Existing categories */}
          <Lbl t={`Categories (${categories.length})`} />
          {categories.length === 0 ? (
            <div
              style={{
                fontSize: 14,
                color: C.faint,
                padding: "20px 0",
                textAlign: "center",
              }}
            >
              No categories yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {categories.map((cat) => (
                <div
                  key={cat}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: C.lift,
                    borderRadius: 10,
                    padding: "11px 14px",
                    gap: 10,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: C.faint,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{ fontSize: 14, fontWeight: 500, color: C.body }}
                    >
                      {cat}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteCategory(cat)}
                    disabled={deleting === cat}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: C.faint,
                      display: "flex",
                      alignItems: "center",
                      padding: 4,
                      borderRadius: 6,
                      transition: "color 0.15s",
                    }}
                  >
                    {deleting === cat ? (
                      <Loader2
                        size={14}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      <Trash2 size={14} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 12, color: C.faint, lineHeight: 1.5 }}>
            Categories sync live to your menu page. Deleting a category in use
            by menu items is blocked.
          </div>
        </div>
      </div>
      </div>

      {/* Custom Confirmation Modal — Portal to body for true viewport centering */}
      {createPortal(
        <AnimatePresence>
          {confirmDelete && (
            <div key="delete-cat-modal" style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmDelete(null)}
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 9998,
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  pointerEvents: "auto",
                }}
              />
              <motion.div
                key="modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{
                  pointerEvents: "auto",
                  zIndex: 9999,
                  width: "calc(100% - 40px)",
                  maxWidth: 340,
                  background: "rgba(25, 24, 24, 0.98)",
                  borderRadius: 24,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
                  padding: "36px 24px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 18,
                    background: "rgba(239, 68, 68, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    color: "#ef4444",
                  }}
                >
                  <AlertTriangle size={30} />
                </div>

                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 8,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Delete Category?
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "rgba(255, 255, 255, 0.6)",
                    lineHeight: 1.6,
                    marginBottom: 32,
                  }}
                >
                  Are you sure you want to remove{" "}
                  <strong style={{ color: "#fff" }}>"{confirmDelete}"</strong>?
                  This action cannot be undone.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    width: "100%",
                  }}
                >
                  <button
                    onClick={executeDelete}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: 16,
                      border: "none",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 8px 20px rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    Yes, Delete Category
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: 16,
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
