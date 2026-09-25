import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { buttonStyle, inputStyle, panelStyle } from "./ui";

export default function AdminLogin() {
  const theme = useTheme();
  const { user, login } = useAuth();
  const [email, setEmail] = useState("riaz@automationpaths.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        display: "grid",
        placeItems: "center",
        padding: 20
      }}
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError("");
          try {
            await login(email, password);
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        }}
        style={{
          ...panelStyle(theme, {
            width: "min(460px, 100%)",
            padding: 28,
            display: "grid",
            gap: 16
          })
        }}
      >
        <div>
          <p style={{ margin: "0 0 10px", color: theme.tagC, fontFamily: "IBM Plex Mono, monospace", textTransform: "uppercase", fontSize: "0.78rem" }}>
            Admin Access
          </p>
          <h1 style={{ margin: 0, fontFamily: "Outfit, sans-serif", color: theme.text }}>Sign in to the blog CMS</h1>
        </div>
        <input
          className="admin-input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          style={inputStyle(theme)}
        />
        <input
          className="admin-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          style={inputStyle(theme)}
        />
        {error ? <div style={{ color: "#b91c1c", fontFamily: "Manrope, sans-serif" }}>{error}</div> : null}
        <button type="submit" disabled={loading} style={buttonStyle(theme, "primary")}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

