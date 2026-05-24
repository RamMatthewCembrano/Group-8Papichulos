import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AdminLog } from "@/types";
import { C } from "./constants";
import { Loader2, RefreshCw } from "lucide-react";
import { Btn } from "./AdminPrimitives";

export const AdminLogsManager = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setLogs(data as AdminLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
