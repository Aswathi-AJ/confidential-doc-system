// client/src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
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
  FaTrash
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

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await API.delete(`/documents/${docId}`);
      fetchDocuments();
      alert("Document deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
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
    },

    documentInfo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flex: 1,
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
      marginLeft: "6px",
      display: "flex",
      alignItems: "center",
      gap: "5px",
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

                  <div>
                    <button 
                      style={styles.viewBtn}
                      onClick={() => navigate("/documents")}
                    >
                      <FaEye size={9} /> View
                    </button>
                    {isAdmin && (
                      <button 
                        style={styles.deleteBtn}
                        onClick={() => handleDelete(doc.id)}
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

      <style jsx>{`
        @keyframes holoScan {
          0% { background-position: 0 0; }
          100% { background-position: 80px 80px; }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;