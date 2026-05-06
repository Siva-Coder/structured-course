import React, { useState } from "react";
import { FiSend, FiClock } from "react-icons/fi";

/* ENV */
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

export default function Course() {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState([]);
  const [screen, setScreen] = useState("home");
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    if (!query) return;

    setScreen("plan");
    setLoading(true);

    const prompt = `
User query: "${query}"

Detect the course topic and create a structured learning plan.

STRICT RULES:
- Minimum 10 steps
- Each step MUST include ALL fields:
  - step (number)
  - title (non-empty string)
  - description (at least 15 words)
  - duration_minutes (realistic number like 30, 60, 90)

- Do NOT leave any field empty
- Do NOT return "Untitled"
- Do NOT return empty description

Return ONLY valid JSON array like:
[
  {
    "step": 1,
    "title": "Introduction to JavaScript",
    "description": "Learn what JavaScript is, how it works in browsers, and basic syntax with variables and data types.",
    "duration_minutes": 60
  }
]
`;

    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GEMINI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gemini-2.5-flash-lite",
            messages: [{ role: "user", content: prompt }],
          }),
        }
      );

      const data = await res.json();

      let text = data.choices?.[0]?.message?.content || "";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      const match = text.match(/\[[\s\S]*\]/);

      const parsed = JSON.parse(match[0]).map((item, i) => {
        let title = item.title?.trim();
        let desc = item.description?.trim();

        // fallback fixes
        if (!title || title.toLowerCase() === "untitled") {
          title = `Step ${i + 1} Learning`;
        }

        if (!desc || desc.length < 10) {
          desc = "Detailed explanation will be covered in this step to build strong understanding of the topic.";
        }

        return {
          step: item.step || i + 1,
          title,
          description: desc,
          duration_minutes:
            item.duration_minutes && item.duration_minutes > 0
              ? item.duration_minutes
              : 45,
        };
      });
      console.log(parsed);

      setPlan(parsed);
    } catch (e) {
      alert("AI failed");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>AI Learner</div>

      {/* HOME */}
      {screen === "home" && (
        <div style={styles.center}>
          <div style={styles.searchBox}>
            <input
              style={styles.input}
              placeholder="What do you want to learn?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generatePlan()}
            />

            <div style={styles.sendBtn} onClick={generatePlan}>
              <FiSend />
            </div>
          </div>
        </div>
      )}

      {/* PLAN */}
      {screen === "plan" && (
        <div style={styles.timelineWrapper}>
          <button style={styles.backBtn} onClick={() => setScreen("home")}>
            ← Back
          </button>

          {loading ? <p>Generating...</p> :
            <div style={styles.timeline}>
              {/* LINE */}
              <div style={styles.line}></div>

              {plan.map((step, i) => (
                <div key={i} style={styles.item}>
                  {/* DOT */}
                  <div style={styles.dot}>{step.step}</div>

                  {/* CARD */}
                  <div style={styles.card}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                    <div style={styles.cardHeader}>
                      <h4 style={styles.title}>{step.title}</h4>

                      <div style={styles.duration}>
                        <FiClock size={14} />
                        {step.duration_minutes} min
                      </div>
                    </div>

                    <p style={styles.desc}>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          }


        </div>
      )}
    </div>
  );
}

/* ===== STYLES ===== */

const primary = "#f97316";

const styles = {
  container: {
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
    background: `
    radial-gradient(circle at 20% 20%, #ffedd5, transparent 40%),
    radial-gradient(circle at 80% 30%, #fde68a, transparent 40%),
    radial-gradient(circle at 50% 80%, #fed7aa, transparent 40%),
    #f8fafc
  `,
  },

  header: {
    padding: "20px 40px",
    fontSize: 22,
    fontWeight: 600,
    color: "#fff",
    background: primary,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },

  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "70vh",
  },

  /* SEARCH */
  searchBox: {
    display: "flex",
    alignItems: "center",
    width: 520,
    padding: "12px 16px",
    borderRadius: 50,

    background: "rgba(255,255,255,0.4)",
    backdropFilter: "blur(25px)",

    border: "1px solid rgba(255,255,255,0.6)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
  },

  input: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 16,
  },

  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: primary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    cursor: "pointer",
  },

  /* TIMELINE */
  timelineWrapper: {
    maxWidth: 900,
    margin: "50px 0 0",
  },

  backBtn: {
    marginBottom: 20,
    border: "none",
    background: "transparent",
    color: primary,
    cursor: "pointer",
  },

  timeline: {
    position: "relative",
    paddingLeft: 23,
    paddingRight: 23,
    paddingBottom: 50,
  },

  line: {
    position: "absolute",
    left: 36,
    top: 0,
    bottom: 0,
    width: 3,
    background: primary,
  },

  item: {
    position: "relative",
    marginBottom: 60,
  },

  dot: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: primary,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: "bold",
    boxShadow: "0 0 0 6px rgba(249,115,22,0.2)",
  },

  /* GLASS CARD (REAL EFFECT) */
  card: {
    marginLeft: 60,
    padding: 22,
    borderRadius: 18,

    // REAL glass
    background: "rgba(255, 255, 255, 0.35)",
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",

    border: "1px solid rgba(255,255,255,0.6)",

    boxShadow: `
    0 8px 32px rgba(0,0,0,0.08),
    inset 0 1px 0 rgba(255,255,255,0.6)
  `,
    transition: "all 0.3s ease",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
  },

  duration: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    background: "#fff7ed",
    padding: "4px 10px",
    borderRadius: 8,
    color: "#ea580c",
  },

  desc: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.6,
    textAlign: "left"
  },
};