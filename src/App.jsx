import React, { Suspense, lazy, useEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AutomationPathsSite from "../automation-paths-final.jsx";
import { trackPageview, initClickTracking } from "./analytics.js";

const FunnelQuiz = lazy(() => import("./quiz/FunnelQuiz.jsx"));
const Dashboard = lazy(() => import("./quiz/Dashboard.jsx"));

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

// Fires a pageview on first load and on every client-side route change, and
// installs the global click listener once. Renders nothing.
function AnalyticsTracker() {
  const location = useLocation();
  const lastPath = useRef(null);

  useEffect(() => {
    initClickTracking();
  }, []);

  useEffect(() => {
    if (lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;
    trackPageview(location.pathname);
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <AnalyticsTracker />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<AutomationPathsSite />} />
          <Route path="/funnel-quiz" element={<FunnelQuiz />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Legacy path → new location */}
          <Route path="/funnel-quiz/admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
