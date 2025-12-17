import React, { useEffect, useMemo, useState } from "react";
import { getHomeStats } from "../api/home.js";

function startOfWeekLocal(d = new Date()) {
  // Monday as start of week
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function lastNDaysKeys(n = 7) {
  const out = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);

  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(x.toISOString().slice(0, 10)); // YYYY-MM-DD
  }
  return out;
}

function dayLabel(key) {
  // key = YYYY-MM-DD
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function toLocalDateKey(iso) {
  // iso: 2025-12-17T...
  if (!iso) return "";
  return iso.slice(0, 10); // good enough for grouping
}

export default function HomePage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedDay, setSelectedDay] = useState(null); // "YYYY-MM-DD" or null
  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const { sessions } = await getHomeStats();
        setSessions(sessions);
      } catch (e) {
        setErr(e?.message ?? "Failed to load home stats");
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const selectedDaySessions = useMemo(() => {
        if (!selectedDay) return [];
        return sessions
            .filter((s) => {
            const key = (s.completedAt || s.createdAt || "").slice(0, 10);
            return s.status === "COMPLETED" && key === selectedDay;
            })
            .sort((a, b) => (b.completedAt || b.createdAt || "").localeCompare(a.completedAt || a.createdAt || ""));
        }, [sessions, selectedDay]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeekLocal(now);

    const thisWeek = sessions.filter((s) => {
      const iso = s.completedAt || s.createdAt;
      if (!iso) return false;
      const dt = new Date(iso);
      return dt >= weekStart && dt <= now;
    });

    const sum = (arr, key) =>
      arr.reduce((acc, x) => acc + (Number(x[key]) || 0), 0);

    const thisWeekWorkouts = thisWeek.length;
    const thisWeekSets = sum(thisWeek, "setsCount");
    const thisWeekVolume = sum(thisWeek, "totalVolume");

    const allTimeWorkouts = sessions.length;
    const allTimeSets = sum(sessions, "setsCount");
    const allTimeVolume = sum(sessions, "totalVolume");

    const last = [...sessions]
      .sort((a, b) => (b.completedAt || b.createdAt || "").localeCompare(a.completedAt || a.createdAt || ""))
      .find(Boolean);
    const days = lastNDaysKeys(7);

    const volumeByDay = new Map(days.map((k) => [k, 0]));

    for (const s of sessions) {
    const key = (s.completedAt || s.createdAt || "").slice(0, 10);
    if (!volumeByDay.has(key)) continue;
    volumeByDay.set(key, volumeByDay.get(key) + (Number(s.totalVolume) || 0));
    }

    const daily = days.map((k) => ({
    date: k,
    label: dayLabel(k),
    volume: volumeByDay.get(k) || 0,
    }));

    const maxDaily = Math.max(1, ...daily.map((d) => d.volume));

    return {
      thisWeekWorkouts,
      thisWeekSets,
      thisWeekVolume,
      allTimeWorkouts,
      allTimeSets,
      allTimeVolume,
      lastWorkout: last || null,
      daily,
      maxDaily,
    };
  }, [sessions]);

  return (
    <div>
      <h2>Home</h2>

      {err && <div style={styles.error}>{err}</div>}

      {loading ? (
        <div style={{ color: "#555" }}>Loading…</div>
      ) : (
        <>
          <div style={styles.grid}>
            <StatCard label="Workouts (This Week)" value={stats.thisWeekWorkouts} />
            <StatCard label="Sets (This Week)" value={stats.thisWeekSets} />
            <StatCard
              label="Volume (This Week)"
              value={`${stats.thisWeekVolume.toLocaleString()} lbs`}
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={styles.card}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Weekly Volume</div>
              <div style={{ color: "#666", fontSize: 13, marginTop: 2 }}>
                Last 7 days (lbs)
              </div>

              <div style={styles.chartRow}>
        {stats.daily.map((d) => {
        const pct = Math.round((d.volume / stats.maxDaily) * 100);
        const active = selectedDay === d.date;

        return (
            <button
            key={d.date}
            type="button"
            onClick={() => setSelectedDay((prev) => (prev === d.date ? null : d.date))}
            style={{
                ...styles.barButton,
                ...(active ? styles.barButtonActive : {}),
            }}
            title={`View workouts for ${d.date}`}
            >
            <div style={styles.barTrack}>
                <div style={{ ...styles.barFill, height: `${pct}%` }} />
            </div>
            <div style={styles.barLabel}>{d.label}</div>
            <div style={styles.barValue}>{Math.round(d.volume).toLocaleString()}</div>
            </button>
        );
        })}
            </div>
        </div>
    </div>
        {selectedDay && (
  <div style={{ marginTop: 14 }}>
    <div style={{ fontWeight: 900 }}>Workouts on {selectedDay}</div>
    <div style={{ color: "#666", fontSize: 13, marginTop: 2 }}>
      Click the same day again to close.
    </div>

    {selectedDaySessions.length === 0 ? (
      <div style={{ marginTop: 10, color: "#555" }}>No workouts completed on this day.</div>
    ) : (
      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
        {selectedDaySessions.map((s) => (
          <div key={s.sessionId} style={styles.daySessionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontWeight: 900 }}>{s.title || "Workout"}</div>
              <div style={{ fontSize: 12, color: "#16a34a" }}>COMPLETED</div>
            </div>

            <div style={{ marginTop: 6, display: "flex", gap: 12, fontSize: 13, color: "#333" }}>
              <span><b>Sets:</b> {s.setsCount ?? 0}</span>
              <span><b>Volume:</b> {(s.totalVolume ?? 0).toLocaleString()} lbs</span>
            </div>

            <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
              {s.completedAt ? `Completed: ${s.completedAt.slice(0, 19).replace("T", " ")}` : ""}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

          <div style={{ height: 14 }} />

          <div style={styles.grid}>
            <StatCard label="Workouts (All Time)" value={stats.allTimeWorkouts} />
            <StatCard label="Sets (All Time)" value={stats.allTimeSets} />
            <StatCard
              label="Volume (All Time)"
              value={`${stats.allTimeVolume.toLocaleString()} lbs`}
            />
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>Last Workout</div>
                  <div style={{ color: "#666", fontSize: 13 }}>Most recently completed</div>
                </div>
              </div>

              {!stats.lastWorkout ? (
                <div style={{ marginTop: 12, color: "#555" }}>No completed workouts yet.</div>
              ) : (
                <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>
                    {stats.lastWorkout.title || "Workout"}
                  </div>
                  <div style={{ color: "#666", fontSize: 13 }}>
                    Date: {toLocalDateKey(stats.lastWorkout.completedAt || stats.lastWorkout.createdAt)}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 6, color: "#333", fontSize: 13 }}>
                    <span><b>Sets:</b> {stats.lastWorkout.setsCount ?? 0}</span>
                    <span><b>Volume:</b> {(stats.lastWorkout.totalVolume ?? 0).toLocaleString()} lbs</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.stat}>
      <div style={{ color: "#666", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{value}</div>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },
  stat: {
    padding: 16,
    borderRadius: 12,
    border: "1px solid #eee",
    background: "white",
  },
  card: {
    padding: 16,
    borderRadius: 12,
    border: "1px solid #eee",
    background: "white",
  },
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
  chartRow: {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 10,
  alignItems: "end",
},
barCol: { display: "grid", gap: 6, justifyItems: "center" },
barTrack: {
  width: "100%",
  height: 120,
  borderRadius: 10,
  border: "1px solid #eee",
  background: "#fafafa",
  display: "flex",
  alignItems: "flex-end",
  overflow: "hidden",
},
barFill: {
  width: "100%",
  background: "#111", // simple, clean
  borderRadius: 10,
},
barLabel: { fontSize: 12, color: "#666" },
barValue: { fontSize: 12, color: "#111" },
barButton: {
  appearance: "none",
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
  display: "grid",
  gap: 6,
  justifyItems: "center",
},
barButtonActive: {
  transform: "translateY(-2px)",
},
daySessionCard: {
  padding: 12,
  borderRadius: 12,
  border: "1px solid #eee",
  background: "#fafafa",
},


};
