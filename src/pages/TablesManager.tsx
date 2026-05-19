
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

import { C } from "./constants";
import { Btn } from "./AdminPrimitives";

type TableRow = {
  id: string;
  table_number: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

const TablesManager = () => {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [newTable, setNewTable] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeTables = useMemo(
    () => tables.filter((t) => t.is_active).sort((a, b) => a.table_number - b.table_number),
    [tables],
  );

  const fetchTables = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tables")
      .select("id, table_number, is_active")
      .order("table_number", { ascending: true });

    if (error) {
      toast.error("Failed to load tables");
      setLoading(false);
      return;
    }

    setTables((data ?? []) as TableRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTables();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const normalizeNewTable = () => {
    const trimmed = newTable.trim();
    const n = parseInt(trimmed, 10);
    return Number.isFinite(n) ? n : null;
  };

  const parseRange = (input: string) => {
    // Supports formats like: "11-20" or "11 – 20" (en dash) or "11-20 "
    const s = input.trim().replace(/–/g, "-");
    const m = s.match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
    if (!m) return null;
    const start = parseInt(m[1], 10);
    const end = parseInt(m[2], 10);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    if (start <= 0 || end <= 0) return null;
    const a = Math.min(start, end);
    const b = Math.max(start, end);
    return { start: a, end: b };
  };

  const addTable = async () => {
    const range = parseRange(newTable);
    const n = normalizeNewTable();

    const targets: number[] = [];
    if (range) {
      for (let i = range.start; i <= range.end; i++) targets.push(i);
    } else if (n !== null) {
      if (n <= 0) {
        toast.error("Table number must be greater than 0");
        return;
      }
      targets.push(n);
    } else {
      toast.error('Enter a valid table number (e.g. 11) or range (e.g. "11-20")');
      return;
    }

    setSaving(true);

    // Upsert-by-manual approach to respect existing logic + keep UX simple
    for (const tableNumber of targets) {
      const existing = tables.find((t) => t.table_number === tableNumber);
      if (existing) {
        const { error } = await supabase
          .from("tables")
          .update({ is_active: true })
          .eq("id", existing.id);

        if (error) {
          toast.error(`Failed to activate table ${tableNumber}`);
          setSaving(false);
          return;
        }
      } else {
        const { error } = await supabase.from("tables").insert([
          {
            table_number: tableNumber,
            is_active: true,
          },
        ]);

        if (error) {
          toast.error(`Failed to add table ${tableNumber}`);
          setSaving(false);
          return;
        }
      }
    }

    toast.success(
      `Added/activated ${targets.length} table${targets.length !== 1 ? "s" : ""}`,
    );
    await fetchTables();
    setNewTable("");
    setSaving(false);
  };

  const deleteTable = async (row: TableRow) => {
    if (!window.confirm(`Delete table ${row.table_number}?`)) return;

    setDeletingId(row.id);
    // Prefer deactivating instead of deleting, to keep audit if needed.
    const { error } = await supabase
      .from("tables")
      .update({ is_active: false })
      .eq("id", row.id);

    if (error) {
      toast.error("Failed to remove table");
      setDeletingId(null);
      return;
    }

    toast.success(`Removed table ${row.table_number}`);
    await fetchTables();
    setDeletingId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          background: C.surface,
          border: `1.5px solid ${C.border}`,
          borderRadius: 14,
          padding: "18px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 6,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
              Manage Tables
            </div>
            <div style={{ fontSize: 13, color: C.faint, marginTop: 3 }}>
              Add/delete table numbers used for QR codes.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={newTable}
            onChange={(e) => setNewTable(e.target.value)}
            placeholder="e.g. 11"
            inputMode="numeric"
            style={{
              width: 140,
              padding: "10px 12px",
              borderRadius: 12,
              border: `1.5px solid ${C.border}`,
              outline: "none",
              fontSize: 14,
              background: "#fff",
              color: "#000",
              caretColor: "#000",
            }}
            disabled={saving}

          />

          <Btn onClick={addTable} disabled={saving} sx={{ fontSize: 14, padding: "11px 18px" }}>
            {saving ? (
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <>
                <Plus size={14} strokeWidth={1.5} /> Add Table
              </>
            )}
          </Btn>

          <div style={{ marginLeft: "auto", fontSize: 12, color: C.faint }}>
            Active: {activeTables.length}
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Btn
            onClick={() => (window.location.href = "/table-qrs")}
            sx={{ fontSize: 13, padding: "10px 14px" }}
            v="outline"
          >
            Open Table QR Page
          </Btn>

          <div style={{ fontSize: 12, color: C.faint }}>
            Examples: 11 (single) or 11-20 (range)
          </div>
        </div>
      </div>

      <div
        style={{
          background: C.surface,
          border: `1.5px solid ${C.border}`,
          borderRadius: 14,
          padding: "18px 20px",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: C.faint, textTransform: "uppercase" }}>
          Active tables
        </div>



        {loading ? (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : activeTables.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: C.faint }}>
            No active tables. Add one above.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
              marginTop: 12,
            }}
          >
            {activeTables.map((t) => (
              <div
                key={t.id}
                style={{
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
                    Table {t.table_number}
                  </div>
                  <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>
                    Used in QR printing
                  </div>
                </div>

                <button
                  onClick={() => deleteTable(t)}
                  disabled={deletingId === t.id}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: deletingId === t.id ? "not-allowed" : "pointer",
                    color: C.faint,
                    padding: 6,
                    borderRadius: 10,
                  }}
                >
                  {deletingId === t.id ? (
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Trash2 size={16} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: C.faint, lineHeight: 1.5 }}>
        Note: Deleting a table deactivates it (so it disappears from QR printing).
      </div>
    </div>
  );
};

export default TablesManager;

