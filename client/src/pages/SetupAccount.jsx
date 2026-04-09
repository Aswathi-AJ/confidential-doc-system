// client/src/pages/SetupAccount.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import API from "../services/api";
import { 
  FaLock, 
  FaKey, 
  FaEye, 
  FaEyeSlash, 
  FaShieldAlt 
} from "react-icons/fa";
import { RiGovernmentFill } from "react-icons/ri";

function SetupAccount() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError("Invalid setup link. Please contact administrator.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await API.post("/auth/setup-account", { token, password });
      setSuccess(response.data.message || "Account setup completed successfully!");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Setup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      background: "#0a0a14",
      overflow: "hidden",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "20px",
    },

    backgroundLayer: {
      position: "absolute",
      inset: 0,
      background: `
        radial-gradient(circle at 30% 25%, rgba(103, 232, 249, 0.15) 0%, transparent 55%),
        radial-gradient(circle at 70% 75%, rgba(167, 139, 250, 0.12) 0%, transparent 55%)
      `,
      zIndex: 1,
    },

    holographicGrid: {
      position: "absolute",
      inset: 0,
      zIndex: 2,
      backgroundImage: `
        linear-gradient(rgba(103,232,249,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(103,232,249,0.05) 1px, transparent 1px)
      `,
      backgroundSize: "45px 45px",
      animation: "holoScan 14s linear infinite",
      pointerEvents: "none",
    },

    card: {
      position: "relative",
      zIndex: 10,
      background: "rgba(15, 15, 35, 0.90)",
      backdropFilter: "blur(24px)",
      border: "1px solid rgba(167, 139, 250, 0.35)",
      borderRadius: "28px",
      padding: "32px 28px",
      width: "100%",
      maxWidth: "400px",
      boxShadow: `
        0 30px 60px -20px rgba(0, 0, 0, 0.75),
        0 0 0 1.5px rgba(167, 139, 250, 0.3),
        inset 0 0 40px rgba(103, 232, 249, 0.08)
      `,
    },

    govBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      background: "rgba(167, 139, 250, 0.18)",
      color: "#c4b5fd",
      padding: "6px 16px",
      borderRadius: "50px",
      fontSize: "11px",
      fontWeight: "700",
      letterSpacing: "1px",
      border: "1px solid rgba(167, 139, 250, 0.4)",
      marginBottom: "24px",
      width: "fit-content",
    },

    iconWrapper: {
      width: "64px",
      height: "64px",
      background: "linear-gradient(135deg, #7c3aed, #22d3ee, #a855f7)",
      borderRadius: "20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 24px",
      position: "relative",
      boxShadow: "0 0 50px rgba(103, 232, 249, 0.5)",
    },

    iconGlow: {
      position: "absolute",
      inset: "-16px",
      background: "radial-gradient(circle, rgba(103,232,249,0.45) 20%, transparent 70%)",
      borderRadius: "inherit",
      animation: "holoPulse 2.8s ease-in-out infinite",
      zIndex: -1,
    },

    title: {
      fontSize: "24px",
      fontWeight: "800",
      color: "#f0f9ff",
      textAlign: "center",
      marginBottom: "6px",
      letterSpacing: "-0.5px",
      textShadow: "0 0 15px rgba(103, 232, 249, 0.3)",
    },

    subtitle: {
      fontSize: "13px",
      color: "#a5b4fc",
      textAlign: "center",
      marginBottom: "28px",
      lineHeight: "1.5",
    },

    errorAlert: {
      background: "rgba(248, 113, 113, 0.15)",
      border: "1px solid rgba(248, 113, 113, 0.45)",
      color: "#fda4af",
      padding: "10px 14px",
      borderRadius: "14px",
      marginBottom: "20px",
      fontSize: "12px",
      textAlign: "center",
    },

    successAlert: {
      background: "rgba(103, 232, 249, 0.15)",
      border: "1px solid rgba(103, 232, 249, 0.45)",
      color: "#67e8f9",
      padding: "10px 14px",
      borderRadius: "14px",
      marginBottom: "20px",
      fontSize: "12px",
      textAlign: "center",
    },

    form: {
      display: "flex",
      flexDirection: "column",
      gap: "18px",
    },

    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },

    label: {
      fontSize: "12px",
      fontWeight: "600",
      color: "#c4b5fd",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },

    inputWrapper: {
      position: "relative",
    },

    input: {
      width: "100%",
      padding: "12px 14px 12px 44px",
      fontSize: "14px",
      backgroundColor: "rgba(15, 15, 35, 0.85)",
      border: "2px solid rgba(129, 140, 248, 0.4)",
      borderRadius: "14px",
      color: "#f0f9ff",
      outline: "none",
      transition: "all 0.35s ease",
      fontFamily: "inherit",
      boxSizing: "border-box",
    },

    inputIcon: {
      position: "absolute",
      left: "16px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#818cf8",
      fontSize: "16px",
    },

    togglePassword: {
      position: "absolute",
      right: "16px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      color: "#a5b4fc",
      fontSize: "18px",
      cursor: "pointer",
    },

    button: {
      background: "linear-gradient(90deg, #7c3aed, #22d3ee)",
      color: "#0a0a14",
      padding: "12px",
      fontSize: "14px",
      fontWeight: "700",
      border: "none",
      borderRadius: "14px",
      cursor: "pointer",
      marginTop: "6px",
      width: "100%",
      transition: "all 0.3s ease",
      boxShadow: "0 8px 25px rgba(103, 232, 249, 0.35)",
    },

    buttonDisabled: {
      background: "#475569",
      color: "#94a3b8",
      cursor: "not-allowed",
      boxShadow: "none",
    },

    link: {
      color: "#67e8f9",
      textDecoration: "none",
      fontSize: "12px",
      fontWeight: "500",
      textAlign: "center",
      display: "block",
      marginTop: "18px",
    }
  };

  if (!token && error) {
    return (
      <div style={styles.container}>
        <div style={styles.backgroundLayer} />
        <div style={styles.holographicGrid} />
        <div style={{
          background: "rgba(15,15,35,0.95)",
          border: "1px solid rgba(167,139,250,0.4)",
          borderRadius: "24px",
          padding: "32px 28px",
          textAlign: "center",
          maxWidth: "400px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)"
        }}>
          <FaShieldAlt size={44} color="#fda4af" style={{ marginBottom: "16px" }} />
          <div style={styles.errorAlert}>{error}</div>
          <Link to="/login" style={styles.link}>← Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.backgroundLayer} />
      <div style={styles.holographicGrid} />

      <div style={styles.card}>
        <div style={styles.govBadge}>
          <RiGovernmentFill size={13} />
          GOVERNMENT OF INDIA • SECURE ONBOARDING
        </div>

        <div style={styles.iconWrapper}>
          <div style={styles.iconGlow} />
          <FaKey size={30} color="#f0f9ff" />
        </div>

        <h1 style={styles.title}>Setup Your Account</h1>
        <p style={styles.subtitle}>
          Create a strong password to activate your secure access
        </p>

        {error && <div style={styles.errorAlert}>{error}</div>}
        {success && <div style={styles.successAlert}>{success}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <FaLock size={12} /> New Password
            </label>
            <div style={styles.inputWrapper}>
              <FaLock style={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                style={styles.input}
                required
                onFocus={(e) => {
                  e.target.style.borderColor = "#67e8f9";
                  e.target.style.boxShadow = "0 0 0 4px rgba(103, 232, 249, 0.2)";
                  e.target.style.backgroundColor = "rgba(15, 15, 35, 0.95)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(129, 140, 248, 0.4)";
                  e.target.style.boxShadow = "none";
                  e.target.style.backgroundColor = "rgba(15, 15, 35, 0.85)";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.togglePassword}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <FaLock size={12} /> Confirm Password
            </label>
            <div style={styles.inputWrapper}>
              <FaLock style={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                style={styles.input}
                required
                onFocus={(e) => {
                  e.target.style.borderColor = "#67e8f9";
                  e.target.style.boxShadow = "0 0 0 4px rgba(103, 232, 249, 0.2)";
                  e.target.style.backgroundColor = "rgba(15, 15, 35, 0.95)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(129, 140, 248, 0.4)";
                  e.target.style.boxShadow = "none";
                  e.target.style.backgroundColor = "rgba(15, 15, 35, 0.85)";
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={loading ? styles.buttonDisabled : styles.button}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(103, 232, 249, 0.45)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(103, 232, 249, 0.35)";
              }
            }}
          >
            {loading ? "Setting up secure account..." : "Complete Registration"}
          </button>
        </form>

        <Link to="/login" style={styles.link}>
          ← Back to Login
        </Link>
      </div>

      <style jsx>{`
        @keyframes holoScan {
          0% { background-position: 0 0; }
          100% { background-position: 400px 400px; }
        }

        @keyframes holoPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.15); }
        }

        input:focus {
          border-color: #67e8f9 !important;
        }
      `}</style>
    </div>
  );
}

export default SetupAccount;