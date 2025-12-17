import { fetchAuthSession } from "aws-amplify/auth";

const API_BASE = import.meta.env.VITE_API_BASE;

async function getIdToken() {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("Missing ID token (not signed in).");
  return token;
}

export async function getWorkouts() {
  const token = await getIdToken();

  const res = await fetch(`${API_BASE}/workouts`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error(`GET /workouts failed: ${res.status}`);
  return res.json();
}

export async function createWorkout(payload) {
  const token = await getIdToken();

  const res = await fetch(`${API_BASE}/workouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`POST /workouts failed: ${res.status}`);
  return res.json();
}
