import React from "react";
import { signOut } from "aws-amplify/auth";

export default function TopBar() {
  async function handleSignOut() {
    await signOut();
    window.location.href = "/"; // simplest refresh back to AuthGate
  }

  return (
    <div style={styles.bar}>
      <div style={styles.brand}>Train Log</div>
      <button style={styles.btn} onClick={handleSignOut}>
        Sign Out
      </button>
    </div>
  );
}

const styles = {
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
    background: "white",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  brand: { fontWeight: 900 },
  btn: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
};
