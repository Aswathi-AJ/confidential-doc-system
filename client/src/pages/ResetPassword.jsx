import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

function ResetPassword() {
  const [token, setToken] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Extract token from URL correctly
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlToken = queryParams.get("token");
    
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError("Invalid reset link. No token provided.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Send token in body as expected by backend
      const response = await API.post("/auth/reset-password", { 
        token: token, 
        newPassword: newPassword 
      });
      
      setMessage(response.data.message);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
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
    inputWrapper: {
      position: "relative",
      width: "100%"
    },
    input: {
      width: "100%",
      padding: "12px",
      paddingRight: "45px",
      fontSize: "14px",
      border: "2px solid #e2e8f0",
      borderRadius: "8px",
      outline: "none",
      boxSizing: "border-box",
      transition: "border-color 0.3s"
    },
    togglePassword: {
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "18px",
      color: "#888"
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

  // Show error if no token
  if (!token && error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorAlert}>{error}</div>
          <div style={styles.backLink}>
            <Link to="/forgot-password" style={styles.link}>
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Reset Password</h1>
        <p style={styles.subtitle}>Enter your new password</p>

        {error && <div style={styles.errorAlert}>{error}</div>}
        {message && <div style={styles.successAlert}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>New Password</label>
            <div style={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                style={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                onFocus={(e) => e.target.style.borderColor = "#1a5f7a"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.togglePassword}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <div style={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                style={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                onFocus={(e) => e.target.style.borderColor = "#1a5f7a"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>
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
            {loading ? "Resetting..." : "Reset Password"}
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

export default ResetPassword;