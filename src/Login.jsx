
import { useState } from "react";

const API_URL = "https://rag-backend-nskx.onrender.com/api/auth/login";
export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.detail || "Login failed. Check your credentials."
        );
      }

      if (!data.accessToken && !data.token) {
        throw new Error(
          "Login response did not contain a token. Check LoginResponse.java."
        );
      }

      onLoginSuccess(data);
    } catch (err) {
      setError(
        err.message ||
          "Cannot connect to the backend. Check that Spring Boot is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <p>Sign in to your DocuMind AI workspace.</p>

        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="auth-switch">
          New here?{" "}
          <button type="button" onClick={onSwitchToRegister}>
            Create an account
          </button>
        </p>
      </form>
    </div>
  );
}
