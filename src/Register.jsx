
import { useState } from "react";

const API_URL = "https://rag-backend-nskx.onrender.com/api/auth/register";
export default function Register({ onSwitchToLogin, onRegisterSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    tenantName: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.detail || "Registration failed. Please try again."
        );
      }

      setSuccess("Registration successful! You can now log in.");

      if (onRegisterSuccess) {
        onRegisterSuccess(data);
      }
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
        <h1>Create your account</h1>
        <p>Register to start using DocuMind AI.</p>

        <label htmlFor="name">Full name</label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter your name"
          required
        />

        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={6}
          maxLength={100}
          value={form.password}
          onChange={handleChange}
          placeholder="At least 6 characters"
          required
        />

        <label htmlFor="tenantName">Workspace name</label>
        <input
          id="tenantName"
          name="tenantName"
          value={form.tenantName}
          onChange={handleChange}
          placeholder="Enter your company or workspace"
          required
        />

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="auth-switch">
          Already have an account?{" "}
          <button type="button" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
}
