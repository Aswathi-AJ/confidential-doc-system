// client/src/pages/ResetPassword.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import Toast from "../components/Toast";
import { 
  FaLock, 
  FaKey, 
  FaEye, 
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle
} from "react-icons/fa";
import { RiGovernmentFill } from "react-icons/ri";

function ResetPassword() {
  const [token, setToken] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  // Password strength states
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlToken = queryParams.get("token");
    
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError("Invalid reset link. No token provided.");
    }
  }, []);

  // Check password strength in real-time
  useEffect(() => {
    setPasswordStrength({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    });
  }, [newPassword]);

  const validatePassword = () => {
    if (newPassword.length < 8) {
      setToast({ message: "Password must be at least 8 characters long", type: "error" });
      return false;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setToast({ message: "Password must contain at least one uppercase letter", type: "error" });
      return false;
    }
    if (!/[a-z]/.test(newPassword)) {
      setToast({ message: "Password must contain at least one lowercase letter", type: "error" });
      return false;
    }
    if (!/[0-9]/.test(newPassword)) {
      setToast({ message: "Password must contain at least one number", type: "error" });
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setToast({ message: "Password must contain at least one special character (!@#$%^&* etc.)", type: "error" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setToast({ message: "Passwords do not match", type: "error" });
      return;
    }
    
    if (!validatePassword()) {
      return;
    }

    if (!token) {
      setToast({ message: "Invalid reset token", type: "error" });
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await API.post("/auth/reset-password", { 
        token, 
        newPassword 
      });
      
      setToast({ message: response.data.message || "Password reset successful!", type: "success" });
      
      setTimeout(() => {
        navigate("/login");
      }, 2500);
      
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to reset password", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    const passed = Object.values(passwordStrength).filter(v => v === true).length;
    if (passed <= 2) return "#ef4444";
    if (passed <= 4) return "#f59e0b";
    return "#10b981";
  };

  const getStrengthText = () => {
    const passed = Object.values(passwordStrength).filter(v => v === true).length;
    if (passed <= 2) return "Weak";
    if (passed <= 4) return "Medium";
    return "Strong";
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
      maxWidth: "420px",
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

    togglePassword: {
      position: "absolute",
      right: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      color: "#a5b4fc",
      fontSize: "15px",
      cursor: "pointer",
    },

    strengthContainer: {
      marginTop: "8px",
      padding: "8px",
      background: "rgba(15,15,35,0.6)",
      borderRadius: "8px",
    },

    strengthBar: {
      height: "4px",
      background: "#2a2a4a",
      borderRadius: "2px",
      overflow: "hidden",
      marginBottom: "8px",
    },

    strengthFill: {
      width: `${(Object.values(passwordStrength).filter(v => v === true).length / 5) * 100}%`,
      height: "100%",
      background: getStrengthColor(),
      transition: "width 0.3s ease",
    },

    strengthText: {
      fontSize: "10px",
      color: getStrengthColor(),
      textAlign: "right",
      marginBottom: "8px",
    },

    rulesList: {
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
      marginTop: "8px",
    },

    ruleItem: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "9px",
      color: passwordStrength.length ? "#10b981" : "#94a3b8",
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

  if (!token && error) {
    return (
      <div style={styles.container}>
        <div style={styles.backgroundLayer} />
        <div style={styles.holographicGrid} />
        <div style={styles.card}>
          <div style={{ color: "#fca5a5", textAlign: "center", fontSize: "12px" }}>{error}</div>
          <Link to="/forgot-password" style={styles.link}>
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={styles.container}>
        <div style={styles.backgroundLayer} />
        <div style={styles.holographicGrid} />

        <div style={styles.card}>
          <div style={styles.govBadge}>
            <RiGovernmentFill size={11} />
            GOVT OF INDIA • RESET PASSWORD
          </div>

          <div style={styles.iconWrapper}>
            <div style={styles.iconGlow} />
            <FaKey size={26} color="#f0f9ff" />
          </div>

          <h1 style={styles.title}>Reset Password</h1>
          <p style={styles.subtitle}>
            Create a new secure password for your account
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>New Password</label>
              <div style={styles.inputWrapper}>
                <FaLock style={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a strong password"
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.togglePassword}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div style={styles.strengthContainer}>
                  <div style={styles.strengthBar}>
                    <div style={styles.strengthFill} />
                  </div>
                  <div style={styles.strengthText}>
                    Password Strength: {getStrengthText()}
                  </div>
                  <div style={styles.rulesList}>
                    <div style={styles.ruleItem}>
                      {passwordStrength.length ? <FaCheckCircle size={8} /> : <FaTimesCircle size={8} />}
                      8+ characters
                    </div>
                    <div style={styles.ruleItem}>
                      {passwordStrength.uppercase ? <FaCheckCircle size={8} /> : <FaTimesCircle size={8} />}
                      Uppercase
                    </div>
                    <div style={styles.ruleItem}>
                      {passwordStrength.lowercase ? <FaCheckCircle size={8} /> : <FaTimesCircle size={8} />}
                      Lowercase
                    </div>
                    <div style={styles.ruleItem}>
                      {passwordStrength.number ? <FaCheckCircle size={8} /> : <FaTimesCircle size={8} />}
                      Number
                    </div>
                    <div style={styles.ruleItem}>
                      {passwordStrength.special ? <FaCheckCircle size={8} /> : <FaTimesCircle size={8} />}
                      Special char
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.inputWrapper}>
                <FaLock style={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
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
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>

          <Link to="/login" style={styles.link}>
            ← Back to Login
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

export default ResetPassword;