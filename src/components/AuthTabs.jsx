import React, { useState } from "react";
import { signIn, signUp, confirmSignUp, resendSignUpCode } from "aws-amplify/auth";

export default function AuthTabs({ onSignedIn }) {
  const [tab, setTab] = useState("signin"); // signin | signup
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Sign in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign up state
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function handleSignIn(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await signIn({ username: email, password });
      onSignedIn();
    } catch (e) {
      setErr(e?.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await signUp({
        username: suEmail,
        password: suPassword,
        options: {
          userAttributes: { email: suEmail },
        },
      });

      // Most Cognito setups require confirming email with a code
      setNeedsConfirm(true);
    } catch (e) {
      setErr(e?.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await confirmSignUp({ username: suEmail, confirmationCode: code });

      // After confirm, automatically sign in
      await signIn({ username: suEmail, password: suPassword });
      onSignedIn();
    } catch (e) {
      setErr(e?.message ?? "Confirmation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setErr("");
    setLoading(true);
    try {
      await resendSignUpCode({ username: suEmail });
    } catch (e) {
      setErr(e?.message ?? "Failed to resend code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={{ marginTop: 0 }}>Fitness App</h2>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          type="button"
          onClick={() => { setTab("signin"); setErr(""); }}
          style={{ ...styles.tabBtn, ...(tab === "signin" ? styles.tabActive : {}) }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setTab("signup"); setErr(""); }}
          style={{ ...styles.tabBtn, ...(tab === "signup" ? styles.tabActive : {}) }}
        >
          Sign Up
        </button>
      </div>

      {err && <div style={styles.error}>{err}</div>}

      {/* SIGN IN */}
      {tab === "signin" && (
        <form onSubmit={handleSignIn} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <button style={styles.primaryBtn} disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      )}

      {/* SIGN UP */}
      {tab === "signup" && (
        <>
          {!needsConfirm ? (
            <form onSubmit={handleSignUp} style={styles.form}>
              <label style={styles.label}>
                Email
                <input
                  style={styles.input}
                  value={suEmail}
                  onChange={(e) => setSuEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>

              <label style={styles.label}>
                Password
                <input
                  style={styles.input}
                  type="password"
                  value={suPassword}
                  onChange={(e) => setSuPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </label>

              <button style={styles.primaryBtn} disabled={loading}>
                {loading ? "Creating…" : "Create Account"}
              </button>

              <div style={{ color: "#666", fontSize: 13 }}>
                After signup, Cognito will email you a verification code.
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirm} style={styles.form}>
              <div style={{ color: "#555", fontSize: 14 }}>
                Enter the verification code sent to <b>{suEmail}</b>.
              </div>

              <label style={styles.label}>
                Verification code
                <input
                  style={styles.input}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="one-time-code"
                />
              </label>

              <button style={styles.primaryBtn} disabled={loading}>
                {loading ? "Verifying…" : "Verify & Sign In"}
              </button>

              <button type="button" style={styles.secondaryBtn} onClick={handleResend} disabled={loading}>
                Resend code
              </button>

              <button
                type="button"
                style={styles.linkBtn}
                onClick={() => { setNeedsConfirm(false); setCode(""); setErr(""); }}
                disabled={loading}
              >
                Back to Sign Up
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  card: {
    maxWidth: 520,
    margin: "48px auto",
    padding: 20,
    border: "1px solid #ddd",
    borderRadius: 12,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 14,
    borderBottom: "1px solid #eee",
    paddingBottom: 10,
  },
  tabBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontSize: 14,
  },
  tabActive: {
    border: "1px solid #222",
    background: "#222",
    color: "white",
  },
  form: { display: "grid", gap: 10 },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 14,
  },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #222",
    background: "#222",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
  },
  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "white",
    color: "#111",
    cursor: "pointer",
    fontSize: 14,
  },
  linkBtn: {
    border: "none",
    background: "transparent",
    color: "#111",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: 13,
    padding: 0,
    justifySelf: "start",
  },
  error: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 10,
    background: "#fee",
    border: "1px solid #f99",
    color: "#900",
    fontSize: 14,
  },
};
