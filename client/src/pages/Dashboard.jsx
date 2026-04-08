import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, myDocs: 0 });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/documents/list");
      setDocuments(res.data);
      
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const myDocsCount = res.data.filter(doc => doc.uploaded_by === userData.id).length;
      
      setStats({
        total: res.data.length,
        myDocs: myDocsCount
      });
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate("/login");
    }
    
    fetchDocuments();
    
    return () => window.removeEventListener("resize", handleResize);
  }, [fetchDocuments, navigate]);

  // Download function
  const handleDownload = async (docId, filename) => {
    try {
      const token = localStorage.getItem("token");
      window.open(`http://localhost:5000/api/documents/download/${docId}?token=${token}`, '_blank');
    } catch (err) {
      console.error("Download error:", err);
      alert("Download failed. Please try again.");
    }
  };

  // Delete function
  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await API.delete(`/documents/${docId}`);
      fetchDocuments();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const role = user?.role;
  
  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return "User";
  };

  const roleDisplay = {
    admin: { name: "Administrator", icon: "👑", color: "#dc2626", bg: "#fee2e2" },
    officer: { name: "Government Officer", icon: "📋", color: "#16a34a", bg: "#dcfce7" },
    viewer: { name: "Viewer", icon: "👁️", color: "#6b7280", bg: "#f3f4f6" }
  }[role] || { name: "User", icon: "👤", color: "#6b7280", bg: "#f3f4f6" };

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      fontFamily: "'Segoe UI', Roboto, sans-serif"
    },
    header: {
      backgroundColor: "#1a3c34",
      color: "white",
      padding: isMobile ? "16px" : "20px 32px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    },
    headerContent: {
      maxWidth: "1200px",
      margin: "0 auto",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "16px"
    },
    logo: {
      fontSize: isMobile ? "20px" : "24px",
      fontWeight: "700"
    },
    logoSmall: {
      fontSize: isMobile ? "12px" : "14px",
      opacity: 0.8,
      marginTop: "4px"
    },
    userInfo: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      flexWrap: "wrap"
    },
    userEmail: {
      fontSize: isMobile ? "13px" : "14px"
    },
    roleBadge: {
      padding: "6px 14px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      backgroundColor: roleDisplay.bg,
      color: roleDisplay.color,
      display: "inline-flex",
      alignItems: "center",
      gap: "6px"
    },
    adminPanelBtn: {
      backgroundColor: "#f59e0b",
      border: "none",
      padding: "8px 16px",
      borderRadius: "8px",
      color: "white",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      transition: "all 0.3s"
    },
    logoutBtn: {
      backgroundColor: "rgba(255,255,255,0.2)",
      border: "none",
      padding: "8px 16px",
      borderRadius: "8px",
      color: "white",
      cursor: "pointer",
      fontSize: "14px",
      transition: "all 0.3s"
    },
    main: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: isMobile ? "20px 16px" : "32px 24px"
    },
    welcomeSection: {
      marginBottom: "32px"
    },
    welcomeTitle: {
      fontSize: isMobile ? "24px" : "32px",
      fontWeight: "700",
      color: "#1a3c34",
      marginBottom: "8px"
    },
    welcomeSubtitle: {
      fontSize: isMobile ? "14px" : "16px",
      color: "#4b5563"
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
      gap: "16px",
      marginBottom: "32px"
    },
    statCard: {
      backgroundColor: "white",
      padding: isMobile ? "20px" : "24px",
      borderRadius: "16px",
      textAlign: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      transition: "transform 0.3s, box-shadow 0.3s",
      cursor: "pointer"
    },
    statIcon: {
      fontSize: isMobile ? "28px" : "32px",
      marginBottom: "12px"
    },
    statNumber: {
      fontSize: isMobile ? "28px" : "36px",
      fontWeight: "700",
      color: "#1a5f7a",
      marginBottom: "4px"
    },
    statLabel: {
      fontSize: isMobile ? "13px" : "14px",
      color: "#6b7280"
    },
    actionsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "20px",
      marginBottom: "32px"
    },
    actionCard: {
      backgroundColor: "white",
      padding: isMobile ? "24px" : "28px",
      borderRadius: "16px",
      textAlign: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      transition: "all 0.3s",
      cursor: "pointer"
    },
    actionIcon: {
      fontSize: isMobile ? "40px" : "48px",
      marginBottom: "16px"
    },
    actionTitle: {
      fontSize: isMobile ? "18px" : "20px",
      fontWeight: "600",
      color: "#1f2937",
      marginBottom: "8px"
    },
    actionDesc: {
      fontSize: isMobile ? "12px" : "14px",
      color: "#6b7280",
      marginBottom: "16px"
    },
    actionBtn: {
      backgroundColor: "#1a5f7a",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background 0.3s"
    },
    recentSection: {
      backgroundColor: "white",
      borderRadius: "16px",
      padding: isMobile ? "20px" : "24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    },
    sectionTitle: {
      fontSize: isMobile ? "18px" : "20px",
      fontWeight: "600",
      color: "#1f2937",
      marginBottom: "16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    viewAllLink: {
      fontSize: "14px",
      color: "#1a5f7a",
      cursor: "pointer",
      textDecoration: "none"
    },
    documentList: {
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    },
    documentItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px",
      backgroundColor: "#f9fafb",
      borderRadius: "10px",
      transition: "background 0.3s"
    },
    documentInfo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flex: 1
    },
    documentIcon: {
      fontSize: "24px"
    },
    documentName: {
      fontSize: isMobile ? "13px" : "14px",
      fontWeight: "500",
      color: "#374151"
    },
    documentDate: {
      fontSize: "11px",
      color: "#9ca3af",
      marginTop: "2px"
    },
    downloadIcon: {
      backgroundColor: "#22c55e",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      fontSize: "12px",
      cursor: "pointer"
    },
    loadingState: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#6b7280"
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    },
    confirmModal: {
      backgroundColor: "white",
      borderRadius: "16px",
      padding: "24px",
      width: "90%",
      maxWidth: "400px",
      textAlign: "center"
    },
    confirmButtons: {
      display: "flex",
      gap: "12px",
      marginTop: "20px",
      justifyContent: "center"
    },
    confirmBtn: {
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontSize: "14px"
    },
    emptyState: {
      textAlign: "center",
      padding: "40px",
      backgroundColor: "white",
      borderRadius: "16px",
      color: "#6b7280"
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.logo}>Confidential Document System</div>
            <div style={styles.logoSmall}>Government of India | Secure Portal</div>
          </div>
          <div style={styles.userInfo}>
            <span style={styles.userEmail}>{user?.email}</span>
            <span style={styles.roleBadge}>
              {roleDisplay.icon} {roleDisplay.name}
            </span>
            
            {/* ONLY ONE ADMIN PANEL BUTTON - In Header */}
            {role === "admin" && (
              <button 
                style={styles.adminPanelBtn}
                onMouseEnter={e => e.target.style.backgroundColor = "#d97706"}
                onMouseLeave={e => e.target.style.backgroundColor = "#f59e0b"}
                onClick={() => navigate("/admin")}
              >
                Admin Panel
              </button>
            )}
            
            <button 
              style={styles.logoutBtn}
              onMouseEnter={e => e.target.style.backgroundColor = "rgba(255,255,255,0.3)"}
              onMouseLeave={e => e.target.style.backgroundColor = "rgba(255,255,255,0.2)"}
              onClick={() => setShowLogoutConfirm(true)}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>
            Welcome back, {getUserName()}!
          </h1>
          <p style={styles.welcomeSubtitle}>
            {new Date().toLocaleDateString('en-IN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📄</div>
            <div style={styles.statNumber}>{stats.total}</div>
            <div style={styles.statLabel}>Total Documents</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👤</div>
            <div style={styles.statNumber}>{stats.myDocs}</div>
            <div style={styles.statLabel}>Your Documents</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🔐</div>
            <div style={styles.statNumber}>AES-256</div>
            <div style={styles.statLabel}>Encryption</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🛡️</div>
            <div style={styles.statNumber}>GCM</div>
            <div style={styles.statLabel}>Tamper Proof</div>
          </div>
        </div>

        <div style={styles.actionsGrid}>
          {(role === "admin" || role === "officer") && (
            <div 
              style={styles.actionCard}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
              }}
            >
              <div style={styles.actionIcon}>📤</div>
              <h3 style={styles.actionTitle}>Upload Document</h3>
              <p style={styles.actionDesc}>Upload encrypted PDF documents securely</p>
              <button 
                style={styles.actionBtn}
                onClick={() => navigate("/upload")}
                onMouseEnter={e => e.target.style.backgroundColor = "#0e4a60"}
                onMouseLeave={e => e.target.style.backgroundColor = "#1a5f7a"}
              >
                Upload Now →
              </button>
            </div>
          )}

          <div 
            style={styles.actionCard}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            }}
          >
            <div style={styles.actionIcon}>📚</div>
            <h3 style={styles.actionTitle}>View Documents</h3>
            <p style={styles.actionDesc}>Browse and download all your documents</p>
            <button 
              style={styles.actionBtn}
              onClick={() => navigate("/documents")}
              onMouseEnter={e => e.target.style.backgroundColor = "#0e4a60"}
              onMouseLeave={e => e.target.style.backgroundColor = "#1a5f7a"}
            >
              View All →
            </button>
          </div>

          {role === "admin" && (
            <div 
              style={styles.actionCard}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
              }}
            >
              <div style={styles.actionIcon}>📊</div>
              <h3 style={styles.actionTitle}>Activity Logs</h3>
              <p style={styles.actionDesc}>Monitor system activity and security alerts</p>
              <button 
                style={styles.actionBtn}
                onClick={() => navigate("/logs")}
                onMouseEnter={e => e.target.style.backgroundColor = "#0e4a60"}
                onMouseLeave={e => e.target.style.backgroundColor = "#1a5f7a"}
              >
                View Logs →
              </button>
            </div>
          )}
        </div>

        {documents.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📂</div>
            <p>No documents uploaded yet</p>
            {(role === "admin" || role === "officer") && (
              <button 
                style={{...styles.actionBtn, marginTop: "16px", display: "inline-block"}}
                onClick={() => navigate("/upload")}
              >
                Upload your first document
              </button>
            )}
          </div>
        ) : (
          <div style={styles.recentSection}>
            <div style={styles.sectionTitle}>
              <span>📋 Recent Documents</span>
              <span 
                style={styles.viewAllLink}
                onClick={() => navigate("/documents")}
              >
                View all →
              </span>
            </div>
            <div style={styles.documentList}>
              {documents.slice(0, 5).map((doc) => (
                <div key={doc.id} style={styles.documentItem}>
                  <div style={styles.documentInfo}>
                    <span style={styles.documentIcon}>📄</span>
                    <div>
                      <div style={styles.documentName}>{doc.filename}</div>
                      <div style={styles.documentDate}>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      style={styles.downloadIcon}
                      onClick={() => handleDownload(doc.id, doc.filename)}
                    >
                      Download
                    </button>
                    {role === "admin" && (
                      <button 
                        style={{...styles.downloadIcon, backgroundColor: "#ef4444"}}
                        onClick={() => handleDelete(doc.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showLogoutConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowLogoutConfirm(false)}>
          <div style={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚪</div>
            <h3>Confirm Logout</h3>
            <p style={{ color: "#6b7280", marginTop: "8px" }}>
              Are you sure you want to logout?
            </p>
            <div style={styles.confirmButtons}>
              <button 
                style={{...styles.confirmBtn, backgroundColor: "#e5e7eb"}}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                style={{...styles.confirmBtn, backgroundColor: "#dc2626", color: "white"}}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;