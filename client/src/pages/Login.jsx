import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      const userData = JSON.parse(user);
      if (userData.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await API.post("/auth/login", { email, password });
      
      // Store token
      localStorage.setItem("token", response.data.token);
      
      // Store user data from response (more reliable than decoding token)
      const userData = {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        role: response.data.user.role
      };
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Redirect based on role
      if (userData.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
      
    } catch (err) {
      const message = err.response?.data?.message || "Login failed. Please try again.";
      setError(message);
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
      background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
      padding: isMobile ? "16px" : isTablet ? "24px" : "32px",
      fontFamily: "'Segoe UI', Roboto, sans-serif"
    },
    card: {
      backgroundColor: "white",
      borderRadius: isMobile ? "20px" : "24px",
      padding: isMobile ? "24px" : isTablet ? "32px" : "40px",
      width: "100%",
      maxWidth: isMobile ? "100%" : isTablet ? "500px" : "450px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
      animation: "fadeInUp 0.5s ease"
    },
    header: {
      textAlign: "center",
      marginBottom: isMobile ? "24px" : "32px"
    },
    icon: {
      fontSize: isMobile ? "40px" : "48px",
      marginBottom: "12px"
    },
    title: {
      color: "#1a3c34",
      fontSize: isMobile ? "20px" : isTablet ? "22px" : "24px",
      marginBottom: "8px",
      fontWeight: "700"
    },
    subtitle: {
      color: "#666",
      fontSize: isMobile ? "12px" : "13px",
      marginTop: "4px"
    },
    errorAlert: {
      backgroundColor: "#fee2e2",
      color: "#dc2626",
      padding: isMobile ? "10px" : "12px",
      borderRadius: "10px",
      marginBottom: "20px",
      fontSize: isMobile ? "13px" : "14px",
      textAlign: "center",
      borderLeft: "4px solid #dc2626"
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: isMobile ? "16px" : "20px"
    },
    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    },
    label: {
      fontSize: isMobile ? "13px" : "14px",
      fontWeight: "600",
      color: "#333",
      display: "flex",
      alignItems: "center",
      gap: "6px"
    },
    inputWrapper: {
      position: "relative",
      width: "100%"
    },
    input: {
      width: "100%",
      padding: isMobile ? "12px 14px" : "12px 16px",
      paddingRight: "45px",
      fontSize: isMobile ? "15px" : "16px",
      border: "2px solid #e0e0e0",
      borderRadius: "10px",
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
      backgroundColor: "#1a5f7a",
      color: "white",
      padding: isMobile ? "14px" : "14px",
      fontSize: isMobile ? "15px" : "16px",
      fontWeight: "600",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      marginTop: "8px",
      width: "100%",
      transition: "background-color 0.3s"
    },
    buttonDisabled: {
      backgroundColor: "#9ca3af",
      color: "white",
      padding: isMobile ? "14px" : "14px",
      fontSize: isMobile ? "15px" : "16px",
      fontWeight: "600",
      border: "none",
      borderRadius: "10px",
      cursor: "not-allowed",
      marginTop: "8px",
      width: "100%"
    },
    links: {
      textAlign: "center",
      marginTop: isMobile ? "16px" : "20px"
    },
    link: {
      color: "#1a5f7a",
      textDecoration: "none",
      fontSize: isMobile ? "13px" : "14px",
      cursor: "pointer"
    },
    securityNotice: {
      marginTop: isMobile ? "24px" : "30px",
      paddingTop: isMobile ? "16px" : "20px",
      borderTop: "1px solid #eee",
      textAlign: "center"
    },
    securityText: {
      fontSize: isMobile ? "10px" : "11px",
      color: "#888",
      margin: "4px 0"
    },
    features: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: isMobile ? "8px" : "12px",
      marginTop: "12px"
    },
    featureBadge: {
      fontSize: isMobile ? "9px" : "10px",
      backgroundColor: "#f0f4f8",
      padding: "4px 8px",
      borderRadius: "20px",
      color: "#1a5f7a"
    }
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          input:focus {
            border-color: #1a5f7a !important;
            box-shadow: 0 0 0 3px rgba(26,95,122,0.1);
          }
          button:hover:not(:disabled) {
            background-color: #0e4a60 !important;
          }
        `}
      </style>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>🔐</div>
          <h2 style={styles.title}>Confidential Government Document System</h2>
          <p style={styles.subtitle}>Secure Document Sharing Portal</p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>📧 Email Address</label>
            <input
              type="email"
              placeholder="your.email@gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={loading}
              autoComplete="email"
              onFocus={(e) => e.target.style.borderColor = "#1a5f7a"}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>🔒 Password</label>
            <div style={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                disabled={loading}
                autoComplete="current-password"
                onFocus={(e) => e.target.style.borderColor = "#1a5f7a"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
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

          <button 
            type="submit" 
            style={loading ? styles.buttonDisabled : styles.button}
            disabled={loading}
          >
            {loading ? "⏳ Authenticating..." : "🚪 Login to System"}
          </button>

          <div style={styles.links}>
            <Link to="/forgot-password" style={styles.link}>
              Forgot Password?
            </Link>
          </div>
        </form>

        <div style={styles.securityNotice}>
          <p style={styles.securityText}>🔐 AES-256-GCM Encrypted | 📝 Activity Logged | 🛡️ Tamper Detection</p>
          <div style={styles.features}>
            <span style={styles.featureBadge}>Role-Based Access</span>
            <span style={styles.featureBadge}>Audit Logs</span>
            <span style={styles.featureBadge}>Suspicious Detection</span>
            <span style={styles.featureBadge}>AES-256 Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;