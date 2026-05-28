import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type OrderStatus = "pending" | "preparing" | "ready_for_pickup" | "completed" | "cancelled";

export interface LiveOrder {
  id: string;
  status: OrderStatus;
  customer_name: string;
  table_number: string;
  created_at: string;
  order_items: { name: string; quantity: number; price: number }[];
  payment_method?: string;
}

const FIXED_WAIT_MINUTES = 15; // estimate for ~15–20 min range



export function useOrderStatus(orderId: string | null) {
  const [order, setOrder] = useState<LiveOrder | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchOrder = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("id, status, customer_name, table_number, created_at, order_items, payment_method")
        .eq("id", orderId)
        .single();

      if (!cancelled) {
        if (!error && data) {
          setOrder(data as LiveOrder);
        }
        setLoading(false);
      }
    };

    fetchOrder();
    return () => { cancelled = true; };
  }, [orderId]);

  // ── Real-time subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) return;

    const channelSuffix = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`order-tracker-${orderId}-${channelSuffix}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          if (payload.new && "id" in payload.new && payload.new.id === orderId) {
            setOrder((prev) =>
              prev ? { ...prev, ...(payload.new as Partial<LiveOrder>) } : prev
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Fixed 15–20 minute wait when pending

  const estimatedMinutes = order?.status === "pending" ? FIXED_WAIT_MINUTES : 0;

  return { order, loading, estimatedMinutes };
}
