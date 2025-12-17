import { fetchAuthSession } from "aws-amplify/auth";
const API_BASE = import.meta.env.VITE_API_BASE;

async function token() {
  const s = await fetchAuthSession();
  const t = s.tokens?.idToken?.toString();
  if (!t) throw new Error("Missing token");
  return t;
}

export async function getHistory() {
  const t = await token();
  const res = await fetch(`${API_BASE}/history`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!res.ok) throw new Error(`GET /history failed: ${res.status}`);
  return res.json(); // { sessions: [...] }
}

export async function getSessionDetail(sessionId) {
  const t = await token();
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!res.ok) throw new Error(`GET /sessions/${sessionId} failed: ${res.status}`);
  return res.json(); // { session, sets }
}

export async function getExercisesCatalog() {
  const t = await token();
  const res = await fetch(`${API_BASE}/exercises`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!res.ok) throw new Error(`GET /exercises failed: ${res.status}`);
  return res.json(); // { exercises: [...] }
}
