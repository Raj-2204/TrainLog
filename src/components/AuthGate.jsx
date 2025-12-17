import React, { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthTabs from "./AuthTabs.jsx";
import AppTabs from "./AppTabs.jsx";

// pages
import HomePage from "../pages/HomePage.jsx";
import ExercisesPage from "../pages/ExercisesPage.jsx";
import WorkoutPage from "../pages/WorkoutPage.jsx";
import HistoryPage from "../pages/HistoryPage.jsx";

export default function AuthGate() {
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  async function refresh() {
    try {
      await getCurrentUser();
      setSignedIn(true);
    } catch {
      setSignedIn(false);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  if (checking) return <div style={{ padding: 20 }}>Loading…</div>;

  if (!signedIn) return <AuthTabs onSignedIn={() => setSignedIn(true)} />;

  return (
    <Routes>
      <Route element={<AppTabs />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/exercises" element={<ExercisesPage />} />
        <Route path="/workout" element={<WorkoutPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
