import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, UploadCloud, Image as ImageIcon, Save } from "lucide-react";
import { C } from "./constants";
import { Btn, Lbl } from "./AdminPrimitives";
import { logAdminAction } from "../lib/logger";

export function SettingsManager() {
  const [uploading, setUploading] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());
  const [checkoutFee, setCheckoutFee] = useState<string>("0");
  const [savingFee, setSavingFee] = useState(false);
  const [gcashDetails, setGcashDetails] = useState<string>("");
  const [savingDetails, setSavingDetails] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch the checkout fee
    const fetchFee = async () => {
      try {
        const { data, error } = await supabase.storage.from("menu-items").download("settings/checkout-fee.json");
        if (error) {
           return;
        }
        const text = await data.text();
        const json = JSON.parse(text);
        if (json.fee !== undefined) {
           setCheckoutFee(json.fee.toString());
        }
      } catch (err) {
        console.error("Failed to load checkout fee:", err);
      }
    };
    const fetchDetails = async () => {
      try {
        const { data, error } = await supabase.storage.from("menu-items").download("settings/gcash-details.json");
        if (error) return;
        const text = await data.text();
        const json = JSON.parse(text);
        if (json.details !== undefined) {
           setGcashDetails(json.details);
        }
      } catch (err) {
        console.error("Failed to load GCash details:", err);
      }
    };
    fetchFee();
    fetchDetails();
  }, []);

  const handleSaveFee = async () => {
    setSavingFee(true);
    try {
      const blob = new Blob([JSON.stringify({ fee: parseFloat(checkoutFee) || 0 })], { type: 'application/json' });
      const { error } = await supabase.storage
        .from("menu-items")
        .upload("settings/checkout-fee.json", blob, { upsert: true, cacheControl: '0' });
      
      if (error) throw error;
      toast.success("Checkout fee saved!");
      logAdminAction("Updated Checkout Fee", `Set to ₱${parseFloat(checkoutFee) || 0}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save fee");
    } finally {
      setSavingFee(false);
    }
  };

  const handleSaveDetails = async () => {
    setSavingDetails(true);
    try {
      const blob = new Blob([JSON.stringify({ details: gcashDetails })], { type: 'application/json' });
      const { error } = await supabase.storage
        .from("menu-items")
        .upload("settings/gcash-details.json", blob, { upsert: true, cacheControl: '0' });
      
      if (error) throw error;
      toast.success("GCash Details saved!");
      logAdminAction("Updated GCash Details", `Set to '${gcashDetails}'`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save details");
    } finally {
      setSavingDetails(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const path = `settings/gcash-qr.jpg`;

    try {
      const { error } = await supabase.storage
        .from("menu-items")
        .upload(path, file, { upsert: true, cacheControl: '0' });

      if (error) throw error;
      
      toast.success("QR Code updated successfully!");
      logAdminAction("Updated QR Code", `File: ${file.name}`);
      setTimestamp(Date.now()); // cache bust
    } catch (err: any) {
      toast.error(err.message || "Failed to upload QR Code");
    } finally {
      setUploading(false);
    }
  };

  const qrUrl = supabase.storage.from("menu-items").getPublicUrl("settings/gcash-qr.jpg").data.publicUrl;

  return (
    <div className="a-fade" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* GCash QR Code Section */}
      <div style={{ background: C.surface, padding: "24px", border: `1px solid ${C.border}`, borderRadius: 0 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 4, letterSpacing: "-0.01em" }}>GCash QR Code</h2>
        <p style={{ fontSize: 14, color: C.faint, marginBottom: 24 }}>Manage the GCash QR code displayed during checkout.</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Lbl t="Current QR Code" />
            <div 
              style={{
                width: "100%",
                maxWidth: 300,
                aspectRatio: "1",
                background: C.lift,
                border: `2px dashed ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
              className="group"
            >
              {uploading ? (
                <Loader2 size={32} color={C.faint} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <>
                  <img 
                    src={`${qrUrl}?t=${timestamp}`} 
                    alt="GCash QR" 
                    style={{ width: "100%", height: "100%", objectFit: "contain", padding: 16 }}
                    onError={(e) => {
                      e.currentTarget.src = "/gcash-qr.jpg";
                    }}
                  />
                  <div 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    <Btn v="outline" onClick={() => fileRef.current?.click()} sx={{ fontSize: 13, padding: "8px 14px" }}>
                      <UploadCloud size={16} />
                      Change QR
                    </Btn>
                  </div>
                </>
              )}
            </div>
          </div>

          <input 
            type="file" 
            ref={fileRef} 
            accept="image/*" 
            style={{ display: "none" }}
            onChange={handleUpload} 
          />
          
          <Btn 
            v="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            sx={{ maxWidth: 300 }}
          >
            {uploading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <ImageIcon size={16} />}
            {uploading ? "Uploading..." : "Upload New QR Code"}
          </Btn>
        </div>

        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
          <Lbl t="GCash Number / Name" />
          <div style={{ display: "flex", gap: 12, justifyContent: "center", width: "100%", maxWidth: 300 }}>
            <input 
              type="text" 
              value={gcashDetails} 
              onChange={(e) => setGcashDetails(e.target.value)} 
              style={{ flex: 1, padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, outline: "none" }}
              placeholder="0912 345 6789 - Juan D."
            />
            <Btn onClick={handleSaveDetails} disabled={savingDetails}>
              {savingDetails ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
              Save
            </Btn>
          </div>
          <p style={{ fontSize: 12, color: C.faint }}>This text will be shown below the QR code for easy copying.</p>
        </div>
      </div>

      {/* Checkout Fee Section */}
      <div style={{ background: C.surface, padding: "24px", border: `1px solid ${C.border}`, borderRadius: 0 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 4, letterSpacing: "-0.01em" }}>Checkout Fee</h2>
        <p style={{ fontSize: 14, color: C.faint, marginBottom: 24 }}>Set an additional fee to be added during checkout.</p>
        
        <div style={{ maxWidth: 300, margin: "0 auto", textAlign: "center" }}>
          <Lbl t="Extra Fee Amount (₱)" />
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <input 
              type="number" 
              min="0"
              step="0.01"
              value={checkoutFee} 
              onChange={(e) => setCheckoutFee(e.target.value)} 
              style={{ flex: 1 }}
              placeholder="0.00"
            />
            <Btn onClick={handleSaveFee} disabled={savingFee}>
              {savingFee ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
              Save
            </Btn>
          </div>
          <p style={{ fontSize: 12, color: C.faint, marginTop: 8 }}>This fee will be automatically added to the customer's total.</p>
        </div>
      </div>
    </div>
  );
}
