import React, { useEffect, useMemo, useState } from "react";
import { signOut } from "aws-amplify/auth";
import { getWorkouts, createWorkout } from "../api/workouts.js";
import { getWorkoutTypes } from "../api/catalog.js";

export default function Workouts({ onSignOut }) {
  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const selectedType = useMemo(
    () => types.find((t) => t.typeId === selectedTypeId),
    [types, selectedTypeId]
  );

  async function loadAll() {
    setErr("");
    setLoading(true);
    try {
      // load catalog + workouts in parallel
      const [typesRes, workoutsRes] = await Promise.all([
        getWorkoutTypes(),
        getWorkouts(),
      ]);

      const workoutTypes = typesRes.workoutTypes ?? [];
      setTypes(workoutTypes);

      // pick first option if none selected
      if (!selectedTypeId && workoutTypes.length > 0) {
        setSelectedTypeId(workoutTypes[0].typeId);
      }

      const list = Array.isArray(workoutsRes) ? workoutsRes : workoutsRes.workouts ?? [];
      setItems(list);
    } catch (e) {
      setErr(e?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setErr("");

    if (!selectedTypeId) {
      setErr("Please choose a workout type.");
      return;
    }

    setSaving(true);
    try {
      await createWorkout({
        workoutTypeId: selectedTypeId,
        note: note,
      });

      setNote("");
      await loadAll();
    } catch (e) {
      setErr(e?.message ?? "Failed to create workout");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    onSignOut();
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>Your Workouts</h2>
          <div style={{ color: "#666", fontSize: 13 }}>Choose a workout type + add a note</div>
        </div>
        <button style={styles.secondaryBtn} onClick={handleSignOut}>Sign Out</button>
      </div>

      {/* Create Workout */}
      <form onSubmit={handleCreate} style={styles.form}>
        <label style={styles.label}>
          Workout type
          <select
            style={styles.select}
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            disabled={loading || types.length === 0}
          >
            {types.length === 0 ? (
              <option value="">No workout types found</option>
            ) : (
              types.map((t) => (
                <option key={t.typeId} value={t.typeId}>
                  {t.name}
                </option>
              ))
            )}
          </select>
        </label>

        <label style={styles.label}>
          Note (optional)
          <input
            style={styles.input}
            placeholder="e.g., Chest + triceps, 45 min"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <button style={styles.primaryBtn} disabled={loading || saving || !selectedTypeId}>
          {saving ? "Adding…" : "Add Workout"}
        </button>
      </form>

      {/* Preview selected workout image */}
      {selectedType?.imageUrl ? (
        <div style={styles.previewRow}>
          <img
            src={selectedType.imageUrl}
            alt={selectedType.name}
            style={styles.previewImg}
          />
          <div>
            <div style={{ fontWeight: 700 }}>{selectedType.name}</div>
            <div style={{ color: "#666", fontSize: 13 }}>Image is coming from the catalog (DynamoDB)</div>
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 12 }}>
        <button style={styles.secondaryBtn} onClick={loadAll} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {err && <div style={styles.error}>{err}</div>}

      {/* List Workouts */}
      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ color: "#555" }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ color: "#555" }}>No workouts yet. Add one above.</div>
        ) : (
          <ul style={styles.list}>
            {items.map((w, idx) => (
              <li key={w.SK ?? idx} style={styles.item}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {w.imageUrl ? (
                    <img
                      src={w.imageUrl}
                      alt={w.workoutName || "Workout"}
                      style={styles.itemImg}
                    />
                  ) : (
                    <div style={styles.itemImgPlaceholder} />
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>
                      {w.workoutName || "Workout"}
                    </div>
                    <div style={{ color: "#666", fontSize: 13 }}>
                      {w.note || ""}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    maxWidth: 760,
    margin: "48px auto",
    padding: 20,
    border: "1px solid #ddd",
    borderRadius: 12,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  form: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: 10,
    marginTop: 16,
    alignItems: "end",
  },
  label: { display: "grid", gap: 6, fontSize: 14 },
  select: {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 14,
    background: "white",
  },
  input: {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 14,
  },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #222",
    background: "#222",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
    height: 42,
  },
  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "white",
    color: "#111",
    cursor: "pointer",
    fontSize: 14,
  },
  error: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    background: "#fee",
    border: "1px solid #f99",
    color: "#900",
    fontSize: 14,
  },
  previewRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginTop: 14,
    padding: 12,
    border: "1px solid #eee",
    borderRadius: 12,
    background: "#fafafa",
  },
  previewImg: {
    width: 72,
    height: 72,
    borderRadius: 12,
    objectFit: "cover",
    border: "1px solid #eee",
  },
  list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 },
  item: { padding: 12, border: "1px solid #eee", borderRadius: 12, background: "#fafafa" },
  itemImg: { width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "1px solid #eee" },
  itemImgPlaceholder: { width: 64, height: 64, borderRadius: 12, border: "1px solid #eee", background: "#f4f4f4" },
};
