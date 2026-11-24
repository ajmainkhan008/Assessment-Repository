
import { useState } from "react";

const API_URL = "http://localhost:8000";

function Login({ onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getCookie(name) {
    const cookies = document.cookie.split(";");

    for (let cookie of cookies) {
      cookie = cookie.trim();

      if (cookie.startsWith(name + "=")) {
        return decodeURIComponent(cookie.substring(name.length + 1));
      }
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // First, request a CSRF cookie from Django.
      const csrfResponse = await fetch(`${API_URL}/api/csrf/`, {
        method: "GET",
        credentials: "include",
      });

      if (!csrfResponse.ok) {
        throw new Error("Could not connect to the login service.");
      }

      const csrfToken = getCookie("csrftoken");

      if (!csrfToken) {
        throw new Error("CSRF token not found. Please refresh and try again.");
      }

      // Send the admin login credentials.
      const response = await fetch(`${API_URL}/api/login/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Login failed.");
      }

      // Django has created an authenticated session.
      window.location.href = `${API_URL}/admin/`;
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-icon">L</div>

        <h1>Admin Login</h1>
        <p className="login-description">
          Sign in to manage lost and found reports.
        </p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            className="submit-button login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <button className="back-button" type="button" onClick={onBack}>
          Back to home
        </button>
      </section>
    </main>
  );
}

export default Login;
