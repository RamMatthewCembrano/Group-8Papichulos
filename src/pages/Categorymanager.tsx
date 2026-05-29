import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Tag, Loader2, AlertTriangle, GripVertical, Edit2, Save } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
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
    if (name.length > 15) {
      toast.error("Category name must be 15 characters or less");
      return;
    }
    if (categories.map((c) => c.toLowerCase()).includes(name.toLowerCase())) {
      toast.error("Category already exists");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("categories").insert([{ name, sort_order: categories.length }]);
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

  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Optimistic UI update
    onCategoriesChange(items);

    // Background DB update
    try {
      for (let i = 0; i < items.length; i++) {
        await supabase.from("categories").update({ sort_order: i }).eq("name", items[i]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveEdit = async (oldName: string) => {
    const newName = editValue.trim();
    if (!newName || newName === oldName) {
      setEditingCat(null);
      return;
    }
    if (newName.length > 15) {
      toast.error("Category name must be 15 characters or less");
      return;
    }
    if (categories.map((c) => c.toLowerCase()).includes(newName.toLowerCase())) {
      toast.error("Category name already exists");
      return;
    }

    setSaving(true);
    // 1. Update in categories table
    const { error: catError } = await supabase.from("categories").update({ name: newName }).eq("name", oldName);
    if (catError) {
      toast.error("Failed to rename category");
      setSaving(false);
      return;
    }

    // 2. Cascade to menu items
    await supabase.from("menu_items").update({ category: newName }).eq("category", oldName);

    // Update local state
    const updated = categories.map(c => c === oldName ? newName : c);
    onCategoriesChange(updated);
    setEditingCat(null);
    setSaving(false);
    toast.success("Category renamed");
    logAdminAction("Renamed Category", `From '${oldName}' to '${newName}'`);
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
                maxLength={15}
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
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories-list">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {categories.map((cat, index) => (
                      <Draggable key={cat} draggableId={cat} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: snapshot.isDragging ? C.surface : C.lift,
                              borderRadius: 10,
                              padding: "11px 14px",
                              gap: 10,
                              border: snapshot.isDragging ? `1px solid ${C.ink}` : "1px solid transparent",
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                              <div {...provided.dragHandleProps} style={{ cursor: "grab", display: "flex", alignItems: "center", color: C.faint }}>
                                <GripVertical size={16} strokeWidth={1.5} />
                              </div>
                              
                              {editingCat === cat ? (
                                <input
                                  autoFocus
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit(cat);
                                    if (e.key === "Escape") setEditingCat(null);
                                  }}
                                  style={{
                                    flex: 1,
                                    background: C.surface,
                                    border: `1px solid ${C.border}`,
                                    color: C.ink,
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    fontSize: 14,
                                    outline: "none"
                                  }}
                                  maxLength={15}
                                />
                              ) : (
                                <span style={{ fontSize: 14, fontWeight: 500, color: C.body, flex: 1 }}>
                                  {cat}
                               </span>
                              )}
                            </div>
                            
                            <div style={{ display: "flex", gap: 4 }}>
                              {editingCat === cat ? (
                                <>
                                  <button onClick={() => saveEdit(cat)} disabled={saving} style={{ background: "none", border: "none", cursor: "pointer", color: "#10B981", padding: 4 }}>
                                    <Save size={14} strokeWidth={1.5} />
                                  </button>
                                  <button onClick={() => setEditingCat(null)} disabled={saving} style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 4 }}>
                                    <X size={14} strokeWidth={1.5} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => { setEditingCat(cat); setEditValue(cat); }}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 4 }}
                                  >
                                    <Edit2 size={14} strokeWidth={1.5} />
                                  </button>
                                  <button
                                    onClick={() => deleteCategory(cat)}
                                    disabled={deleting === cat}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 4 }}
                                  >
                                    {deleting === cat ? (
                                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                                    ) : (
                                      <Trash2 size={14} strokeWidth={1.5} />
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
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
