import React, { useEffect, useMemo, useState } from "react";
import { getHistory, getSessionDetail, getExercisesCatalog } from "../api/history.js";
import TopBar from "../components/TopBar.jsx";
function groupByDate(sessions) {
  const map = new Map();
  for (const s of sessions) {
    const d = s.date || (s.createdAt ? s.createdAt.slice(0, 10) : "Unknown");
    if (!map.has(d)) map.set(d, []);
    map.get(d).push(s);
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null); // { session, sets }
  const [exerciseMap, setExerciseMap] = useState(new Map());

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);

        const [h, cat] = await Promise.all([getHistory(), getExercisesCatalog()]);

        // ✅ show only completed
        const list = (h.sessions ?? []).filter((s) => s.status === "COMPLETED");
        setSessions(list);

        const exs = cat.exercises ?? [];
        setExerciseMap(new Map(exs.map((e) => [e.exerciseId, e])));
      } catch (e) {
        setErr(e?.message ?? "Failed to load history");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const grouped = useMemo(() => groupByDate(sessions), [sessions]);

  async function openSession(sessionId) {
    try {
      setErr("");
      setSelectedId(sessionId);
      setLoadingDetail(true);
      const d = await getSessionDetail(sessionId);
      setDetail(d);
    } catch (e) {
      setErr(e?.message ?? "Failed to load session details");
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeDetail() {
    setSelectedId(null);
    setDetail(null);
  }

  const setsByExercise = useMemo(() => {
    const sets = detail?.sets ?? [];
    const m = new Map();
    for (const s of sets) {
      const id = s.exerciseId || "unknown";
      if (!m.has(id)) m.set(id, []);
      m.get(id).push(s);
    }
    for (const [k, arr] of m) {
      arr.sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0));
    }
    return m;
  }, [detail]);

  // stats for the selected session (from /history list)
  const selectedSessionFromList = useMemo(
    () => sessions.find((x) => x.sessionId === selectedId) || null,
    [sessions, selectedId]
  );

  return (
    <div>
      <TopBar />
      <h2>History</h2>

      {err && <div style={styles.error}>{err}</div>}

      {loading ? (
        <div style={{ color: "#555" }}>Loading…</div>
      ) : sessions.length === 0 ? (
        <div style={{ color: "#555" }}>No completed workouts yet.</div>
      ) : (
        <div style={styles.grid}>
          {/* LEFT: list */}
          <div style={styles.left}>
            {grouped.map(([date, list]) => (
              <div key={date} style={styles.group}>
                <div style={styles.groupTitle}>{date}</div>

                <div style={{ display: "grid", gap: 10 }}>
                  {list.map((s) => (
                    <button
                      key={s.sessionId}
                      style={{
                        ...styles.sessionCard,
                        ...(selectedId === s.sessionId ? styles.sessionCardActive : {}),
                      }}
                      onClick={() => openSession(s.sessionId)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 800 }}>{s.title || "Workout"}</div>
                        <div style={{ fontSize: 12, color: "#16a34a" }}>COMPLETED</div>
                      </div>

                      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                        {s.createdAt ? `Created: ${s.createdAt.slice(0, 19).replace("T", " ")}` : ""}
                      </div>

                      {/* ✅ instant stats stored on the session item */}
                      <div style={{ fontSize: 12, color: "#444", marginTop: 6, display: "flex", gap: 12 }}>
                        <span><b>Sets:</b> {s.setsCount ?? 0}</span>
                        <span><b>Volume:</b> {(s.totalVolume ?? 0).toLocaleString()} lbs</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: detail */}
          <div style={styles.right}>
            {!selectedId ? (
              <div style={styles.placeholder}>Select a workout to view details.</div>
            ) : loadingDetail ? (
              <div style={styles.placeholder}>Loading details…</div>
            ) : !detail?.session ? (
              <div style={styles.placeholder}>No details found.</div>
            ) : (
              <div style={styles.detailCard}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>
                      {detail.session.title || "Workout"}
                    </div>

                    <div style={{ color: "#666", fontSize: 13 }}>
                      {(detail.session.date || (detail.session.createdAt ? detail.session.createdAt.slice(0, 10) : ""))}{" "}
                      • {detail.session.status || ""}
                    </div>

                    {/* ✅ use the selected session from list (NOT `s`) */}
                    {selectedSessionFromList && (
                      <div style={{ marginTop: 8, color: "#444", fontSize: 13 }}>
                        <b>Sets:</b> {selectedSessionFromList.setsCount ?? 0} &nbsp;•&nbsp;
                        <b>Total Volume:</b> {(selectedSessionFromList.totalVolume ?? 0).toLocaleString()} lbs
                      </div>
                    )}
                  </div>

                  <button style={styles.secondaryBtn} onClick={closeDetail}>
                    Close
                  </button>
                </div>

                <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
                  {Array.from(setsByExercise.entries()).map(([exerciseId, sets]) => {
                    const ex = exerciseMap.get(exerciseId);
                    const name = ex?.name || exerciseId;

                    return (
                      <div key={exerciseId} style={styles.exerciseBlock}>
                        <div style={{ fontWeight: 800, marginBottom: 8 }}>{name}</div>

                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Set</th>
                              <th style={styles.th}>Reps</th>
                              <th style={styles.th}>Weight (lbs)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sets.map((row, idx) => (
                              <tr key={idx}>
                                <td style={styles.td}>{row.setNumber}</td>
                                <td style={styles.td}>{row.reps ?? ""}</td>
                                <td style={styles.td}>{row.weight ?? ""}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}

                  {setsByExercise.size === 0 && (
                    <div style={{ color: "#555" }}>No sets recorded for this session.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  error: {
    marginTop: 12,
    marginBottom: 12,
    padding: 10,
    borderRadius: 10,
    background: "#fee",
    border: "1px solid #f99",
    color: "#900",
    fontSize: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr",
    gap: 14,
    alignItems: "start",
  },
  left: {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 12,
    background: "#fafafa",
  },
  right: {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
    minHeight: 320,
  },
  group: { marginBottom: 14 },
  groupTitle: { fontWeight: 900, marginBottom: 8 },
  sessionCard: {
    textAlign: "left",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e5e5e5",
    background: "white",
    cursor: "pointer",
  },
  sessionCardActive: {
    border: "1px solid #222",
    boxShadow: "0 1px 10px rgba(0, 0, 0, 0.06)",
  },
  placeholder: {
    color: "#555",
    padding: 16,
    borderRadius: 12,
    background: "#fafafa",
    border: "1px dashed #ddd",
  },
  detailCard: { padding: 6 },
  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
  },
  exerciseBlock: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid #eee",
    background: "#fafafa",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "8px 6px",
    borderBottom: "1px solid #e5e5e5",
    fontSize: 13,
    color: "#444",
  },
  td: { padding: "8px 6px", borderBottom: "1px solid #eee", fontSize: 14 },
};
