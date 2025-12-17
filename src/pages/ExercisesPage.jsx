import React, { useEffect, useMemo, useState } from "react";
import { getExercises } from "../api/exercises.js";

export default function ExercisesPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await getExercises();
        const list = data.exercises ?? [];
        // sort by name
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setItems(list);
      } catch (e) {
        setErr(e?.message ?? "Failed to load exercises");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((e) => {
      const name = (e.name || "").toLowerCase();
      const mg = (e.muscleGroup || "").toLowerCase();
      return name.includes(query) || mg.includes(query);
    });
  }, [items, q]);

  return (
    <div>
      <h2>Exercises</h2>

      {err && <div style={styles.error}>{err}</div>}

      <div style={styles.grid}>
        {/* Left list */}
        <div style={styles.left}>
          <input
            style={styles.input}
            placeholder="Search exercises (e.g., bench, chest, squat)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div style={{ marginTop: 12 }}>
            {loading ? (
              <div style={{ color: "#555" }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ color: "#555" }}>No exercises found.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {filtered.map((e) => (
                  <button
                    key={e.exerciseId}
                    type="button"
                    onClick={() => setSelected(e)}
                    style={{
                      ...styles.exerciseCard,
                      ...(selected?.exerciseId === e.exerciseId ? styles.exerciseCardActive : {}),
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{e.name || "Exercise"}</div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      {e.muscleGroup ? `Muscle: ${e.muscleGroup}` : " "}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right detail */}
        <div style={styles.right}>
          {!selected ? (
            <div style={styles.placeholder}>Select an exercise to see instructions.</div>
          ) : (
            <div style={styles.detailCard}>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{selected.name || "Exercise"}</div>
              {selected.muscleGroup && (
                <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
                  Muscle group: {selected.muscleGroup}
                </div>
              )}

              {/* Optional image/video if you add fields later */}
              {selected.imageUrl && (
                <img
                  src={selected.imageUrl}
                  alt={selected.name}
                  style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12, marginTop: 12 }}
                />
              )}

              {selected.videoUrl && (
                <div style={{ marginTop: 10, fontSize: 13 }}>
                  Video:{" "}
                  <a href={selected.videoUrl} target="_blank" rel="noreferrer">
                    open
                  </a>
                </div>
              )}

              <div style={{ marginTop: 14, fontWeight: 900 }}>Instructions</div>
              <div style={{ marginTop: 8, color: "#333", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {selected.instructions
                  ? selected.instructions
                  : "No instructions added yet. (You can add an 'instructions' field to the catalog items.)"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
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
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 14,
  },
  exerciseCard: {
    textAlign: "left",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e5e5e5",
    background: "white",
    cursor: "pointer",
  },
  exerciseCardActive: {
    border: "1px solid #222",
    boxShadow: "0 1px 10px rgba(0,0,0,0.06)",
  },
  placeholder: {
    color: "#555",
    padding: 16,
    borderRadius: 12,
    background: "#fafafa",
    border: "1px dashed #ddd",
  },
  detailCard: { padding: 6 },
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
};
