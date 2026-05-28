import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { AdminLog } from "@/types";
import { C } from "./constants";
import { Loader2, RefreshCw, CalendarDays, CalendarSearch } from "lucide-react";
import { Btn } from "./AdminPrimitives";

export const AdminLogsManager = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "date" | "month" | "year">("all");
  const [filterValue, setFilterValue] = useState("");

  const dateInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("admin_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterType !== "all" && filterValue) {
      if (filterType === "date") {
        const start = new Date(filterValue);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filterValue);
        end.setHours(23, 59, 59, 999);
        query = query.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
      } else if (filterType === "month") {
        const [year, month] = filterValue.split("-");
        const start = new Date(parseInt(year), parseInt(month) - 1, 1);
        const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
        query = query.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
      } else if (filterType === "year") {
        const year = parseInt(filterValue);
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59, 999);
        query = query.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
      }
    } else {
      query = query.limit(200); // default limit when no filter
    }

    const { data, error } = await query;

    if (!error && data) {
      setLogs(data as AdminLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [filterType, filterValue]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        
        {/* Filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          
          <button
            onClick={() => {
              setFilterType("all");
              setFilterValue("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 18px",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 500,
              border: `1.5px solid ${filterType === "all" ? C.ink : C.border}`,
              background: filterType === "all" ? C.ink : C.surface,
              color: filterType === "all" ? C.white : C.mid,
              cursor: "pointer",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            All Time
          </button>

          <button
            onClick={() => {
              if (dateInputRef.current) {
                try {
                  dateInputRef.current.showPicker();
                } catch {
                  dateInputRef.current.click();
                }
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 18px",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 500,
              border: `1.5px solid ${filterType === "date" ? C.ink : C.border}`,
              background: filterType === "date" ? C.ink : C.surface,
              color: filterType === "date" ? C.white : C.mid,
              cursor: "pointer",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            <CalendarSearch size={14} strokeWidth={1.5} />
            {filterType === "date" && filterValue ? filterValue : "By Date"}
          </button>

          <button
            onClick={() => {
              if (monthInputRef.current) {
                try {
                  monthInputRef.current.showPicker();
                } catch {
                  monthInputRef.current.click();
                }
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 18px",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 500,
              border: `1.5px solid ${filterType === "month" ? C.ink : C.border}`,
              background: filterType === "month" ? C.ink : C.surface,
              color: filterType === "month" ? C.white : C.mid,
              cursor: "pointer",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            <CalendarDays size={14} strokeWidth={1.5} />
            {filterType === "month" && filterValue ? filterValue : "By Month"}
          </button>

          <select
            value={filterType === "year" ? filterValue : ""}
            onChange={(e) => {
              if (e.target.value) {
                setFilterType("year");
                setFilterValue(e.target.value);
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 18px",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 500,
              border: `1.5px solid ${filterType === "year" ? C.ink : C.border}`,
              background: filterType === "year" ? C.ink : C.surface,
              color: filterType === "year" ? C.white : C.mid,
              cursor: "pointer",
              transition: "all 0.15s",
              flexShrink: 0,
              outline: "none",
            }}
          >
            <option value="" disabled style={{ color: C.mid }}>By Year</option>
            {years.map((y) => (
              <option key={y} value={y.toString()} style={{ color: C.ink }}>
                {y}
              </option>
            ))}
          </select>

          {/* Hidden inputs */}
          <input
            ref={dateInputRef}
            type="date"
            onChange={(e) => {
              if (e.target.value) {
                setFilterType("date");
                setFilterValue(e.target.value);
              }
            }}
            style={{ position: "absolute", opacity: 0, width: 0, height: 0, padding: 0, border: 0 }}
          />
          <input
            ref={monthInputRef}
            type="month"
            onChange={(e) => {
              if (e.target.value) {
                setFilterType("month");
                setFilterValue(e.target.value);
              }
            }}
            style={{ position: "absolute", opacity: 0, width: 0, height: 0, padding: 0, border: 0 }}
          />
        </div>

        <Btn onClick={fetchLogs} v="outline" sx={{ fontSize: 13, padding: "8px 12px" }}>
          <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh
        </Btn>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.faint }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.faint }}>
          No logs found.
        </div>
      ) : (
        <div
          style={{
            background: C.surface,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.faint, fontSize: 13 }}>
                  <th style={{ padding: "16px 20px", fontWeight: 500 }}>Time</th>
                  <th style={{ padding: "16px 20px", fontWeight: 500 }}>Action</th>
                  <th style={{ padding: "16px 20px", fontWeight: 500 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      color: C.mid,
                      fontSize: 14,
                      transition: "background 0.2s",
                    }}
                  >
                    <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                      {new Date(log.created_at).toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ padding: "16px 20px", fontWeight: 500 }}>
                      {log.action}
                    </td>
                    <td style={{ padding: "16px 20px", color: C.faint }}>
                      {(() => {
                        const d = log.details;
                        if (!d) return "-";
                        if (d.includes(" | ID: ")) {
                          const [main, idStr] = d.split(" | ID: ");
                          return (
                            <div>
                              <span>{main}</span>
                              <details style={{ marginTop: 4 }}>
                                <summary style={{ cursor: "pointer", fontSize: 12, color: C.mid, userSelect: "none" }}>Show ID</summary>
                                <div style={{ marginTop: 4, fontSize: 12, background: C.lift, padding: "4px 8px", borderRadius: 4, display: "inline-block", color: C.ink }}>
                                  {idStr}
                                </div>
                              </details>
                            </div>
                          );
                        }
                        return d;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
