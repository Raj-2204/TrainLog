import { fetchAuthSession } from "aws-amplify/auth";
const API_BASE = import.meta.env.VITE_API_BASE;

async function token() {
  const s = await fetchAuthSession();
  const t = s.tokens?.idToken?.toString();
  if (!t) throw new Error("Missing token");
  return t;
}

export async function completeSession(sessionId) {
  const t = await token();
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/complete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}` },
  });

  if (!res.ok) throw new Error(`POST /sessions/${sessionId}/complete failed: ${res.status}`);
  return res.json();
}
