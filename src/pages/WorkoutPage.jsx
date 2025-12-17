import React, { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { completeSession } from "../api/sessions.js";
import TopBar from "../components/TopBar.jsx";
const API_BASE = import.meta.env.VITE_API_BASE;

// ---------- helpers ----------
async function token() {
  const s = await fetchAuthSession();
  return s.tokens.idToken.toString();
}

async function api(path, method = "GET", body) {
  const t = await token();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${t}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} failed`);
  return res.json();
}

function formatMMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ---------- component ----------
export default function WorkoutPage() {
  const [exercises, setExercises] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [title, setTitle] = useState("");
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Rest timer state
  const [resting, setResting] = useState(false);
  const [restExerciseId, setRestExerciseId] = useState(null);
  const [restElapsed, setRestElapsed] = useState(0);

  useEffect(() => {
    api("/exercises")
      .then((d) => setExercises(d.exercises || []))
      .catch((e) => setError(e?.message ?? "Failed to load exercises"));
  }, []);

  // rest timer effect: count UP from 0 while resting
  useEffect(() => {
    if (!resting) return;
    const interval = setInterval(() => setRestElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [resting]);

  const isRestingFor = (exerciseId) => resting && restExerciseId === exerciseId;

  function hasAnySavedSet() {
    return workoutExercises.some((ex) => ex.sets?.some((s) => s.saved));
  }

  function hasUnsavedChanges() {
    return workoutExercises.some((ex) => ex.sets?.some((s) => !s.saved));
  }

  function isValidSet(s) {
    const reps = Number(s.reps);
    const weight = Number(s.weight);
    return Number.isFinite(reps) && reps > 0 && Number.isFinite(weight) && weight > 0;
  }

  async function startWorkout() {
    setError("");
    const res = await api("/sessions", "POST", { title });
    setSessionId(res.sessionId);
  }

  async function handleCompleteWorkout() {
    setError("");

    if (hasUnsavedChanges()) {
      const ok = window.confirm("You have unsaved sets. Complete workout anyway?");
      if (!ok) return;
    }

    try {
      // stop timer
      setResting(false);
      setRestExerciseId(null);
      setRestElapsed(0);

      await completeSession(sessionId);

      // reset local state
      setSessionId(null);
      setWorkoutExercises([]);
      setTitle("");

      // redirect
      navigate("/history");
    } catch (e) {
      setError(e?.message ?? "Failed to complete workout");
    }
  }

  function addExercise(ex) {
    if (workoutExercises.find((e) => e.exerciseId === ex.exerciseId)) return;
    setWorkoutExercises([...workoutExercises, { ...ex, sets: [] }]);
  }

  function removeExercise(exerciseId) {
    setWorkoutExercises(workoutExercises.filter((ex) => ex.exerciseId !== exerciseId));
    // also stop rest if we were resting for this one
    if (restExerciseId === exerciseId) {
      setResting(false);
      setRestExerciseId(null);
      setRestElapsed(0);
    }
  }

  function addSet(exerciseId) {
    setWorkoutExercises((prev) =>
      prev.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        const maxSet = ex.sets.reduce((m, s) => Math.max(m, s.setNumber), 0);
        const setNumber = maxSet + 1;
        return {
          ...ex,
          sets: [...ex.sets, { setNumber, reps: "", weight: "", saved: false }],
        };
      })
    );
  }

  function deleteSet(exerciseId, setNumber) {
    setWorkoutExercises((prev) =>
      prev.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        return { ...ex, sets: ex.sets.filter((s) => s.setNumber !== setNumber) };
      })
    );
  }

  function stopRest() {
    setResting(false);
    setRestExerciseId(null);
  }

  function resetRest() {
    setRestElapsed(0);
  }

  async function saveSet(exerciseId, set) {
    if (!sessionId) return;

    if (!isValidSet(set)) {
      setError("Enter valid reps and weight before saving.");
      return;
    }

    try {
      setError("");

      await api(`/sessions/${sessionId}/sets`, "POST", {
        exerciseId,
        setNumber: set.setNumber,
        reps: Number(set.reps),
        weight: Number(set.weight),
        restSeconds: restElapsed, // optional
      });

      // mark saved in UI
      setWorkoutExercises((prev) =>
        prev.map((ex) => {
          if (ex.exerciseId !== exerciseId) return ex;
          const sets = ex.sets.map((s) =>
            s.setNumber === set.setNumber ? { ...s, saved: true } : s
          );
          return { ...ex, sets };
        })
      );

      // start rest timer at 0 and count up
      setRestExerciseId(exerciseId);
      setRestElapsed(0);
      setResting(true);
    } catch (e) {
      setError(e?.message ?? "Failed to save set");
    }
  }

  return (
    <div>
      <TopBar />
      <h2>Workout</h2>

      {!sessionId && (
        <div style={styles.card}>
          <input
            style={styles.input}
            placeholder="Workout title (e.g. Chest Day)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button style={styles.primaryBtn} onClick={startWorkout}>
            Start Workout
          </button>
        </div>
      )}

      {sessionId && (
        <>
          <h3>{title || "Workout"}</h3>

          <button
            style={{
              ...styles.completeBtn,
              ...(!hasAnySavedSet() ? styles.btnDisabled : {}),
            }}
            onClick={handleCompleteWorkout}
            disabled={!hasAnySavedSet()}
            title={!hasAnySavedSet() ? "Save at least one set first" : "Complete workout"}
          >
            Complete Workout
          </button>

          <div style={styles.card}>
            <select
              style={styles.input}
              defaultValue=""
              onChange={(e) => {
                const ex = exercises.find((x) => x.exerciseId === e.target.value);
                if (ex) addExercise(ex);
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                Add exercise…
              </option>
              {exercises.map((ex) => (
                <option key={ex.exerciseId} value={ex.exerciseId}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          {workoutExercises.map((ex) => (
            <div key={ex.exerciseId} style={styles.exerciseCard}>
              <div style={styles.exerciseHeader}>
                <h4 style={{ margin: 0 }}>{ex.name}</h4>
                <button style={styles.linkBtn} onClick={() => removeExercise(ex.exerciseId)}>
                  Remove
                </button>
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Set</th>
                    <th>Reps</th>
                    <th>Weight (lbs)</th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ex.sets.map((s) => {
                    const valid = isValidSet(s);
                    return (
                      <tr key={s.setNumber}>
                        <td>{s.setNumber}</td>

                        <td>
                          <input
                            style={styles.smallInput}
                            value={s.reps}
                            disabled={s.saved}
                            onChange={(e) => {
                              const value = e.target.value;
                              setWorkoutExercises((prev) =>
                                prev.map((ex2) => {
                                  if (ex2.exerciseId !== ex.exerciseId) return ex2;
                                  const sets = ex2.sets.map((ss) =>
                                    ss.setNumber === s.setNumber ? { ...ss, reps: value, saved: false } : ss
                                  );
                                  return { ...ex2, sets };
                                })
                              );
                            }}
                          />
                        </td>

                        <td>
                          <input
                            style={styles.smallInput}
                            value={s.weight}
                            disabled={s.saved}
                            onChange={(e) => {
                              const value = e.target.value;
                              setWorkoutExercises((prev) =>
                                prev.map((ex2) => {
                                  if (ex2.exerciseId !== ex.exerciseId) return ex2;
                                  const sets = ex2.sets.map((ss) =>
                                    ss.setNumber === s.setNumber ? { ...ss, weight: value, saved: false } : ss
                                  );
                                  return { ...ex2, sets };
                                })
                              );
                            }}
                          />
                        </td>

                        <td>
                          <button
                            style={{
                              ...styles.saveBtn,
                              ...((!valid || s.saved) ? styles.btnDisabled : {}),
                            }}
                            onClick={() => saveSet(ex.exerciseId, s)}
                            disabled={!valid || s.saved}
                            title={s.saved ? "Saved" : (!valid ? "Enter reps and weight" : "Save set")}
                          >
                            ✔
                          </button>
                        </td>

                        <td>
                          <button
                            style={{
                              ...styles.deleteBtn,
                              ...(s.saved ? styles.btnDisabled : {}),
                            }}
                            onClick={() => deleteSet(ex.exerciseId, s.setNumber)}
                            disabled={s.saved}
                            title={s.saved ? "Saved sets can't be deleted (yet)" : "Delete set"}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {isRestingFor(ex.exerciseId) && (
                <div style={styles.restBox}>
                  <div style={{ fontWeight: 800 }}>Rest: {formatMMSS(restElapsed)}</div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button type="button" style={styles.secondaryBtn} onClick={stopRest}>
                      Stop
                    </button>
                    <button type="button" style={styles.secondaryBtn} onClick={resetRest}>
                      Reset
                    </button>
                    <button
                        type="button"
                        style={styles.primaryBtn}
                        onClick={() => {
                            // 1) stop rest
                            setResting(false);
                            setRestExerciseId(null);
                            setRestElapsed(0);

                            // 2) add next set
                            addSet(ex.exerciseId);
                        }}
                        >
                        Start Next Set
                    </button>

                  </div>
                </div>
              )}

              <button
                style={{
                  ...styles.secondaryBtn,
                  ...(isRestingFor(ex.exerciseId) ? styles.btnDisabled : {}),
                }}
                onClick={() => addSet(ex.exerciseId)}
                disabled={isRestingFor(ex.exerciseId)}
                title={isRestingFor(ex.exerciseId) ? "Wait until rest is stopped" : "Add a set"}
              >
                + Add Set
              </button>
            </div>
          ))}
        </>
      )}

      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

const styles = {
  card: { padding: 16, border: "1px solid #ddd", borderRadius: 12, marginBottom: 16 },
  exerciseCard: { padding: 16, border: "1px solid #eee", borderRadius: 12, marginBottom: 20 },
  exerciseHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },

  input: { padding: 10, borderRadius: 8, width: "100%" },
  smallInput: { width: 70, padding: 6 },

  primaryBtn: { padding: "10px 12px", background: "#2563eb", color: "white", borderRadius: 8, border: "none", cursor: "pointer" },
  secondaryBtn: { padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", background: "white", cursor: "pointer" },

  saveBtn: { padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", background: "white", cursor: "pointer" },
  deleteBtn: { padding: "6px 8px", borderRadius: 8, border: "1px solid #ddd", background: "white", cursor: "pointer" },

  linkBtn: { border: "none", background: "transparent", color: "#2563eb", cursor: "pointer", fontWeight: 800 },

  table: { width: "100%", marginBottom: 8, borderCollapse: "collapse" },

  error: { color: "red", marginTop: 10 },

  restBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    background: "#f0fdf4",
    border: "1px solid #86efac",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  completeBtn: {
    margin: "12px 0 18px",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #16a34a",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
  },

  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
};
