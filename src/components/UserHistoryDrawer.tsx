import React, { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, Package, Clock, ChevronRight, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelectOrder: (orderId: string) => void;
  isPickup?: boolean;
}

const getHistoryKey = (isPickup: boolean) =>
  isPickup ? "papi_pickup_order_history" : "papi_order_history";

const UserHistoryDrawer = ({ open, onClose, onSelectOrder, isPickup = false }: UserHistoryDrawerProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchOrders();
    }
  }, [open]);

  const handleRemoveOrder = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();

    // Update local state to remove immediately
    setOrders(prev => prev.filter(o => o.id !== orderId));

    // Update localStorage
    const historyKey = getHistoryKey(isPickup);
    const historyStr = localStorage.getItem(historyKey);
    if (historyStr) {
      try {
        let historyIds = JSON.parse(historyStr);
        historyIds = historyIds.filter((id: string) => id !== orderId);
        localStorage.setItem(historyKey, JSON.stringify(historyIds));
      } catch (err) {
        console.error("Failed to parse history ids", err);
      }
    }
  };

  const fetchOrders = async () => {
    const historyKey = getHistoryKey(isPickup);
    const historyStr = localStorage.getItem(historyKey);
    if (!historyStr) {
      setOrders([]);
      return;
    }

    try {
      const historyIds = JSON.parse(historyStr);
      if (!Array.isArray(historyIds) || historyIds.length === 0) {
        setOrders([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("id", historyIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Error:", error.message);
        throw error;
      }

      if (data) setOrders(data);
    } catch (err) {
      console.error("Error fetching user history:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "preparing":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "cancelled":
        return "bg-red-500/10 text-red-600 border-red-200";
      case "ready_for_pickup":
        return "bg-purple-500/10 text-purple-600 border-purple-200";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[90vh]" style={{ backgroundColor: "#141313", border: "1px solid #444748", borderBottom: "none", borderRadius: 0 }}>
        <DrawerHeader style={{ borderBottom: "1px solid #444748", padding: "20px" }}>
          <div className="flex items-center justify-center gap-2">
            <History style={{ width: 18, height: 18, color: "#ffffff" }} />
            <DrawerTitle style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "14px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ffffff" }}>
              My Orders
            </DrawerTitle>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ffffff] border-t-transparent" />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#8e9192" }}>Fetching your history...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="h-16 w-16 bg-[#1c1b1b] border border-[#444748] rounded-full flex items-center justify-center">
                <Package className="h-8 w-8 text-[#8e9192]" />
              </div>
              <div className="space-y-1">
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>No orders yet</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#8e9192", maxWidth: "200px" }}>
                  Your order history will appear here once you place your first order.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-10">
              {orders.map((order) => {
                const date = new Date(order.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const time = new Date(order.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      onClose();
                      onSelectOrder(order.id);
                    }}
                    style={{
                      border: "1px solid #444748",
                      backgroundColor: "#1c1b1b",
                      borderRadius: 0,
                      cursor: "pointer",
                      padding: "16px",
                      transition: "border-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "#ffffff"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "#444748"}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "#8e9192" }}>
                        <Clock className="h-3.5 w-3.5" />
                        <span style={{ fontFamily: "'Inter', sans-serif" }}>{date} • {time}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={`rounded-none capitalize text-[10px] font-bold px-2.5 py-0.5 ${getStatusColor(order.status)}`}
                        >
                          {order.status === "ready_for_pickup" && (!order.table_number || (order.table_number !== "STORE-PICKUP" && !order.table_number.startsWith("PUP-")))
                            ? "ready to serve"
                            : order.status.replace("_", " ")}
                        </Badge>
                        {(order.status === "completed" || order.status === "cancelled") && (
                          <button
                            onClick={(e) => handleRemoveOrder(e, order.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              padding: "4px",
                              margin: "-4px",
                              cursor: "pointer",
                              color: "#8e9192",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "color 0.2s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "#8e9192"}
                            title="Remove from history"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "15px", fontWeight: 600, color: "#ffffff" }}>
                          {order.customer_name?.split(" (ID:")[0]}
                        </p>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#8e9192" }}>
                          {order.order_items?.length || 0} {order.order_items?.length === 1 ? 'Item' : 'Items'} • ₱{order.total_price}
                        </p>
                      </div>
                      <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#0a0a0a", border: "1px solid #444748" }}>
                        <ChevronRight size={16} style={{ color: "#ffffff" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

export default UserHistoryDrawer;
