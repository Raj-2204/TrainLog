import { getHistory } from "./history.js";

export async function getHomeStats() {
  const h = await getHistory();
  const sessions = (h.sessions ?? []).filter((s) => s.status === "COMPLETED");
  return { sessions };
}
