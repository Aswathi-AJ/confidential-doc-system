// client/src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import Toast from "../components/Toast";
import { 
  FaEnvelope, 
  FaKey, 
  FaArrowLeft
} from "react-icons/fa";
import { RiGovernmentFill } from "react-icons/ri";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await API.post("/auth/forgot-password", { email });
      setToast({ message: response.data.message || "Reset link sent to your email", type: "success" });
      setEmail("");
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to send reset link", type: "error" });
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
        radial-gradient(circle at 30% 25%, rgba(103, 232, 249, 0.12) 0%, transparent 55%),
        radial-gradient(circle at 70% 75%, rgba(167, 139, 250, 0.10) 0%, transparent 55%)
      `,
      zIndex: 1,
    },

    holographicGrid: {
      position: "absolute",
      inset: 0,
      zIndex: 2,
      backgroundImage: `
        linear-gradient(rgba(103,232,249,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(103,232,249,0.04) 1px, transparent 1px)
      `,
      backgroundSize: "40px 40px",
      animation: "holoScan 15s linear infinite",
      pointerEvents: "none",
    },

    card: {
      position: "relative",
      zIndex: 10,
      background: "rgba(15, 15, 35, 0.92)",
      backdropFilter: "blur(24px)",
      border: "1px solid rgba(103, 232, 249, 0.3)",
      borderRadius: "24px",
      padding: "28px 24px",
      width: "100%",
      maxWidth: "400px",
      boxShadow: `
        0 20px 40px -12px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(103, 232, 249, 0.15)
      `,
    },

    govBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      background: "rgba(103, 232, 249, 0.12)",
      color: "#67e8f9",
      padding: "5px 14px",
      borderRadius: "30px",
      fontSize: "10px",
      fontWeight: "600",
      letterSpacing: "0.8px",
      border: "1px solid rgba(103, 232, 249, 0.25)",
      marginBottom: "20px",
      width: "fit-content",
    },

    iconWrapper: {
      width: "56px",
      height: "56px",
      background: "linear-gradient(135deg, #7c3aed, #22d3ee, #a855f7)",
      borderRadius: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 20px",
      position: "relative",
      boxShadow: "0 0 35px rgba(103, 232, 249, 0.35)",
    },

    iconGlow: {
      position: "absolute",
      inset: "-10px",
      background: "radial-gradient(circle, rgba(103,232,249,0.3) 0%, transparent 70%)",
      borderRadius: "22px",
      animation: "holoPulse 3s ease-in-out infinite",
      zIndex: -1,
    },

    title: {
      fontSize: "22px",
      fontWeight: "700",
      color: "#f0f9ff",
      textAlign: "center",
      marginBottom: "6px",
      letterSpacing: "-0.5px",
    },

    subtitle: {
      fontSize: "12px",
      color: "#a5b4fc",
      textAlign: "center",
      marginBottom: "24px",
      lineHeight: "1.4",
    },

    form: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },

    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },

    label: {
      fontSize: "11px",
      fontWeight: "600",
      color: "#c4b5fd",
    },

    inputWrapper: {
      position: "relative",
    },

    input: {
      width: "100%",
      padding: "10px 12px 10px 40px",
      fontSize: "13px",
      backgroundColor: "rgba(15, 15, 35, 0.85)",
      border: "1.5px solid rgba(129, 140, 248, 0.35)",
      borderRadius: "10px",
      color: "#f0f9ff",
      outline: "none",
      transition: "all 0.3s ease",
      fontFamily: "inherit",
      boxSizing: "border-box",
    },

    inputIcon: {
      position: "absolute",
      left: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#818cf8",
      fontSize: "14px",
    },

    button: {
      background: "linear-gradient(90deg, #7c3aed, #22d3ee)",
      color: "#0a0a14",
      padding: "10px",
      fontSize: "13px",
      fontWeight: "700",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      marginTop: "4px",
      width: "100%",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(103, 232, 249, 0.3)",
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
      fontSize: "11px",
      fontWeight: "500",
      textAlign: "center",
      marginTop: "16px",
      display: "block",
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={styles.container}>
        <div style={styles.backgroundLayer} />
        <div style={styles.holographicGrid} />

        <div style={styles.card}>
          <div style={styles.govBadge}>
            <RiGovernmentFill size={11} />
            GOVT OF INDIA • PASSWORD RECOVERY
          </div>

          <div style={styles.iconWrapper}>
            <div style={styles.iconGlow} />
            <FaKey size={26} color="#f0f9ff" />
          </div>

          <h1 style={styles.title}>Forgot Password</h1>
          <p style={styles.subtitle}>
            Enter your registered email to receive a reset link
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Official Email</label>
              <div style={styles.inputWrapper}>
                <FaEnvelope style={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer.name@gov.in"
                  style={styles.input}
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = "#67e8f9";
                    e.target.style.boxShadow = "0 0 0 3px rgba(103, 232, 249, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(129, 140, 248, 0.35)";
                    e.target.style.boxShadow = "none";
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
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(103, 232, 249, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(103, 232, 249, 0.3)";
                }
              }}
            >
              {loading ? "Sending Reset Link..." : "Send Reset Link"}
            </button>
          </form>

          <Link to="/login" style={styles.link}>
            <FaArrowLeft size={10} style={{ marginRight: "4px" }} /> Back to Login
          </Link>
        </div>

        <style>{`
          @keyframes holoScan {
            0% { background-position: 0 0; }
            100% { background-position: 80px 80px; }
          }

          @keyframes holoPulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.08); }
          }

          input:focus {
            border-color: #67e8f9 !important;
          }
        `}</style>
      </div>
    </>
  );
}

export default ForgotPassword;