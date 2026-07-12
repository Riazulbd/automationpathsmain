import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SEOHead from "../SEOHead.jsx";
import automationPathsBrandLogo from "../../Automation Paths Logo (3).png";
import { TYPOGRAPHY, useSessionTheme, makeClay } from "./theme.js";
import {
  PROFILE_QUESTIONS,
  DIAGNOSTIC_QUESTIONS,
  CATEGORIES,
  ESTIMATED_MINUTES,
} from "./quizData.js";
import { computeResults, allScoredAnswered } from "./scoring.js";
import { saveQuizSubmission, isSupabaseConfigured } from "./supabaseClient.js";

const UPWORK_URL = "https://www.upwork.com/freelancers/automationpaths";
const QUIZ_PATH = "/funnel-quiz";
const QUIZ_TITLE = "Funnel Health Diagnostic Quiz | Automation Paths";
const QUIZ_DESCRIPTION =
  "Score your funnel in 6–8 minutes. This free diagnostic pinpoints where leads leak, where revenue goes untracked, and which fixes matter most for coaches, course creators, and experts.";

// Meaningful colors (independent of the theme accent) for severity + result bands.
const SEVERITY = {
  Healthy: { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  Improvement: { color: "#F59E0B", bg: "rgba(245,158,11,0.14)" },
  "High Risk": { color: "#F97316", bg: "rgba(249,115,22,0.14)" },
  Critical: { color: "#EF4444", bg: "rgba(239,68,68,0.14)" },
};

const LEVEL_COLOR = {
  "Strong and Scalable": "#10B981",
  "Functional with Hidden Leaks": "#F59E0B",
  "Revenue Leakage Risk": "#F97316",
  "Critical Funnel Blindness": "#EF4444",
};

const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

// Ordered flow: 6 profile questions, then 27 diagnostic questions.
const FLOW = [
  ...PROFILE_QUESTIONS.map((q) => ({ ...q, part: "profile" })),
  ...DIAGNOSTIC_QUESTIONS.map((q) => ({ ...q, part: "diagnostic" })),
];
const TOTAL_QUESTIONS = FLOW.length; // 33

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Small animation hook: count a value from 0 → target with easing.
// ---------------------------------------------------------------------------
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    let start;
    const from = 0;
    const step = (ts) => {
      if (start == null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------
export default function FunnelQuiz() {
  const theme = useSessionTheme();
  const clay = useCallback((extra) => makeClay(theme, extra), [theme]);

  const [width, setWidth] = useState(
    typeof window === "undefined" ? 1200 : window.innerWidth
  );
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = width < 768;

  const [phase, setPhase] = useState("intro"); // intro | questions | gate | results
  const [qIndex, setQIndex] = useState(0);
  const [profileAnswers, setProfileAnswers] = useState({});
  const [diagnosticAnswers, setDiagnosticAnswers] = useState({});
  const [lead, setLead] = useState({ name: "", email: "" });
  const [leadError, setLeadError] = useState("");
  const [results, setResults] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error

  const advanceTimer = useRef(null);
  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  // Reset scroll on each screen change.
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  }, [phase, qIndex]);

  const current = FLOW[qIndex];

  const goNext = useCallback(() => {
    clearTimeout(advanceTimer.current);
    setQIndex((i) => {
      if (i < TOTAL_QUESTIONS - 1) return i + 1;
      setPhase("gate");
      return i;
    });
  }, []);

  const goBack = useCallback(() => {
    clearTimeout(advanceTimer.current);
    if (phase === "gate") {
      setPhase("questions");
      return;
    }
    if (qIndex > 0) setQIndex((i) => i - 1);
    else setPhase("intro");
  }, [phase, qIndex]);

  const answerSingle = useCallback(
    (question, optionIndex, optionText) => {
      if (question.part === "profile") {
        setProfileAnswers((a) => ({ ...a, [question.key]: optionText }));
      } else {
        setDiagnosticAnswers((a) => ({ ...a, [question.id]: optionIndex }));
      }
      clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(goNext, 280);
    },
    [goNext]
  );

  const toggleMulti = useCallback((question, optionText) => {
    setProfileAnswers((a) => {
      const prev = Array.isArray(a[question.key]) ? a[question.key] : [];
      const next = prev.includes(optionText)
        ? prev.filter((v) => v !== optionText)
        : [...prev, optionText];
      return { ...a, [question.key]: next };
    });
  }, []);

  // Keyboard shortcuts during the question flow (1–9 to select).
  useEffect(() => {
    if (phase !== "questions" || !current) return undefined;
    const onKey = (e) => {
      if (e.key === "Enter" && current.type === "multi") {
        const chosen = profileAnswers[current.key];
        if (Array.isArray(chosen) && chosen.length) goNext();
        return;
      }
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > current.options.length) return;
      const idx = n - 1;
      const text = current.options[idx];
      if (current.type === "multi") toggleMulti(current, text);
      else answerSingle(current, idx, text);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, current, profileAnswers, answerSingle, toggleMulti, goNext]);

  const submitLead = useCallback(() => {
    const name = lead.name.trim();
    const email = lead.email.trim();
    if (name.length < 2) {
      setLeadError("Please enter your name.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setLeadError("Please enter a valid email address.");
      return;
    }
    setLeadError("");

    const computed = computeResults(diagnosticAnswers);
    setResults(computed);
    setPhase("results");

    // Best-effort persistence — never blocks the results screen.
    if (isSupabaseConfigured) {
      setSaveState("saving");
      const row = {
        name,
        email,
        profile: profileAnswers,
        answers: diagnosticAnswers,
        total_risk_points: computed.totalRiskPoints,
        max_applicable_points: computed.maxApplicablePoints,
        health_score: computed.healthScore,
        result_level: computed.resultLevel.name,
        category_scores: computed.categoryScores,
        top_leaks: computed.topLeaks,
        critical_flags: computed.criticalFlags,
        page_path: typeof window !== "undefined" ? window.location.pathname : QUIZ_PATH,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      };
      saveQuizSubmission(row).then(({ saved, error }) => {
        setSaveState(saved ? "saved" : "error");
        if (!saved && error) console.warn("Quiz submission not saved:", error.message || error);
      });
    }
  }, [lead, diagnosticAnswers, profileAnswers]);

  const restart = useCallback(() => {
    clearTimeout(advanceTimer.current);
    setPhase("intro");
    setQIndex(0);
    setProfileAnswers({});
    setDiagnosticAnswers({});
    setLead({ name: "", email: "" });
    setLeadError("");
    setResults(null);
    setSaveState("idle");
  }, []);

  // Is the current question answered (controls Continue button state)?
  const currentAnswered = useMemo(() => {
    if (!current) return false;
    if (current.part === "profile") {
      const v = profileAnswers[current.key];
      return current.type === "multi" ? Array.isArray(v) && v.length > 0 : v != null;
    }
    return diagnosticAnswers[current.id] != null;
  }, [current, profileAnswers, diagnosticAnswers]);

  const shell = {
    background: theme.bg,
    color: theme.text,
    fontFamily: TYPOGRAPHY.body,
    minHeight: "100vh",
    overflowX: "hidden",
    position: "relative",
  };

  return (
    <div style={shell}>
      <SEOHead
        title={QUIZ_TITLE}
        description={QUIZ_DESCRIPTION}
        path={QUIZ_PATH}
        publicPaths={[QUIZ_PATH]}
      />
      <GlobalStyles theme={theme} />
      <BackgroundBlobs theme={theme} isMobile={isMobile} />
      <TopBar theme={theme} clay={clay} isMobile={isMobile} />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 760,
          margin: "0 auto",
          padding: isMobile ? "8px 16px 64px" : "20px 20px 96px",
        }}
      >
        {phase === "intro" && (
          <IntroScreen theme={theme} clay={clay} isMobile={isMobile} onStart={() => setPhase("questions")} />
        )}

        {phase === "questions" && current && (
          <QuestionScreen
            key={current.part === "profile" ? `p-${current.id}` : `d-${current.id}`}
            theme={theme}
            clay={clay}
            isMobile={isMobile}
            question={current}
            index={qIndex}
            profileAnswers={profileAnswers}
            diagnosticAnswers={diagnosticAnswers}
            onSingle={answerSingle}
            onToggleMulti={toggleMulti}
            onContinue={goNext}
            onBack={goBack}
            canContinue={currentAnswered}
          />
        )}

        {phase === "gate" && (
          <GateScreen
            theme={theme}
            clay={clay}
            isMobile={isMobile}
            lead={lead}
            setLead={setLead}
            error={leadError}
            onSubmit={submitLead}
            onBack={goBack}
            ready={allScoredAnswered(diagnosticAnswers)}
          />
        )}

        {phase === "results" && results && (
          <ResultsScreen
            theme={theme}
            clay={clay}
            isMobile={isMobile}
            results={results}
            saveState={saveState}
            name={lead.name.trim()}
            onRestart={restart}
          />
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chrome: styles, blobs, top bar
// ---------------------------------------------------------------------------
function GlobalStyles({ theme }) {
  return (
    <style>{`
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body { -webkit-font-smoothing: antialiased; }
      ::selection { background: ${theme.a1}; color: #fff; }
      @keyframes fq_fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fq_pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      @keyframes fq_blob { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(24px,-18px) scale(1.05); } }
      .fq-fade { animation: fq_fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
      .fq-opt:focus-visible { outline: 2px solid ${theme.a1}; outline-offset: 2px; }
      .fq-btn { transition: transform 0.15s ease, box-shadow 0.2s ease; }
      .fq-btn:hover { transform: translateY(-1px); }
      .fq-opt { transition: border-color 0.16s ease, background 0.16s ease, transform 0.12s ease; }
      .fq-opt:hover { border-color: ${theme.hoverBorder} !important; transform: translateY(-1px); }
      input::placeholder { color: ${theme.text3}; }
    `}</style>
  );
}

function BackgroundBlobs({ theme, isMobile }) {
  const blobs = [
    { w: isMobile ? 300 : 520, h: isMobile ? 300 : 520, top: -140, left: -110, glow: theme.glow1 },
    { w: isMobile ? 320 : 560, h: isMobile ? 320 : 560, bottom: -180, right: -140, glow: theme.glow2 },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: b.w,
            height: b.h,
            top: b.top,
            left: b.left,
            bottom: b.bottom,
            right: b.right,
            borderRadius: "50%",
            filter: "blur(100px)",
            background: `radial-gradient(circle,${b.glow},transparent 70%)`,
            animation: `fq_blob ${24 + i * 5}s ease-in-out infinite${i === 1 ? " reverse" : ""}`,
          }}
        />
      ))}
    </div>
  );
}

function TopBar({ theme, clay, isMobile }) {
  return (
    <nav style={{ position: "relative", zIndex: 20, padding: isMobile ? "12px 14px 0" : "14px 20px 0" }}>
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          background: theme.navBg,
          backdropFilter: "blur(22px) saturate(1.5)",
          borderRadius: 999,
          padding: isMobile ? "10px 14px" : "8px 10px 8px 20px",
          boxShadow: clay(theme.cardGlow),
          border: `1px solid ${theme.navBorder}`,
        }}
      >
        <a href="/" style={{ display: "flex", alignItems: "center" }}>
          <img
            src={automationPathsBrandLogo}
            alt="Automation Paths"
            width="200"
            height="50"
            decoding="async"
            style={{ display: "block", height: isMobile ? 26 : 32, width: "auto", objectFit: "contain" }}
          />
        </a>
        <a
          href={UPWORK_URL}
          target="_blank"
          rel="noreferrer"
          className="fq-btn"
          style={{
            padding: isMobile ? "8px 14px" : "9px 20px",
            background: theme.grad,
            color: "#fff",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: isMobile ? "0.78rem" : "0.84rem",
            textDecoration: "none",
            boxShadow: `${theme.btnGlow}, inset 0 2px 4px rgba(255,255,255,0.3)`,
            whiteSpace: "nowrap",
          }}
        >
          Hire on Upwork →
        </a>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Intro
// ---------------------------------------------------------------------------
function IntroScreen({ theme, clay, isMobile, onStart }) {
  const bullets = [
    "A single Funnel Health Score out of 100",
    "Your top 3 funnel leaks, ranked by risk",
    "Prominent warnings on revenue-critical gaps",
    "A category-by-category breakdown of your system",
  ];
  return (
    <section className="fq-fade" style={{ textAlign: "center", paddingTop: isMobile ? 24 : 48 }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          background: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 999,
          fontSize: "0.78rem",
          fontWeight: 600,
          color: theme.text2,
          boxShadow: clay(theme.cardGlow),
          marginBottom: 22,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: theme.a1 }} />
        Free diagnostic · {ESTIMATED_MINUTES}
      </span>

      <h1
        style={{
          fontFamily: TYPOGRAPHY.head,
          fontWeight: 800,
          fontSize: isMobile ? "clamp(2rem,9vw,2.6rem)" : "clamp(2.8rem,5vw,3.8rem)",
          lineHeight: 1.02,
          letterSpacing: "-0.04em",
          marginBottom: 18,
          maxWidth: 620,
          marginInline: "auto",
        }}
      >
        Is your funnel{" "}
        <span style={{ fontStyle: "italic", fontWeight: 350, fontFamily: TYPOGRAPHY.display, color: theme.a1 }}>
          compounding
        </span>{" "}
        or leaking?
      </h1>

      <p
        style={{
          fontSize: isMobile ? "0.95rem" : "1.1rem",
          color: theme.text2,
          lineHeight: 1.7,
          maxWidth: 540,
          margin: "0 auto 28px",
        }}
      >
        Answer 33 quick questions and get an instant, honest read on where leads die, where revenue
        goes untracked, and which fixes will move the needle first.
      </p>

      <div
        style={{
          background: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 22,
          boxShadow: clay(theme.cardGlow),
          padding: isMobile ? "20px 18px" : "26px 28px",
          maxWidth: 460,
          margin: "0 auto 28px",
          textAlign: "left",
        }}
      >
        <div style={{ fontSize: "0.74rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.text3, marginBottom: 14 }}>
          What you'll get
        </div>
        {bullets.map((b) => (
          <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            <span
              style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: theme.chipBg,
                color: theme.a1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: 800,
                marginTop: 1,
              }}
            >
              ✓
            </span>
            <span style={{ fontSize: isMobile ? "0.9rem" : "0.96rem", color: theme.text, lineHeight: 1.5 }}>{b}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        className="fq-btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: isMobile ? "15px 30px" : "16px 40px",
          background: theme.grad,
          color: "#fff",
          border: "none",
          borderRadius: 999,
          fontWeight: 700,
          fontSize: "1rem",
          cursor: "pointer",
          fontFamily: TYPOGRAPHY.body,
          boxShadow: `${theme.btnGlow}, inset 0 2px 6px rgba(255,255,255,0.25)`,
        }}
      >
        Start the diagnostic →
      </button>
      <div style={{ fontSize: "0.78rem", color: theme.text3, marginTop: 16 }}>
        6 profile questions · 27 diagnostic questions · no login required
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Question screen
// ---------------------------------------------------------------------------
function QuestionScreen({
  theme,
  clay,
  isMobile,
  question,
  index,
  profileAnswers,
  diagnosticAnswers,
  onSingle,
  onToggleMulti,
  onContinue,
  onBack,
  canContinue,
}) {
  const isProfile = question.part === "profile";
  const isMulti = question.type === "multi";
  const progress = ((index + 1) / TOTAL_QUESTIONS) * 100;

  const partLabel = isProfile
    ? "Business Profile"
    : CATEGORY_BY_ID.get(question.category)?.name || "Diagnostic";

  const selectedText = isProfile ? profileAnswers[question.key] : null;
  const selectedIdx = isProfile ? null : diagnosticAnswers[question.id];
  const multiSelected = isMulti && Array.isArray(profileAnswers[question.key]) ? profileAnswers[question.key] : [];

  // Diagnostic answers are lettered A–D; profile lists are numbered (some have >7 options).
  const letters = ["A", "B", "C", "D"];

  return (
    <section className="fq-fade">
      {/* Progress */}
      <div style={{ marginBottom: isMobile ? 20 : 28, paddingTop: isMobile ? 10 : 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: "0.76rem", fontWeight: 600 }}>
          <span style={{ color: theme.a1, textTransform: "uppercase", letterSpacing: "0.08em" }}>{partLabel}</span>
          <span style={{ color: theme.text3 }}>
            Question {index + 1} of {TOTAL_QUESTIONS}
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: theme.chipBg, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: theme.grad,
              borderRadius: 999,
              transition: "width 0.4s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </div>
      </div>

      {/* Prompt */}
      <h2
        style={{
          fontFamily: TYPOGRAPHY.head,
          fontWeight: 700,
          fontSize: isMobile ? "1.4rem" : "1.75rem",
          lineHeight: 1.22,
          letterSpacing: "-0.02em",
          marginBottom: question.help ? 8 : 20,
        }}
      >
        {question.prompt}
      </h2>
      {question.help && (
        <p style={{ color: theme.text2, fontSize: isMobile ? "0.86rem" : "0.94rem", lineHeight: 1.55, marginBottom: 20 }}>
          {question.help}
        </p>
      )}
      {isMulti && (
        <p style={{ color: theme.text3, fontSize: "0.8rem", fontWeight: 600, marginBottom: 14 }}>Select all that apply</p>
      )}

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((optRaw, i) => {
          const text = typeof optRaw === "string" ? optRaw : optRaw.text;
          const selected = isMulti
            ? multiSelected.includes(text)
            : isProfile
            ? selectedText === text
            : selectedIdx === i;
          const marker = isMulti ? null : isProfile ? String(i + 1) : letters[i];
          return (
            <button
              key={text}
              className="fq-opt"
              onClick={() =>
                isMulti ? onToggleMulti(question, text) : onSingle(question, i, text)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                textAlign: "left",
                width: "100%",
                padding: isMobile ? "13px 15px" : "15px 18px",
                borderRadius: 16,
                cursor: "pointer",
                fontFamily: TYPOGRAPHY.body,
                fontSize: isMobile ? "0.9rem" : "0.98rem",
                fontWeight: 500,
                lineHeight: 1.4,
                color: theme.text,
                background: selected ? theme.chipBg : theme.card,
                border: `1.5px solid ${selected ? theme.a1 : theme.cardBorder}`,
                boxShadow: selected ? "none" : clay(),
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 26,
                  height: 26,
                  borderRadius: isMulti ? 8 : "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  background: selected ? theme.grad : "transparent",
                  color: selected ? "#fff" : theme.text3,
                  border: selected ? "none" : `1.5px solid ${theme.cardBorder}`,
                }}
              >
                {selected ? (isMulti ? "✓" : marker || "✓") : marker || ""}
              </span>
              <span style={{ flex: 1 }}>{text}</span>
            </button>
          );
        })}
      </div>

      {/* Footer nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, gap: 12 }}>
        <button
          onClick={onBack}
          className="fq-btn"
          style={{
            padding: "11px 20px",
            background: "transparent",
            color: theme.text2,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: 999,
            fontWeight: 600,
            fontSize: "0.86rem",
            cursor: "pointer",
            fontFamily: TYPOGRAPHY.body,
          }}
        >
          ← Back
        </button>

        {/* Multi-select needs an explicit Continue; single-select auto-advances. */}
        {isMulti ? (
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className="fq-btn"
            style={{
              padding: "12px 28px",
              background: canContinue ? theme.grad : theme.chipBg,
              color: canContinue ? "#fff" : theme.text3,
              border: "none",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: canContinue ? "pointer" : "not-allowed",
              fontFamily: TYPOGRAPHY.body,
              boxShadow: canContinue ? theme.btnGlow : "none",
            }}
          >
            Continue →
          </button>
        ) : (
          <span style={{ fontSize: "0.76rem", color: theme.text3 }}>Tap an answer to continue</span>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Lead-capture gate
// ---------------------------------------------------------------------------
function GateScreen({ theme, clay, isMobile, lead, setLead, error, onSubmit, onBack, ready }) {
  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: `1.5px solid ${theme.cardBorder}`,
    background: theme.card,
    color: theme.text,
    fontSize: "1rem",
    fontFamily: TYPOGRAPHY.body,
    outline: "none",
    boxShadow: clay(),
  };
  return (
    <section className="fq-fade" style={{ textAlign: "center", paddingTop: isMobile ? 24 : 56, maxWidth: 460, margin: "0 auto" }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background: theme.grad,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          margin: "0 auto 20px",
          boxShadow: theme.btnGlow,
        }}
      >
        📊
      </div>
      <h2 style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: isMobile ? "1.6rem" : "2rem", letterSpacing: "-0.03em", marginBottom: 10 }}>
        Your Funnel Health Score is ready
      </h2>
      <p style={{ color: theme.text2, fontSize: isMobile ? "0.92rem" : "1rem", lineHeight: 1.6, marginBottom: 26 }}>
        Enter your details to reveal your score, your top funnel leaks, and any revenue-critical warnings.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}
      >
        <input
          type="text"
          placeholder="Your name"
          value={lead.name}
          autoComplete="name"
          onChange={(e) => setLead((l) => ({ ...l, name: e.target.value }))}
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="you@business.com"
          value={lead.email}
          autoComplete="email"
          onChange={(e) => setLead((l) => ({ ...l, email: e.target.value }))}
          style={inputStyle}
        />
        {error && <div style={{ color: "#EF4444", fontSize: "0.84rem", fontWeight: 600 }}>{error}</div>}
        <button
          type="submit"
          disabled={!ready}
          className="fq-btn"
          style={{
            padding: "15px 30px",
            background: theme.grad,
            color: "#fff",
            border: "none",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: "1rem",
            cursor: ready ? "pointer" : "not-allowed",
            fontFamily: TYPOGRAPHY.body,
            boxShadow: theme.btnGlow,
            marginTop: 4,
            opacity: ready ? 1 : 0.7,
          }}
        >
          Reveal my score →
        </button>
      </form>

      <div style={{ fontSize: "0.76rem", color: theme.text3, marginTop: 16, lineHeight: 1.5 }}>
        We'll use this to send your results. No spam.
      </div>
      <button
        onClick={onBack}
        style={{
          marginTop: 18,
          background: "transparent",
          border: "none",
          color: theme.text2,
          fontSize: "0.84rem",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: TYPOGRAPHY.body,
        }}
      >
        ← Back to questions
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------
function ScoreRing({ theme, score, level, isMobile }) {
  const animated = useCountUp(score, 1300);
  const size = isMobile ? 190 : 220;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - animated / 100);
  const color = LEVEL_COLOR[level.name] || theme.a1;

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={theme.chipBg} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: isMobile ? "3.2rem" : "3.8rem", lineHeight: 1, color: theme.text }}>
          {Math.round(animated)}
        </div>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: theme.text3, letterSpacing: "0.04em" }}>out of 100</div>
      </div>
    </div>
  );
}

function ResultsScreen({ theme, clay, isMobile, results, saveState, name, onRestart }) {
  const { healthScore, resultLevel, topLeaks, categoryScores, criticalFlags } = results;
  const levelColor = LEVEL_COLOR[resultLevel.name] || theme.a1;

  return (
    <section className="fq-fade" style={{ paddingTop: isMobile ? 16 : 28 }}>
      {name && (
        <div style={{ textAlign: "center", color: theme.text3, fontSize: "0.86rem", fontWeight: 600, marginBottom: 8 }}>
          {name}, here's your result
        </div>
      )}

      {/* Score hero */}
      <div
        style={{
          background: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 26,
          boxShadow: clay(theme.cardGlow),
          padding: isMobile ? "28px 20px" : "36px 32px",
          textAlign: "center",
          marginBottom: 18,
        }}
      >
        <ScoreRing theme={theme} score={healthScore} level={resultLevel} isMobile={isMobile} />
        <div
          style={{
            display: "inline-block",
            marginTop: 20,
            padding: "6px 16px",
            borderRadius: 999,
            background: `${levelColor}22`,
            color: levelColor,
            fontWeight: 800,
            fontSize: isMobile ? "0.92rem" : "1rem",
            letterSpacing: "-0.01em",
          }}
        >
          {resultLevel.name}
        </div>
        <p style={{ color: theme.text2, fontSize: isMobile ? "0.92rem" : "1rem", lineHeight: 1.65, maxWidth: 520, margin: "16px auto 0" }}>
          {resultLevel.blurb}
        </p>
      </div>

      {/* Critical override warnings */}
      {criticalFlags.length > 0 && (
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1.5px solid rgba(239,68,68,0.4)",
            borderRadius: 22,
            padding: isMobile ? "20px 18px" : "24px 26px",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: "1.3rem" }}>⚠️</span>
            <h3 style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: isMobile ? "1.05rem" : "1.2rem", color: "#DC2626" }}>
              Revenue-critical warnings
            </h3>
          </div>
          <p style={{ color: theme.text2, fontSize: "0.88rem", lineHeight: 1.55, marginBottom: 14 }}>
            These gaps can directly affect revenue, customer experience, or reporting accuracy — even
            when the overall score looks acceptable. Address them first.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {criticalFlags.map((f) => (
              <div
                key={f.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: theme.card,
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 12,
                  padding: "11px 14px",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", flexShrink: 0 }} />
                <span style={{ fontSize: isMobile ? "0.86rem" : "0.92rem", fontWeight: 600, color: theme.text }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top leaks */}
      <div
        style={{
          background: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 22,
          boxShadow: clay(theme.cardGlow),
          padding: isMobile ? "22px 18px" : "26px 28px",
          marginBottom: 18,
        }}
      >
        <h3 style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: isMobile ? "1.1rem" : "1.3rem", marginBottom: 4 }}>
          Your Top Funnel Leaks
        </h3>
        <p style={{ color: theme.text3, fontSize: "0.84rem", marginBottom: 18 }}>The three areas leaking the most revenue right now.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {topLeaks.map((c, i) => {
            const sev = SEVERITY[c.levelShort] || SEVERITY.Improvement;
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    background: theme.chipBg,
                    color: theme.a1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: isMobile ? "0.92rem" : "1rem" }}>{c.name}</span>
                <span
                  style={{
                    flexShrink: 0,
                    padding: "5px 12px",
                    borderRadius: 999,
                    background: sev.bg,
                    color: sev.color,
                    fontWeight: 800,
                    fontSize: "0.74rem",
                    letterSpacing: "0.02em",
                  }}
                >
                  {c.levelShort}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full breakdown */}
      <div
        style={{
          background: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 22,
          boxShadow: clay(theme.cardGlow),
          padding: isMobile ? "22px 18px" : "26px 28px",
          marginBottom: 18,
        }}
      >
        <h3 style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: isMobile ? "1.1rem" : "1.3rem", marginBottom: 18 }}>
          Category Breakdown
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {categoryScores.map((c) => {
            const sev = SEVERITY[c.levelShort] || SEVERITY.Improvement;
            const pct = (c.score / c.max) * 100;
            return (
              <div key={c.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10 }}>
                  <span style={{ fontSize: isMobile ? "0.86rem" : "0.94rem", fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: "0.74rem", fontWeight: 800, color: sev.color }}>{c.levelShort}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: theme.chipBg, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: sev.color, borderRadius: 999, transition: "width 0.6s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          background: theme.grad,
          borderRadius: 24,
          padding: isMobile ? "26px 20px" : "34px 32px",
          textAlign: "center",
          boxShadow: theme.btnGlow,
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontFamily: TYPOGRAPHY.head, fontWeight: 800, fontSize: isMobile ? "1.3rem" : "1.6rem", color: "#fff", marginBottom: 10, letterSpacing: "-0.02em" }}>
          Ready to plug the leaks?
        </h3>
        <p style={{ color: "rgba(255,255,255,0.92)", fontSize: isMobile ? "0.92rem" : "1rem", lineHeight: 1.6, maxWidth: 460, margin: "0 auto 22px" }}>
          I rebuild funnels around how leads actually move from first touch to closed revenue — CRM,
          AI, follow-up, and dashboards, tested and documented.
        </p>
        <a
          href={UPWORK_URL}
          target="_blank"
          rel="noreferrer"
          className="fq-btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: isMobile ? "14px 28px" : "15px 36px",
            background: "#fff",
            color: theme.text,
            borderRadius: 999,
            fontWeight: 700,
            fontSize: "0.98rem",
            textDecoration: "none",
            boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
          }}
        >
          Book a Revenue Systems Audit →
        </a>
      </div>

      <div style={{ textAlign: "center" }}>
        {saveState === "saved" && (
          <div style={{ color: theme.text3, fontSize: "0.8rem", marginBottom: 10 }}>✓ Your results were saved.</div>
        )}
        <button
          onClick={onRestart}
          style={{
            background: "transparent",
            border: `1px solid ${theme.cardBorder}`,
            color: theme.text2,
            padding: "10px 22px",
            borderRadius: 999,
            fontWeight: 600,
            fontSize: "0.84rem",
            cursor: "pointer",
            fontFamily: TYPOGRAPHY.body,
          }}
        >
          ↻ Retake the diagnostic
        </button>
      </div>
    </section>
  );
}
