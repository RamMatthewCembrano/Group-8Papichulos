import { useState } from "react";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { C, GLOBAL_CSS } from "./constants";
import { Lbl } from "./AdminPrimitives";

export const LoginGate = ({ onLogin }: { onLogin: () => void }) => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: user,
      password: pass,
    });

    if (error) {
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 420);
      toast.error("Incorrect credentials");
    } else {
      onLogin();
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "20px",
      }}
    >
      <style>{GLOBAL_CSS}</style>

      {/* Main container moved up slightly for better visual balance */}
      <div style={{ width: "100%", maxWidth: 400, marginTop: "-40px" }}>
        {/* ── Branding Section ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: 10,
              marginBottom: 12,
            }}
          >
            <img
              src="/PAPICHOLOS-LOGO-menu.webp"
              alt="Papicholo's CDO"
              style={{
                height: 80,
                width: "auto",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Dashboard label */}
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
              fontWeight: 400,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Admin Dashboard
          </div>
        </div>

        {/* ── Login Card ── */}
        <div
          className={shake ? "a-shake" : ""}
          style={{
            background: C.surface,
            borderRadius: 20,
            padding: "28px 24px",
            border: `1.5px solid ${C.border}`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: C.ink,
              letterSpacing: "-0.01em",
              marginBottom: 4,
            }}
          >
            Sign in
          </div>
          <div
            style={{
              fontSize: 14,
              color: C.faint,
              fontWeight: 400,
              marginBottom: 24,
            }}
          >
            Enter your credentials to continue
          </div>

          <form
            onSubmit={submit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div>
              <Lbl t="Email" />
              <input
                type="email"
                placeholder="enter your email here"
                value={user}
                autoComplete="username"
                style={{ width: "100%" }}
                onChange={(e) => setUser(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Lbl t="Password" />
              <input
                type="password"
                placeholder="••••••••"
                value={pass}
                autoComplete="current-password"
                style={{ width: "100%" }}
                onChange={(e) => setPass(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: C.ink,
                color: C.white,
                border: "none",
                borderRadius: 10,
                padding: "14px",
                fontSize: 15,
                fontWeight: 500,
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {loading ? (
                <>
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock size={14} strokeWidth={1.5} /> Continue
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
