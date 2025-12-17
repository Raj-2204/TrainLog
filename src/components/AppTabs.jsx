import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AppTabs() {
  return (
    <div style={styles.wrap}>
      <div style={styles.content}>
        <Outlet />
      </div>

      <nav style={styles.tabbar}>
        <Tab to="/home" label="Home" />
        <Tab to="/exercises" label="Exercises" />
        <Tab to="/workout" label="Workout" />
        <Tab to="/history" label="History" />
        
      </nav>
    </div>
  );
}

function Tab({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...styles.tab,
        ...(isActive ? styles.tabActive : {}),
      })}
    >
      {label}
    </NavLink>
  );
}

const styles = {
  wrap: { minHeight: "100vh", display: "flex", flexDirection: "column" },
  content: { flex: 1, padding: 16, maxWidth: 900, width: "100%", margin: "0 auto" },
  tabbar: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    borderTop: "1px solid #eee",
    padding: 8,
    position: "sticky",
    bottom: 0,
    background: "white",
  },
  tab: {
    textAlign: "center",
    padding: "10px 8px",
    borderRadius: 10,
    textDecoration: "none",
    color: "#111",
    border: "1px solid transparent",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    fontSize: 14,
  },
  tabActive: { border: "1px solid #222", background: "#222", color: "white" },
};
