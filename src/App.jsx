import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AutomationPathsSite from "../automation-paths-final.jsx";

const FunnelQuiz = lazy(() => import("./quiz/FunnelQuiz.jsx"));
const QuizDashboard = lazy(() => import("./quiz/QuizDashboard.jsx"));

function LoadingFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "Manrope, sans-serif",
        color: "#1A1A2E",
        background: "#FAFAF8"
      }}
    >
      Loading...
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<AutomationPathsSite />} />
        <Route path="/funnel-quiz" element={<FunnelQuiz />} />
        <Route path="/funnel-quiz/admin" element={<QuizDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
