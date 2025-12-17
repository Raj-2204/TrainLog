import { fetchAuthSession } from "aws-amplify/auth";
const API_BASE = import.meta.env.VITE_API_BASE;

async function token() {
  const s = await fetchAuthSession();
  const t = s.tokens?.idToken?.toString();
  if (!t) throw new Error("Missing token");
  return t;
}

export async function getWorkoutTypes() {
  const t = await token();
  const res = await fetch(`${API_BASE}/workout-types`, {
    headers: { Authorization: `Bearer ${t}` }
  });
  if (!res.ok) throw new Error(`GET /workout-types failed: ${res.status}`);
  return res.json(); // { workoutTypes: [...] }
}
