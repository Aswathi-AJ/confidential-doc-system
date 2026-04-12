// client/src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { 
  FaLock, 
  FaEnvelope, 
  FaEye, 
  FaEyeSlash, 
  FaShieldAlt, 
  FaKey,
  FaArrowRight,
  FaFileAlt,
  FaUserLock
} from "react-icons/fa";
import { MdSecurity, MdVerified } from "react-icons/md";
import { RiGovernmentFill } from "react-icons/ri";
import { isValidEmail,  sanitizeInput } from "../utils/xssProtection";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // ✅ XSS PROTECTION: Validate and sanitize inputs
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    // Sanitize email (remove any potential XSS)
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    
    setLoading(true);
    setError("");
    
    try {
      // Send sanitized data to backend
      const response = await API.post("/auth/login", { 
        email: sanitizedEmail, 
        password: sanitizedPassword 
      });
      
      localStorage.setItem("token", response.data.token);
      
      const userData = {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        role: response.data.user.role
      };
      localStorage.setItem("user", JSON.stringify(userData));
      
      navigate("/dashboard", { replace: true });
      
    } catch (err) {
      const message = err.response?.data?.message || "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Rest of your styles remain exactly the same...
  const styles = {
    container: {
      height: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      background: "#0a0a14",
      overflow: "hidden",
      fontFamily: "'Inter', system-ui, sans-serif",
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
      padding: isMobile ? "20px 16px" : "22px 28px",
      width: "100%",
      maxWidth: isMobile ? "90%" : "380px",
      boxShadow: `
        0 20px 40px -12px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(103, 232, 249, 0.15)
      `,
    },

    govBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      background: "rgba(103, 232, 249, 0.12)",
      color: "#67e8f9",
      padding: "4px 12px",
      borderRadius: "30px",
      fontSize: "9px",
      fontWeight: "600",
      letterSpacing: "0.6px",
      border: "1px solid rgba(103, 232, 249, 0.25)",
      marginBottom: "16px",
      width: "fit-content",
    },

    iconWrapper: {
      width: isMobile ? "50px" : "56px",
      height: isMobile ? "50px" : "56px",
      background: "linear-gradient(135deg, #7c3aed, #22d3ee, #a855f7)",
      borderRadius: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 16px",
      position: "relative",
      boxShadow: "0 0 30px rgba(103, 232, 249, 0.3)",
    },

    iconGlow: {
      position: "absolute",
      inset: "-8px",
      background: "radial-gradient(circle, rgba(103,232,249,0.3) 0%, transparent 70%)",
      borderRadius: "20px",
      animation: "holoPulse 3s ease-in-out infinite",
      zIndex: -1,
    },

    title: {
      fontSize: isMobile ? "20px" : "24px",
      fontWeight: "700",
      color: "#f0f9ff",
      textAlign: "center",
      marginBottom: "4px",
      letterSpacing: "-0.5px",
    },

    subtitle: {
      fontSize: "11px",
      color: "#a5b4fc",
      textAlign: "center",
      marginBottom: "20px",
      lineHeight: "1.4",
    },

    errorAlert: {
      background: "rgba(248, 113, 113, 0.12)",
      border: "1px solid rgba(248, 113, 113, 0.3)",
      color: "#fca5a5",
      padding: "8px 10px",
      borderRadius: "10px",
      marginBottom: "16px",
      fontSize: "11px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },

    form: { 
      display: "flex", 
      flexDirection: "column", 
      gap: "14px" 
    },

    inputGroup: { 
      display: "flex", 
      flexDirection: "column", 
      gap: "4px" 
    },

    label: {
      fontSize: "10px",
      fontWeight: "600",
      color: "#c4b5fd",
      display: "flex",
      alignItems: "center",
      gap: "5px",
    },

    inputWrapper: { 
      position: "relative" 
    },

    inputIcon: {
      position: "absolute",
      left: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#818cf8",
      fontSize: "12px",
    },

    input: {
      width: "100%",
      padding: "9px 10px 9px 34px",
      fontSize: "12px",
      backgroundColor: "rgba(15, 15, 35, 0.85)",
      border: "1.5px solid rgba(129, 140, 248, 0.35)",
      borderRadius: "10px",
      color: "#f0f9ff",
      outline: "none",
      transition: "all 0.3s ease",
      fontFamily: "inherit",
      boxSizing: "border-box",
    },

    togglePassword: {
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      color: "#a5b4fc",
      fontSize: "13px",
      cursor: "pointer",
    },

    button: {
      background: "linear-gradient(90deg, #7c3aed, #22d3ee)",
      color: "#0a0a14",
      padding: "9px 14px",
      fontSize: "12px",
      fontWeight: "700",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      marginTop: "4px",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      boxShadow: "0 4px 12px rgba(103, 232, 249, 0.3)",
      transition: "all 0.3s ease",
    },

    buttonDisabled: {
      background: "#475569",
      color: "#94a3b8",
      cursor: "not-allowed",
      boxShadow: "none",
    },

    links: {
      textAlign: "center",
      marginTop: "10px",
    },

    link: {
      color: "#67e8f9",
      textDecoration: "none",
      fontSize: "10px",
      fontWeight: "500",
    },

    securityGrid: {
      marginTop: "20px",
      paddingTop: "16px",
      borderTop: "1px solid rgba(129, 140, 248, 0.2)",
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "6px",
    },

    securityCard: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
      textAlign: "center",
    },

    securityIcon: {
      width: "24px",
      height: "24px",
      background: "rgba(103, 232, 249, 0.1)",
      border: "1px solid rgba(103, 232, 249, 0.2)",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#67e8f9",
    },

    securityLabel: {
      fontSize: "7px",
      fontWeight: "500",
      color: "#a5b4fc",
      letterSpacing: "0.2px",
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundLayer} />
      <div style={styles.holographicGrid} />

      <div style={styles.card}>
        <div style={styles.govBadge}>
          <RiGovernmentFill size={10} />
          GOVT OF INDIA • SECURE PORTAL
        </div>

        <div style={styles.iconWrapper}>
          <div style={styles.iconGlow} />
          <FaLock size={isMobile ? 22 : 24} color="#f0f9ff" />
        </div>

        <h1 style={styles.title}>Secure Login</h1>
        <p style={styles.subtitle}>
          Confidential Government Document System
        </p>

        {error && (
          <div style={styles.errorAlert}>
            <FaShieldAlt size={10} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <FaEnvelope size={9} /> Official Email
            </label>
            <div style={styles.inputWrapper}>
              <FaEnvelope style={styles.inputIcon} />
              <input
                type="email"
                placeholder="officer.name@gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                disabled={loading}
                autoComplete="email"
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

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <FaKey size={9} /> Password
            </label>
            <div style={styles.inputWrapper}>
              <FaLock style={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                disabled={loading}
                autoComplete="current-password"
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
          </div>

          <button 
            type="submit" 
            style={loading ? styles.buttonDisabled : styles.button}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? "Authenticating..." : "Login to System"}
            <FaArrowRight size={10} />
          </button>

          <div style={styles.links}>
            <Link to="/forgot-password" style={styles.link}>
              Forgot Password?
            </Link>
          </div>
        </form>

        <div style={styles.securityGrid}>
          <div style={styles.securityCard}>
            <div style={styles.securityIcon}>
              <MdSecurity size={12} />
            </div>
            <span style={styles.securityLabel}>AES-256</span>
          </div>
          <div style={styles.securityCard}>
            <div style={styles.securityIcon}>
              <MdVerified size={12} />
            </div>
            <span style={styles.securityLabel}>Tamper Proof</span>
          </div>
          <div style={styles.securityCard}>
            <div style={styles.securityIcon}>
              <FaFileAlt size={12} />
            </div>
            <span style={styles.securityLabel}>Audit Logs</span>
          </div>
          <div style={styles.securityCard}>
            <div style={styles.securityIcon}>
              <FaUserLock size={12} />
            </div>
            <span style={styles.securityLabel}>RBAC</span>
          </div>
        </div>
      </div>

      <style jsx>{`
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
  );
}

export default Login;