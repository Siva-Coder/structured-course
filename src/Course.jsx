import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

/* ---------------- CONFIG ---------------- */
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const REACT_APP_GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------------- MAIN APP ---------------- */
export default function Course() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      setView("dashboard");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView("login");
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>AI Course Planner</h1>

      {!user && view === "login" && (
        <Auth setUser={setUser} setView={setView} />
      )}

      {user && view === "dashboard" && (
        <Dashboard
          setView={setView}
          setSelectedCourse={setSelectedCourse}
        />
      )}

      {user && view === "plan" && (
        <Plan
          course={selectedCourse}
          plan={plan}
          setPlan={setPlan}
          loading={loading}
          setLoading={setLoading}
          goBack={() => setView("dashboard")}
        />
      )}

      {user && (
        <button style={styles.logout} onClick={logout}>
          Logout
        </button>
      )}
    </div>
  );
}

/* ---------------- AUTH ---------------- */
function Auth({ setUser, setView }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      setUser(data.user);
      setView("dashboard");
    } else alert(error.message);
  };

  const register = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (!error) alert("Check your email for confirmation");
    else alert(error.message);
  };

  return (
    <div style={styles.card}>
      <input
        placeholder="Email"
        style={styles.input}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        style={styles.input}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button style={styles.button} onClick={login}>
        Login
      </button>
      <button style={styles.buttonOutline} onClick={register}>
        Register
      </button>
    </div>
  );
}

/* ---------------- DASHBOARD ---------------- */
function Dashboard({ setView, setSelectedCourse }) {
  const courses = [
    "Java Full Stack",
    "React Developer",
    "Node.js Backend",
  ];

  return (
    <div style={styles.grid}>
      {courses.map((course) => (
        <div key={course} style={styles.card}>
          <h3>{course}</h3>
          <button
            style={styles.button}
            onClick={() => {
              setSelectedCourse(course);
              setView("plan");
            }}
          >
            Create Plan with AI
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------- PLAN ---------------- */
function Plan({
  course,
  plan,
  setPlan,
  loading,
  setLoading,
  goBack,
}) {
  useEffect(() => {
    generatePlan();
  }, []);

  const generatePlan = async () => {
    setLoading(true);

    const prompt = `
      Create a structured learning plan for ${course}.

      Rules:
      - Minimum 10 steps
      - Each step must include:
        - step number
        - title
        - description
        - duration_minutes (realistic estimate)

      Return ONLY JSON. No markdown.

      Format:
      [
        {
          "step": 1,
          "title": "",
          "description": "",
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
            Authorization: `Bearer ${REACT_APP_GEMINI_API_KEY}`,
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
      text = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

      const match = text.match(/\[[\s\S]*\]/);

      if (!match) {
        console.error("No JSON array found:", text);
        alert("AI response invalid");
        return;
      }

      let parsed;

      try {
        parsed = JSON.parse(match[0]);
      } catch (err) {
        console.error("Parse error:", match[0]);
        alert("AI failed. Check JSON format.");
        return;
      }

      // 3. Ensure duration always exists
      parsed = parsed.map((item, index) => ({
        step: item.step || index + 1,
        title: item.title || "Untitled",
        description: item.description || "",
        duration_minutes: item.duration_minutes || 60,
      }));

      setPlan(parsed);
    } catch (e) {
      console.error(e);
      alert("AI failed. Check JSON format.");
    }

    setLoading(false);
  };

  return (
    <div>
      <h2>{course} Plan</h2>

      <button style={styles.buttonOutline} onClick={goBack}>
        Back
      </button>

      {loading ? <p>Generating plan...</p> :
        <div style={styles.timeline}>
          {/* Single continuous line */}
          <div style={styles.verticalLine}></div>

          {plan.map((step, i) => (
            <div key={i} style={styles.timelineItem}>

              {/* Circle */}
              <div style={styles.circle}>
                {step.step}
              </div>

              {/* Card */}
              <div style={styles.timelineContent}>
                <div style={styles.stepHeader}>
                  <h4 style={styles.stepTitle}>{step.title}</h4>
                  <span style={styles.duration}>
                    ⏱ {step.duration_minutes} min
                  </span>
                </div>

                <p style={styles.stepDesc}>{step.description}</p>
              </div>

            </div>
          ))}
        </div>
      }



      {plan.length > 0 && (
        <button style={styles.button}>Start Learning</button>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const violet = "#7c3aed";

const styles = {
  container: {
    fontFamily: "sans-serif",
    textAlign: "center",
    padding: 20,
  },
  title: {
    color: violet,
  },
  card: {
    border: "1px solid #eee",
    padding: 20,
    margin: 10,
    borderRadius: 10,
  },
  input: {
    display: "block",
    margin: "10px auto",
    padding: 10,
    width: 200,
  },
  button: {
    background: violet,
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: 6,
    margin: 5,
    cursor: "pointer",
  },
  buttonOutline: {
    border: `1px solid ${violet}`,
    color: violet,
    padding: "10px 20px",
    borderRadius: 6,
    margin: 5,
    cursor: "pointer",
    background: "transparent",
  },
  grid: {
    display: "flex",
    justifyContent: "center",
  },
  timeline: {
    position: "relative",
    maxWidth: 800,
    margin: "50px auto",
    paddingLeft: 50,
  },

  verticalLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 20,
    width: 3,
    background: "linear-gradient(to bottom, #7c3aed, #c084fc)",
  },

  timelineItem: {
    position: "relative",
    marginBottom: 60,
  },

  circle: {
    position: "absolute",
    left: -46,
    top: 5,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#7c3aed",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: "bold",
    border: "3px solid #fff",
    boxShadow: "0 0 0 4px rgba(124,58,237,0.2)",
    zIndex: 2,
  },

  timelineContent: {
    background: "#0f172a",
    color: "#fff",
    padding: 20,
    borderRadius: 14,
    marginLeft: 25,
    boxShadow: "0 8px 25px rgba(0,0,0,0.25)",
    transition: "transform 0.2s ease",
  },

  stepTitle: {
    margin: "0 0 10px",
    fontSize: 18,
  },

  stepDesc: {
    margin: 0,
    lineHeight: 1.6,
    color: "#d1d5db",
  },
  stepHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  duration: {
    fontSize: 12,
    background: "#7c3aed22",
    color: "#c4b5fd",
    padding: "4px 8px",
    borderRadius: 6,
    fontWeight: "bold",
  },
  logout: {
    position: "absolute",
    top: 10,
    right: 10,
  },
};