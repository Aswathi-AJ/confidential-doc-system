// client/src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import PDFViewer from "../components/PDFViewer";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { 
  FaLock, 
  FaShieldAlt, 
  FaUpload, 
  FaEye, 
  FaHistory, 
  FaSignOutAlt,
  FaFileAlt,
  FaUserShield,
  FaUserTie,
  FaUser,
  FaArrowRight,
  FaCalendarAlt,
  FaTrash,
  FaKey,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle
} from "react-icons/fa";
import { RiGovernmentFill } from "react-icons/ri";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0 });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/documents/list");
      setDocuments(res.data || []);
      setStats({ total: res.data?.length || 0 });
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    else navigate("/login");

    fetchDocuments();

    return () => window.removeEventListener("resize", handleResize);
  }, [fetchDocuments, navigate]);

  // Password strength checker
  useEffect(() => {
    setPasswordStrength({
      length: passwordData.newPassword.length >= 8,
      uppercase: /[A-Z]/.test(passwordData.newPassword),
      lowercase: /[a-z]/.test(passwordData.newPassword),
      number: /[0-9]/.test(passwordData.newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)
    });
  }, [passwordData.newPassword]);

  const validateNewPassword = () => {
    if (passwordData.newPassword.length < 8) {
      setToast({ message: "Password must be at least 8 characters", type: "error" });
      return false;
    }
    if (!/[A-Z]/.test(passwordData.newPassword)) {
      setToast({ message: "Password must contain at least one uppercase letter", type: "error" });
      return false;
    }
    if (!/[a-z]/.test(passwordData.newPassword)) {
      setToast({ message: "Password must contain at least one lowercase letter", type: "error" });
      return false;
    }
    if (!/[0-9]/.test(passwordData.newPassword)) {
      setToast({ message: "Password must contain at least one number", type: "error" });
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)) {
      setToast({ message: "Password must contain at least one special character", type: "error" });
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({ message: "New passwords do not match", type: "error" });
      return;
    }
    
    if (!validateNewPassword()) {
      return;
    }
    
    try {
      const response = await API.post("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setToast({ message: response.data.message || "Password changed successfully!", type: "success" });
      setShowChangePassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to change password", type: "error" });
    }
  };

  const handleDelete = async (docId, docName) => {
    setConfirmDelete({
      id: docId,
      name: docName,
      onConfirm: async () => {
        setConfirmDelete(null);
        try {
          await API.delete(`/documents/${docId}`);
          fetchDocuments();
          setToast({ message: `"${docName}" deleted successfully`, type: "success" });
        } catch (err) {
          setToast({ message: err.response?.data?.message || "Delete failed", type: "error" });
        }
      }
    });
  };

  const handleOpenViewer = (doc) => {
    setViewerDoc(doc);
    setShowViewer(true);
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

  const role = user?.role;
  const isAdmin = role === "admin";

  const getUserName = () => user?.name || user?.email?.split('@')[0] || "User";

  const roleDisplay = {
    admin: { name: "Administrator", icon: <FaUserShield size={11} />, color: "#f87171", bg: "rgba(248,113,113,0.15)" },
    officer: { name: "Government Officer", icon: <FaUserTie size={11} />, color: "#34d399", bg: "rgba(52,211,153,0.12)" },
    viewer: { name: "Viewer", icon: <FaUser size={11} />, color: "#a5b4fc", bg: "rgba(165,180,252,0.12)" }
  }[role] || { name: "User", icon: <FaUser size={11} />, color: "#a5b4fc", bg: "rgba(165,180,252,0.1)" };

  const styles = {
    container: {
      minHeight: "100vh",
      background: "#0a0a14",
      color: "#f0f9ff",
      fontFamily: "'Inter', system-ui, sans-serif",
      position: "relative",
    },

    backgroundLayer: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `
        radial-gradient(circle at 30% 25%, rgba(103, 232, 249, 0.12) 0%, transparent 55%),
        radial-gradient(circle at 70% 75%, rgba(167, 139, 250, 0.10) 0%, transparent 55%)
      `,
      zIndex: 0,
    },

    holographicGrid: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `
        linear-gradient(rgba(103,232,249,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(103,232,249,0.04) 1px, transparent 1px)
      `,
      backgroundSize: "40px 40px",
      animation: "holoScan 15s linear infinite",
      pointerEvents: "none",
      zIndex: 0,
    },

    header: {
      position: "relative",
      zIndex: 10,
      background: "rgba(15, 15, 35, 0.96)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(167, 139, 250, 0.25)",
      padding: isMobile ? "12px 16px" : "14px 32px",
      top: 0,
    },

    headerContent: {
      maxWidth: "1280px",
      margin: "0 auto",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "12px",
    },

    logoSection: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },

    logo: {
      fontSize: isMobile ? "16px" : "20px",
      fontWeight: "800",
      background: "linear-gradient(90deg, #67e8f9, #c4b5fd)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },

    logoTag: {
      fontSize: "9px",
      color: "#a5b4fc",
      letterSpacing: "0.3px",
    },

    userSection: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    },

    userInfo: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },

    roleBadge: {
      padding: "4px 12px",
      borderRadius: "30px",
      fontSize: "10px",
      fontWeight: "600",
      background: roleDisplay.bg,
      color: roleDisplay.color,
      border: `1px solid ${roleDisplay.color}40`,
      display: "flex",
      alignItems: "center",
      gap: "5px",
    },

    headerBtn: {
      padding: "6px 14px",
      borderRadius: "10px",
      fontSize: "11px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.25s ease",
      border: "none",
      display: "flex",
      alignItems: "center",
      gap: "5px",
    },

    adminBtn: {
      background: "linear-gradient(90deg, #7c3aed, #a855f7)",
      color: "white",
    },

    changePasswordBtn: {
      background: "rgba(103, 232, 249, 0.15)",
      color: "#67e8f9",
      border: "1px solid rgba(103, 232, 249, 0.4)",
    },

    logoutBtn: {
      background: "rgba(248, 113, 113, 0.15)",
      color: "#fda4af",
      border: "1px solid rgba(248, 113, 113, 0.4)",
    },

    main: {
      position: "relative",
      zIndex: 1,
      maxWidth: "1280px",
      margin: "0 auto",
      padding: isMobile ? "20px 16px" : "30px 32px",
    },

    welcomeTitle: {
      fontSize: isMobile ? "24px" : "28px",
      fontWeight: "700",
      color: "#f0f9ff",
      marginBottom: "6px",
      textShadow: "0 0 15px rgba(103, 232, 249, 0.3)",
    },

    welcomeSubtitle: {
      fontSize: "12px",
      color: "#a5b4fc",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },

    statsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
      gap: "16px",
      marginBottom: "30px",
    },

    statCard: {
      background: "rgba(15, 15, 35, 0.85)",
      border: "1px solid rgba(167, 139, 250, 0.25)",
      borderRadius: "16px",
      padding: "16px 12px",
      textAlign: "center",
      boxShadow: "0 0 20px rgba(103, 232, 249, 0.05)",
    },

    statIcon: {
      fontSize: "28px",
      marginBottom: "8px",
      color: "#67e8f9",
    },

    statNumber: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#67e8f9",
      marginBottom: "4px",
    },

    statLabel: {
      fontSize: "11px",
      color: "#c4b5fd",
      fontWeight: "500",
    },

    actionsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "20px",
      marginBottom: "35px",
    },

    actionCard: {
      background: "rgba(15, 15, 35, 0.90)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(167, 139, 250, 0.3)",
      borderRadius: "16px",
      padding: "20px 20px",
      textAlign: "center",
      transition: "all 0.3s ease",
      cursor: "pointer",
      boxShadow: "0 0 20px rgba(103, 232, 249, 0.05)",
    },

    actionIcon: {
      fontSize: "36px",
      marginBottom: "12px",
      color: "#67e8f9",
    },

    actionTitle: {
      fontSize: "16px",
      fontWeight: "700",
      color: "#f0f9ff",
      marginBottom: "6px",
    },

    actionDesc: {
      fontSize: "11px",
      color: "#a5b4fc",
      marginBottom: "16px",
      lineHeight: "1.4",
    },

    actionBtn: {
      background: "linear-gradient(90deg, #7c3aed, #22d3ee)",
      color: "#0a0a14",
      padding: "8px 16px",
      borderRadius: "10px",
      fontWeight: "600",
      fontSize: "12px",
      border: "none",
      width: "100%",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      boxShadow: "0 4px 12px rgba(103, 232, 249, 0.2)",
    },

    recentSection: {
      background: "rgba(15, 15, 35, 0.90)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(167, 139, 250, 0.25)",
      borderRadius: "16px",
      padding: isMobile ? "16px" : "20px",
      boxShadow: "0 0 20px rgba(103, 232, 249, 0.05)",
    },

    sectionTitle: {
      fontSize: "16px",
      fontWeight: "700",
      color: "#f0f9ff",
      marginBottom: "16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },

    viewAllLink: {
      color: "#67e8f9",
      cursor: "pointer",
      fontSize: "11px",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },

    documentList: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },

    documentItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 14px",
      background: "rgba(30, 30, 60, 0.6)",
      borderRadius: "12px",
      border: "1px solid rgba(167, 139, 250, 0.2)",
      flexWrap: isMobile ? "wrap" : "nowrap",
      gap: isMobile ? "10px" : "0",
    },

    documentInfo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flex: 1,
      minWidth: isMobile ? "100%" : "auto",
    },

    documentName: {
      fontSize: "12px",
      fontWeight: "500",
      color: "#e0f2fe",
    },

    documentDate: {
      fontSize: "10px",
      color: "#94a3b8",
    },

    buttonGroup: {
      display: "flex",
      gap: "6px",
      alignItems: "center",
    },

    viewBtn: {
      background: "rgba(103, 232, 249, 0.15)",
      color: "#67e8f9",
      border: "1px solid rgba(103, 232, 249, 0.4)",
      padding: "5px 12px",
      borderRadius: "8px",
      fontSize: "10px",
      fontWeight: "500",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "5px",
      transition: "all 0.2s ease",
    },

    deleteBtn: {
      background: "rgba(248, 113, 113, 0.15)",
      color: "#fda4af",
      border: "1px solid rgba(248, 113, 113, 0.4)",
      padding: "5px 12px",
      borderRadius: "8px",
      fontSize: "10px",
      fontWeight: "500",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "5px",
      transition: "all 0.2s ease",
    },

    emptyState: {
      textAlign: "center",
      padding: "40px 20px",
      color: "#94a3b8",
    },

    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(10, 10, 20, 0.88)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    },

    confirmModal: {
      background: "rgba(15, 15, 35, 0.98)",
      border: "1px solid rgba(167, 139, 250, 0.4)",
      borderRadius: "16px",
      padding: "24px",
      width: "90%",
      maxWidth: "360px",
      textAlign: "center",
    },

    changePasswordModal: {
      background: "rgba(15, 15, 35, 0.98)",
      border: "1px solid rgba(167, 139, 250, 0.4)",
      borderRadius: "20px",
      padding: "28px",
      width: "90%",
      maxWidth: "480px",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    },

    loadingState: {
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#67e8f9",
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.backgroundLayer} />
        <div style={styles.holographicGrid} />
        <div style={styles.loadingState}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px", animation: "spin 1s linear infinite" }}>⏳</div>
            <p style={{ fontSize: "13px" }}>Loading dashboard...</p>
          </div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {confirmDelete && (
        <ConfirmModal
          title="Delete Document"
          message={`Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.`}
          onConfirm={confirmDelete.onConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      
      {showViewer && viewerDoc && (
        <PDFViewer 
          docId={viewerDoc.id}
          filename={viewerDoc.filename}
          onClose={() => setShowViewer(false)}
        />
      )}

      <div style={styles.container}>
        <div style={styles.backgroundLayer} />
        <div style={styles.holographicGrid} />

        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.logoSection}>
              <RiGovernmentFill size={20} color="#67e8f9" />
              <div>
                <div style={styles.logo}>Confidential Document System</div>
                <div style={styles.logoTag}>Government of India | Secure Portal</div>
              </div>
            </div>

            <div style={styles.userSection}>
              <div style={styles.userInfo}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600" }}>{getUserName()}</div>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>{user?.email}</div>
                </div>
                <div style={styles.roleBadge}>
                  {roleDisplay.icon} {roleDisplay.name}
                </div>
              </div>

              {isAdmin && (
                <button 
                  style={{ ...styles.headerBtn, ...styles.adminBtn }}
                  onClick={() => navigate("/admin")}
                >
                  Admin Panel
                </button>
              )}

              <button 
                style={{ ...styles.headerBtn, ...styles.changePasswordBtn }}
                onClick={() => setShowChangePassword(true)}
              >
                <FaKey size={11} /> Change Password
              </button>

              <button 
                style={{ ...styles.headerBtn, ...styles.logoutBtn }}
                onClick={() => setShowLogoutConfirm(true)}
              >
                <FaSignOutAlt size={11} /> Logout
              </button>
            </div>
          </div>
        </header>

        <main style={styles.main}>
          <div style={{ marginBottom: "30px" }}>
            <h1 style={styles.welcomeTitle}>Welcome back, {getUserName()}!</h1>
            <p style={styles.welcomeSubtitle}>
              <FaCalendarAlt size={11} /> {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })}
            </p>
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <FaFileAlt style={styles.statIcon} />
              <div style={styles.statNumber}>{stats.total}</div>
              <div style={styles.statLabel}>Total Documents</div>
            </div>
            <div style={styles.statCard}>
              <FaLock style={styles.statIcon} />
              <div style={styles.statNumber}>AES-256</div>
              <div style={styles.statLabel}>Encryption</div>
            </div>
            <div style={styles.statCard}>
              <FaShieldAlt style={styles.statIcon} />
              <div style={styles.statNumber}>GCM</div>
              <div style={styles.statLabel}>Tamper Proof</div>
            </div>
          </div>

          <div style={styles.actionsGrid}>
            {(role === "admin" || role === "officer") && (
              <div 
                style={styles.actionCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#67e8f9";
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(103, 232, 249, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.3)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(103, 232, 249, 0.05)";
                }}
              >
                <FaUpload style={styles.actionIcon} />
                <div style={styles.actionTitle}>Upload Document</div>
                <div style={styles.actionDesc}>Upload encrypted documents securely</div>
                <button 
                  style={styles.actionBtn}
                  onClick={() => navigate("/upload")}
                >
                  Upload Now <FaArrowRight size={11} />
                </button>
              </div>
            )}

            <div 
              style={styles.actionCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#67e8f9";
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(103, 232, 249, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.3)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(103, 232, 249, 0.05)";
              }}
            >
              <FaEye style={styles.actionIcon} />
              <div style={styles.actionTitle}>View Documents</div>
              <div style={styles.actionDesc}>Browse and view all documents</div>
              <button 
                style={styles.actionBtn}
                onClick={() => navigate("/documents")}
              >
                View All <FaArrowRight size={11} />
              </button>
            </div>

            {isAdmin && (
              <div 
                style={styles.actionCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#67e8f9";
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(103, 232, 249, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.3)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(103, 232, 249, 0.05)";
                }}
              >
                <FaHistory style={styles.actionIcon} />
                <div style={styles.actionTitle}>Activity Logs</div>
                <div style={styles.actionDesc}>Monitor system activity and security alerts</div>
                <button 
                  style={styles.actionBtn}
                  onClick={() => navigate("/logs")}
                >
                  View Logs <FaArrowRight size={11} />
                </button>
              </div>
            )}
          </div>

          <div style={styles.recentSection}>
            <div style={styles.sectionTitle}>
              <span>Recent Documents</span>
              <span 
                style={styles.viewAllLink}
                onClick={() => navigate("/documents")}
              >
                View all →
              </span>
            </div>

            {documents.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: "40px", marginBottom: "12px", opacity: 0.6 }}>📂</div>
                <p style={{ fontSize: "12px" }}>No documents uploaded yet</p>
                {(role === "admin" || role === "officer") && (
                  <button 
                    style={{ ...styles.actionBtn, marginTop: "16px", width: "auto", padding: "8px 20px" }}
                    onClick={() => navigate("/upload")}
                  >
                    Upload your first document
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.documentList}>
                {documents.slice(0, 5).map((doc) => (
                  <div key={doc.id} style={styles.documentItem}>
                    <div style={styles.documentInfo}>
                      <FaFileAlt size={16} color="#67e8f9" />
                      <div>
                        <div style={styles.documentName}>{doc.filename}</div>
                        <div style={styles.documentDate}>
                          {new Date(doc.created_at).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div style={styles.buttonGroup}>
                      <button 
                        style={styles.viewBtn}
                        onClick={() => handleOpenViewer(doc)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(103, 232, 249, 0.25)";
                          e.currentTarget.style.transform = "scale(1.02)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(103, 232, 249, 0.15)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <FaEye size={9} /> View
                      </button>
                      {isAdmin && (
                        <button 
                          style={styles.deleteBtn}
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(248, 113, 113, 0.25)";
                            e.currentTarget.style.transform = "scale(1.02)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(248, 113, 113, 0.15)";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          <FaTrash size={9} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {showLogoutConfirm && (
          <div style={styles.modalOverlay} onClick={() => setShowLogoutConfirm(false)}>
            <div style={styles.confirmModal} onClick={e => e.stopPropagation()}>
              <FaSignOutAlt size={36} color="#fda4af" style={{ marginBottom: "14px" }} />
              <h2 style={{ color: "#f0f9ff", marginBottom: "6px", fontSize: "18px" }}>Confirm Logout</h2>
              <p style={{ color: "#a5b4fc", marginBottom: "20px", fontSize: "12px" }}>
                Are you sure you want to logout?
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button 
                  style={{ 
                    padding: "8px 24px", 
                    borderRadius: "8px", 
                    background: "rgba(148, 163, 184, 0.2)", 
                    color: "#e0f2fe",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "12px"
                  }}
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </button>
                <button 
                  style={{ 
                    padding: "8px 24px", 
                    borderRadius: "8px", 
                    background: "#f87171", 
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "12px"
                  }}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {showChangePassword && (
          <div style={styles.modalOverlay} onClick={() => setShowChangePassword(false)}>
            <div style={styles.changePasswordModal} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid rgba(167, 139, 250, 0.2)", paddingBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FaKey size={20} color="#67e8f9" />
                  <h3 style={{ color: "#f0f9ff", fontSize: "18px", margin: 0, fontWeight: "600" }}>Change Password</h3>
                </div>
                <button 
                  onClick={() => setShowChangePassword(false)} 
                  style={{ 
                    background: "rgba(148, 163, 184, 0.2)", 
                    border: "none", 
                    color: "#9ca3af", 
                    cursor: "pointer",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(248, 113, 113, 0.2)";
                    e.currentTarget.style.color = "#fca5a5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(148, 163, 184, 0.2)";
                    e.currentTarget.style.color = "#9ca3af";
                  }}
                >
                  <FaTimes size={14} />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ color: "#c4b5fd", display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: "500" }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    placeholder="Enter your current password"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "rgba(15,15,35,0.85)",
                      border: "1.5px solid rgba(129,140,248,0.35)",
                      borderRadius: "10px",
                      color: "#f0f9ff",
                      fontSize: "13px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#67e8f9";
                      e.target.style.boxShadow = "0 0 0 3px rgba(103, 232, 249, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(129,140,248,0.35)";
                      e.target.style.boxShadow = "none";
                    }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ color: "#c4b5fd", display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: "500" }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    placeholder="Minimum 8 characters with uppercase, lowercase, number & special character"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "rgba(15,15,35,0.85)",
                      border: "1.5px solid rgba(129,140,248,0.35)",
                      borderRadius: "10px",
                      color: "#f0f9ff",
                      fontSize: "13px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#67e8f9";
                      e.target.style.boxShadow = "0 0 0 3px rgba(103, 232, 249, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(129,140,248,0.35)";
                      e.target.style.boxShadow = "none";
                    }}
                    required
                  />
                  
                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div style={{ 
                      marginTop: "12px", 
                      padding: "12px", 
                      background: "rgba(15,15,35,0.6)", 
                      borderRadius: "10px",
                      border: "1px solid rgba(167, 139, 250, 0.15)"
                    }}>
                      <div style={{ marginBottom: "10px" }}>
                        <div style={{ 
                          height: "6px", 
                          background: "#2a2a4a", 
                          borderRadius: "3px", 
                          overflow: "hidden" 
                        }}>
                          <div style={{ 
                            width: `${(Object.values(passwordStrength).filter(v => v === true).length / 5) * 100}%`,
                            height: "100%",
                            background: getStrengthColor(),
                            transition: "width 0.3s ease",
                            borderRadius: "3px"
                          }} />
                        </div>
                        <div style={{ 
                          fontSize: "11px", 
                          color: getStrengthColor(), 
                          textAlign: "right", 
                          marginTop: "6px",
                          fontWeight: "500"
                        }}>
                          Password Strength: {getStrengthText()}
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", 
                        gap: "8px",
                        marginTop: "8px"
                      }}>
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "6px",
                          fontSize: "10px",
                          color: passwordStrength.length ? "#10b981" : "#94a3b8"
                        }}>
                          {passwordStrength.length ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                          <span>At least 8 characters</span>
                        </div>
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "6px",
                          fontSize: "10px",
                          color: passwordStrength.uppercase ? "#10b981" : "#94a3b8"
                        }}>
                          {passwordStrength.uppercase ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                          <span>One uppercase letter</span>
                        </div>
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "6px",
                          fontSize: "10px",
                          color: passwordStrength.lowercase ? "#10b981" : "#94a3b8"
                        }}>
                          {passwordStrength.lowercase ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                          <span>One lowercase letter</span>
                        </div>
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "6px",
                          fontSize: "10px",
                          color: passwordStrength.number ? "#10b981" : "#94a3b8"
                        }}>
                          {passwordStrength.number ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                          <span>One number</span>
                        </div>
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "6px",
                          fontSize: "10px",
                          color: passwordStrength.special ? "#10b981" : "#94a3b8"
                        }}>
                          {passwordStrength.special ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                          <span>One special character (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={{ marginBottom: "28px" }}>
                  <label style={{ color: "#c4b5fd", display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: "500" }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    placeholder="Re-enter your new password"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "rgba(15,15,35,0.85)",
                      border: "1.5px solid rgba(129,140,248,0.35)",
                      borderRadius: "10px",
                      color: "#f0f9ff",
                      fontSize: "13px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#67e8f9";
                      e.target.style.boxShadow = "0 0 0 3px rgba(103, 232, 249, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(129,140,248,0.35)";
                      e.target.style.boxShadow = "none";
                    }}
                    required
                  />
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <div style={{ 
                      marginTop: "8px", 
                      fontSize: "10px", 
                      color: "#f87171",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px"
                    }}>
                      <FaTimesCircle size={10} /> Passwords do not match
                    </div>
                  )}
                </div>
                
                <div style={{ 
                  display: "flex", 
                  gap: "12px", 
                  justifyContent: "flex-end",
                  borderTop: "1px solid rgba(167, 139, 250, 0.2)",
                  paddingTop: "20px",
                  marginTop: "8px"
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    }}
                    style={{
                      padding: "10px 24px",
                      background: "rgba(148,163,184,0.15)",
                      color: "#e0f2fe",
                      border: "1px solid rgba(148,163,184,0.3)",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "500",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(148,163,184,0.25)";
                      e.currentTarget.style.borderColor = "rgba(148,163,184,0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(148,163,184,0.15)";
                      e.currentTarget.style.borderColor = "rgba(148,163,184,0.3)";
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 28px",
                      background: "linear-gradient(90deg, #7c3aed, #22d3ee)",
                      color: "#0a0a14",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "12px",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 8px rgba(103, 232, 249, 0.3)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(103, 232, 249, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(103, 232, 249, 0.3)";
                    }}
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes holoScan {
            0% { background-position: 0 0; }
            100% { background-position: 80px 80px; }
          }
        `}</style>
      </div>
    </>
  );
}

export default Dashboard;