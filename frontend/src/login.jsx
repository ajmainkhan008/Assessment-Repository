
import { useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function Login({ onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Obtain Django's CSRF cookie first.
      await fetch(`${API_URL}/api/csrf/`, {
        credentials: "include",
      });

      const csrfCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="));

      const csrfToken = csrfCookie
        ? csrfCookie.split("=")[1]
        : "";

      const response = await fetch(`${API_URL}/api/login/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Login failed.");
      }

      // Django has now created an authenticated session.
      window.location.href = `${API_URL}/admin/`;

    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo">L</div>

        <p className="login-tag">LOST & FOUND MANAGEMENT</p>

        <h1>Admin Login</h1>

        <p className="login-description">
          Welcome back. Sign in to manage reports, matches and handovers.
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>

          <div className="field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            className="submit-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        <button className="back-button" onClick={onBack}>
          ← Back to Lost & Found
        </button>

        <p className="login-footer">
          Authorized administrators only
        </p>

      </div>
    </div>
  );
}

export default Login;
