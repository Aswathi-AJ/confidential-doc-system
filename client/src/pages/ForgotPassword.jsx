import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await API.post("/auth/forgot-password", { email });
      setMessage(response.data.message);
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      padding: "16px"
    },
    card: {
      backgroundColor: "white",
      borderRadius: "24px",
      padding: "32px",
      maxWidth: "400px",
      width: "100%",
      boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
    },
    title: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#1a3c34",
      marginBottom: "8px",
      textAlign: "center"
    },
    subtitle: {
      fontSize: "14px",
      color: "#6b7280",
      textAlign: "center",
      marginBottom: "24px"
    },
    inputGroup: {
      marginBottom: "20px"
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "6px"
    },
    input: {
      width: "100%",
      padding: "12px",
      fontSize: "14px",
      border: "2px solid #e2e8f0",
      borderRadius: "8px",
      outline: "none",
      boxSizing: "border-box",
      transition: "border-color 0.3s"
    },
    button: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#1a5f7a",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.3s"
    },
    buttonDisabled: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#9ca3af",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "not-allowed"
    },
    errorAlert: {
      backgroundColor: "#fee2e2",
      color: "#dc2626",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "16px",
      fontSize: "14px",
      textAlign: "center"
    },
    successAlert: {
      backgroundColor: "#dcfce7",
      color: "#166534",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "16px",
      fontSize: "14px",
      textAlign: "center"
    },
    backLink: {
      textAlign: "center",
      marginTop: "20px"
    },
    link: {
      color: "#1a5f7a",
      textDecoration: "none",
      fontSize: "14px",
      cursor: "pointer"
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Forgot Password</h1>
        <p style={styles.subtitle}>Enter your email to receive a reset link</p>

        {error && <div style={styles.errorAlert}>{error}</div>}
        {message && <div style={styles.successAlert}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              required
              onFocus={(e) => e.target.style.borderColor = "#1a5f7a"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={loading ? styles.buttonDisabled : styles.button}
            onMouseEnter={e => {
              if (!loading) e.target.style.backgroundColor = "#0e4a60";
            }}
            onMouseLeave={e => {
              if (!loading) e.target.style.backgroundColor = "#1a5f7a";
            }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div style={styles.backLink}>
          <Link to="/login" style={styles.link}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;