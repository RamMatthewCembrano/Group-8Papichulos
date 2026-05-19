import { formatPrice } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ImageIcon, UploadCloud, Loader2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ── shadcn Select imports (unchanged) ────────────────────────────────
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CheckoutDrawerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
  isPickup?: boolean;
}

const CheckoutDrawer = ({ open, onClose, onConfirm, isPickup = false }: CheckoutDrawerProps) => {
  const { totalPrice, clearCart, items } = useCart();
  const [name, setName] = useState("");
  const [payment, setPayment] = useState(isPickup ? "gcash" : "counter");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutFee, setCheckoutFee] = useState<number>(0);
  const [qrTimestamp] = useState(Date.now());

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.storage.from("menu-items").download("settings/checkout-fee.json");
        if (error) return;
        const text = await data.text();
        const json = JSON.parse(text);
        if (json.fee !== undefined) {
           setCheckoutFee(Number(json.fee) || 0);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchSettings();
  }, []);

  const finalPrice = totalPrice + checkoutFee;

  // ── Read table number from URL ?table=X automatically ─────────────
  const urlTable =
    new URLSearchParams(window.location.search).get("table") ?? "";
  const [tableNumber, setTableNumber] = useState(() => 
    isPickup ? `PUP-${Math.random().toString(36).substring(2, 6).toUpperCase()}` : urlTable
  );
  const tableFromUrl = !!urlTable || isPickup;

  const [tableOptions, setTableOptions] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("tables")
          .select("table_number")
          .eq("is_active", true)
          .order("table_number", { ascending: true });

        if (error) return;

        const numbers = (data ?? [])
          .map((r: { table_number: number }) => r.table_number)
          .filter((n: number) => Number.isFinite(n));

        // Customer selection should only show currently active dine-in tables.
        if (mounted) setTableOptions(numbers.map((n: number) => n.toString()));
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tableNumber) {
      toast.error("Please select a table number.");
      return;
    }

    if (payment === "gcash" && !receipt) {
      toast.error("Please upload your GCash receipt to proceed.");
      return;
    }

    setIsSubmitting(true);

    try {
      let receiptUrl = "";

      if (payment === "gcash" && receipt) {
        const fileExt = receipt.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("menu-items")
          .upload(filePath, receipt);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("menu-items")
          .getPublicUrl(filePath);

        receiptUrl = urlData.publicUrl;
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_name: name,
            table_number: tableNumber,
            total_price: finalPrice,
            payment_method: payment,
            receipt_url: receiptUrl,
            status: "pending",
            order_items: items,
          },
        ])
        .select("id")
        .single();

      if (orderError) throw orderError;

      const newOrderId = orderData?.id as string;
      // Persist for accountless tracking
      const activeOrderKey = isPickup ? "papi_pickup_active_order_id" : "papi_active_order_id";
      const historyKey = isPickup ? "papi_pickup_order_history" : "papi_order_history";

      localStorage.setItem(activeOrderKey, newOrderId);
      
      const historyStr = localStorage.getItem(historyKey);
      const history = historyStr ? JSON.parse(historyStr) : [];
      if (!history.includes(newOrderId)) {
        history.unshift(newOrderId);
        localStorage.setItem(historyKey, JSON.stringify(history));
      }

      // Persist selected table so Admin Tables tab can mirror the customer's table.
      // Dine-in uses numeric table; pickup uses the generated PUP-XXXX code.
      try {
        const dineInTableNumber = !isPickup ? tableNumber : "";
        const pickupCode = isPickup ? tableNumber : "";
        localStorage.setItem("papi_current_table_number", dineInTableNumber);
        localStorage.setItem("papi_current_pickup_code", pickupCode);
      } catch {
        // ignore storage errors (private mode etc.)
      }

      toast.success("Order placed successfully!");
      clearCart();
      onConfirm(newOrderId);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error("Error: " + message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Shared label style ─────────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#8e9192",
    display: "block",
    marginBottom: "8px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#0a0a0a",
    border: "1px solid #444748",
    borderRadius: 0,
    color: "#ffffff",
    padding: "12px 14px",
    fontFamily: "'Inter', sans-serif",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.15s ease",
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && !isSubmitting && onClose()}>
      <DrawerContent
        style={{
          backgroundColor: "#141313",
          border: "1px solid #444748",
          borderBottom: "none",
          borderRadius: 0,
          maxHeight: "95vh",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <DrawerHeader
          style={{
            borderBottom: "1px solid #444748",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <DrawerTitle
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#ffffff",
            }}
          >
            Confirm Your Order
          </DrawerTitle>
        </DrawerHeader>

        {/* ── Form ───────────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Name + Table grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Name */}
            <div>
              <label htmlFor="name" style={labelStyle}>Your Name</label>
              <input
                id="name"
                type="text"
                placeholder="Juan D."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                style={inputStyle}
                onFocus={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor = "#ffffff";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor = "#444748";
                }}
              />
            </div>

            {/* Table Number */}
            <div>
              <label htmlFor="table" style={labelStyle}>Table #</label>
              {tableFromUrl ? (
                <div
                  style={{
                    ...inputStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#1c1b1b",
                    borderColor: "#ffffff",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#ffffff" }}>
                    {isPickup ? `Pickup Code: ${tableNumber}` : `Table ${tableNumber}`}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#8e9192",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {isPickup ? "TRACKING ID" : "via QR"}
                  </span>
                </div>
              ) : (
                <Select
                  value={tableNumber}
                  onValueChange={setTableNumber}
                  disabled={isSubmitting}
                  required
                >
                  <SelectTrigger
                    style={{
                      ...inputStyle,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      backgroundColor: "#141313",
                      border: "1px solid #444748",
                      borderRadius: 0,
                    }}
                  >
                    {tableOptions.map((num) => (
                      <SelectItem
                        key={num}
                        value={num}
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          color: "#ffffff",
                          borderRadius: 0,
                        }}
                      >
                        Table {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label style={labelStyle}>Payment Method</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Pay at Counter (hidden for pickup) */}
              {!isPickup && (
                <button
                  type="button"
                  onClick={() => setPayment("counter")}
                  disabled={isSubmitting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "16px",
                    backgroundColor:
                      payment === "counter" ? "#1c1b1b" : "#0a0a0a",
                    border:
                      payment === "counter"
                        ? "1px solid #ffffff"
                        : "1px solid #444748",
                    borderRadius: 0,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      border: "1px solid",
                      borderColor: payment === "counter" ? "#ffffff" : "#444748",
                      borderRadius: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {payment === "counter" && (
                      <Check
                        style={{ width: "12px", height: "12px", color: "#ffffff" }}
                        strokeWidth={3}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#ffffff",
                    }}
                  >
                    Pay at Counter
                  </span>
                </button>
              )}

              {/* GCash / Online */}
              <button
                type="button"
                onClick={() => setPayment("gcash")}
                disabled={isSubmitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "16px",
                  backgroundColor:
                    payment === "gcash" ? "#1c1b1b" : "#0a0a0a",
                  border:
                    payment === "gcash"
                      ? "1px solid #ffffff"
                      : "1px solid #444748",
                  borderRadius: 0,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "1px solid",
                    borderColor: payment === "gcash" ? "#ffffff" : "#444748",
                    borderRadius: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {payment === "gcash" && (
                    <Check
                      style={{ width: "12px", height: "12px", color: "#ffffff" }}
                      strokeWidth={3}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#c6c6c7",
                  }}
                >
                  GCash / Online
                </span>
              </button>
            </div>
          </div>

          {/* GCash QR + Receipt Upload */}
          {payment === "gcash" && (
            <div
              style={{
                backgroundColor: "#0a0a0a",
                border: "1px solid #444748",
                borderRadius: 0,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                animation: "fadeIn 0.25s ease",
              }}
            >
              {/* QR Section */}
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <p style={{ ...labelStyle, marginBottom: 0 }}>Scan to Pay via GCash</p>
                <div
                  style={{
                    width: "160px",
                    height: "160px",
                    backgroundColor: "#ffffff",
                    border: "2px solid #ffffff",
                    borderRadius: 0,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={`${supabase.storage.from("menu-items").getPublicUrl("settings/gcash-qr.jpg").data.publicUrl}?t=${qrTimestamp}`}
                    alt="GCash QR Code"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    onError={(e) => {
                      e.currentTarget.src = "/gcash-qr.jpg";
                    }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  Papicholo's CDO
                </p>
              </div>

              {/* Receipt Upload */}
              <div>
                <label htmlFor="receipt" style={labelStyle}>
                  Attach Receipt
                </label>
                <input
                  type="file"
                  id="receipt"
                  accept="image/*"
                  onChange={(e) =>
                    setReceipt(e.target.files ? e.target.files[0] : null)
                  }
                  style={{ display: "none" }}
                  required={payment === "gcash"}
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="receipt"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "20px",
                    border: "1px dashed #444748",
                    borderRadius: 0,
                    cursor: "pointer",
                    transition: "border-color 0.15s ease, background 0.15s ease",
                    backgroundColor: receipt ? "#1c1b1b" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLLabelElement).style.borderColor = "#8e9192";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLLabelElement).style.borderColor = "#444748";
                  }}
                >
                  {receipt ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#e5e2e1",
                      }}
                    >
                      <ImageIcon style={{ width: "18px", height: "18px" }} />
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "13px",
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {receipt.name}
                      </span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud
                        style={{ width: "20px", height: "20px", color: "#8e9192" }}
                      />
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "12px",
                          color: "#8e9192",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Click to upload screenshot
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* ── Footer ───────────────────────────────────────────── */}
          <DrawerFooter style={{ padding: "0", marginTop: "auto" }}>
            <div
              style={{
                borderTop: "1px solid #444748",
                paddingTop: "20px",
                marginBottom: "16px",
              }}
            >
              {checkoutFee > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#8e9192", fontFamily: "'Inter', sans-serif" }}>Subtotal</span>
                  <span style={{ fontSize: "12px", color: "#ffffff", fontFamily: "'Inter', sans-serif" }}>₱{formatPrice(totalPrice)}</span>
                </div>
              )}
              {checkoutFee > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#8e9192", fontFamily: "'Inter', sans-serif" }}>Checkout Fee</span>
                  <span style={{ fontSize: "12px", color: "#ffffff", fontFamily: "'Inter', sans-serif" }}>₱{formatPrice(checkoutFee)}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: checkoutFee > 0 ? "1px solid #444748" : "none",
                  paddingTop: checkoutFee > 0 ? "16px" : "0",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#8e9192",
                  }}
                >
                  Total to Pay
                </span>
                <span
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#ffffff",
                    letterSpacing: "-0.03em",
                  }}
                >
                  ₱{formatPrice(finalPrice)}
                </span>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                backgroundColor: "#ffffff",
                color: "#141313",
                border: "none",
                borderRadius: 0,
                padding: "20px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
                height: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    style={{ width: "14px", height: "14px" }}
                    className="animate-spin"
                  />
                  Processing...
                </>
              ) : payment === "gcash" ? (
                "Submit Receipt & Order"
              ) : (
                "Place Order"
              )}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default CheckoutDrawer;
