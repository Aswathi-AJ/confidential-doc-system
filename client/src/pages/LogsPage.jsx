// client/src/pages/LogsPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { 

  FaDownload, 

  FaExclamationTriangle,
  FaUpload,
  FaTrash,
  FaSignInAlt,
  FaBan,
  FaBug,
  FaUndo,
  FaFileAlt
} from "react-icons/fa";
import { RiGovernmentFill } from "react-icons/ri";

function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    suspicious: 0
  });

  const navigate = useNavigate();
  const isMobile = windowWidth < 768;

  // Get user and check admin permission
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role !== "admin") {
        alert("Access denied. Admin only.");
        navigate("/dashboard");
      } else {
        setUser(parsed);
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.get("/documents/logs");
      const sortedLogs = response.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setLogs(sortedLogs);

      const total = sortedLogs.length;
      const success = sortedLogs.filter(log => log.status === "SUCCESS").length;
      const failed = sortedLogs.filter(log => log.status === "FAILED").length;
      const suspicious = sortedLogs.filter(log => {
        const actionUpper = (log.action || "").toUpperCase();
        return log.status === "FAILED" || 
               actionUpper.includes("UNAUTHORIZED") || 
               actionUpper.includes("VIOLATION") ||
               actionUpper.includes("TAMPER");
      }).length;

      setStats({ total, success, failed, suspicious });
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto refresh
  useEffect(() => {
    if (user) fetchLogs();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 10000);
    }
    return () => clearInterval(interval);
  }, [user, autoRefresh, fetchLogs]);

  // Filter logs
  useEffect(() => {
    let filtered = [...logs];
    
    if (searchTerm) {
      filtered = filtered.filter(log => 
        (log.action || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_id.toString().includes(searchTerm) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (filterAction !== "all") {
      filtered = filtered.filter(log => log.action === filterAction);
    }
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(log => log.status === filterStatus);
    }
    
    setFilteredLogs(filtered);
  }, [logs, searchTerm, filterAction, filterStatus]);

  // Get action icon component
  const getActionIcon = (action) => {
    const actionUpper = (action || "").toUpperCase();
    if (actionUpper.includes("UPLOAD")) return <FaUpload size={12} />;
    if (actionUpper.includes("DOWNLOAD")) return <FaDownload size={12} />;
    if (actionUpper.includes("DELETE")) return <FaTrash size={12} />;
    if (actionUpper.includes("LOGIN")) return <FaSignInAlt size={12} />;
    if (actionUpper.includes("UNAUTHORIZED")) return <FaBan size={12} />;
    if (actionUpper.includes("TAMPER")) return <FaBug size={12} />;
    if (actionUpper.includes("RECOVERY")) return <FaUndo size={12} />;
    return <FaFileAlt size={12} />;
  };

  const getStatusStyle = (status) => {
    if (status === "SUCCESS") return { color: "#67e8f9", bg: "rgba(103,232,249,0.12)" };
    if (status === "FAILED") return { color: "#fca5a5", bg: "rgba(248,113,113,0.12)" };
    if (status === "WARNING") return { color: "#fcd34d", bg: "rgba(245,158,11,0.12)" };
    return { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
  };

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  const hasSuspiciousActivity = filteredLogs.some(log => {
    const actionUpper = (log.action || "").toUpperCase();
    return log.status === "FAILED" || 
           actionUpper.includes("UNAUTHORIZED") || 
           actionUpper.includes("VIOLATION") ||
           actionUpper.includes("TAMPER");
  });

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
  position: "sticky",
  top: 0,
  zIndex: 100,
  background: "rgba(15, 15, 35, 0.96)",
  backdropFilter: "blur(16px)",
  borderBottom: "1px solid rgba(167, 139, 250, 0.25)",
  padding: isMobile ? "12px 16px" : "14px 32px",
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

    main: {
      position: "relative",
      zIndex: 1,
      maxWidth: "1280px",
      margin: "0 auto",
      padding: isMobile ? "20px 16px" : "30px 32px",
    },

    card: {
      background: "rgba(15, 15, 35, 0.90)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(167, 139, 250, 0.3)",
      borderRadius: "20px",
      padding: isMobile ? "20px" : "24px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
    },

    title: {
      fontSize: isMobile ? "22px" : "24px",
      fontWeight: "700",
      color: "#f0f9ff",
      marginBottom: "6px",
    },

    alertBanner: {
      background: "rgba(248, 113, 113, 0.12)",
      border: "1px solid rgba(248, 113, 113, 0.4)",
      color: "#fca5a5",
      padding: "12px 16px",
      borderRadius: "12px",
      marginBottom: "20px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "12px",
    },

    statsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
      gap: "12px",
      marginBottom: "24px",
    },

    statCard: {
      background: "rgba(30, 30, 60, 0.6)",
      border: "1px solid rgba(167, 139, 250, 0.2)",
      borderRadius: "12px",
      padding: "14px 10px",
      textAlign: "center",
    },

    statNumber: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#67e8f9",
    },

    statLabel: {
      fontSize: "10px",
      color: "#a5b4fc",
      marginTop: "4px",
    },

    filterBar: {
      display: "flex",
      gap: "10px",
      marginBottom: "20px",
      flexWrap: "wrap",
    },

    searchBox: {
      flex: "1",
      minWidth: "200px",
      padding: "8px 14px",
      background: "rgba(15, 15, 35, 0.85)",
      border: "1.5px solid rgba(129, 140, 248, 0.35)",
      borderRadius: "10px",
      color: "#f0f9ff",
      fontSize: "12px",
      outline: "none",
    },

    select: {
      padding: "8px 14px",
      background: "rgba(15, 15, 35, 0.85)",
      border: "1.5px solid rgba(129, 140, 248, 0.35)",
      borderRadius: "10px",
      color: "#f0f9ff",
      fontSize: "12px",
      outline: "none",
    },

    tableWrapper: {
      overflowX: "auto",
      borderRadius: "12px",
      border: "1px solid rgba(167, 139, 250, 0.15)",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
      background: "rgba(15, 15, 35, 0.6)",
      minWidth: "800px",
    },

    th: {
      textAlign: "left",
      padding: "10px 12px",
      background: "rgba(30, 30, 60, 0.8)",
      color: "#c4b5fd",
      fontWeight: "600",
      fontSize: "11px",
      borderBottom: "1px solid rgba(167, 139, 250, 0.15)",
    },

    td: {
      padding: "10px 12px",
      borderBottom: "1px solid rgba(167, 139, 250, 0.1)",
      color: "#e0f2fe",
      fontSize: "12px",
    },

    statusBadge: {
      padding: "3px 10px",
      borderRadius: "16px",
      fontSize: "10px",
      fontWeight: "600",
    },

    suspiciousRow: {
      background: "rgba(248, 113, 113, 0.08)",
      borderLeft: "3px solid #fca5a5",
    },

    tamperRow: {
      background: "rgba(245, 158, 11, 0.08)",
      borderLeft: "3px solid #fcd34d",
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

    modalContent: {
      background: "rgba(15, 15, 35, 0.98)",
      border: "1px solid rgba(167, 139, 250, 0.4)",
      borderRadius: "16px",
      padding: "24px",
      width: "90%",
      maxWidth: "460px",
      color: "#f0f9ff",
    },
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a14", display: "flex", alignItems: "center", justifyContent: "center", color: "#67e8f9" }}>
        Loading...
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
            <RiGovernmentFill size={18} color="#67e8f9" />
            <div>
              <div style={styles.logo}>Confidential Document System</div>
              <div style={{ fontSize: "9px", color: "#a5b4fc" }}>Security Audit Logs</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button 
              onClick={() => navigate("/dashboard")}
              style={{
                background: "rgba(167, 139, 250, 0.12)",
                color: "#c4b5fd",
                border: "1px solid rgba(167, 139, 250, 0.3)",
                padding: "6px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "11px"
              }}
            >
              Dashboard
            </button>

            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                background: autoRefresh ? "#7c3aed" : "rgba(167, 139, 250, 0.12)",
                color: autoRefresh ? "#0a0a14" : "#c4b5fd",
                border: "1px solid rgba(167, 139, 250, 0.3)",
                padding: "6px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: autoRefresh ? "600" : "normal"
              }}
            >
              {autoRefresh ? "Auto Refresh ON" : "Auto Refresh OFF"}
            </button>

            <button 
              onClick={fetchLogs}
              style={{
                background: "linear-gradient(90deg, #7c3aed, #22d3ee)",
                color: "#0a0a14",
                padding: "6px 14px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "11px"
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <h1 style={styles.title}>Security Audit Logs</h1>

          {hasSuspiciousActivity && (
            <div style={styles.alertBanner}>
              <FaExclamationTriangle size={16} />
              <div>
                <strong>Security Alert:</strong> Suspicious activities detected
              </div>
            </div>
          )}

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{stats.total}</div>
              <div style={styles.statLabel}>Total Events</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: "#67e8f9" }}>{stats.success}</div>
              <div style={styles.statLabel}>Successful</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: "#fca5a5" }}>{stats.failed}</div>
              <div style={styles.statLabel}>Failed</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: "#fcd34d" }}>{stats.suspicious}</div>
              <div style={styles.statLabel}>Suspicious</div>
            </div>
          </div>

          <div style={styles.filterBar}>
            <input
              type="text"
              placeholder="Search by user, action or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchBox}
            />
            <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} style={styles.select}>
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.select}>
              <option value="all">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#67e8f9", fontSize: "13px" }}>
              Loading security logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "12px" }}>
              No logs found matching your filters
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>User ID</th>
                    <th style={styles.th}>Action</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Timestamp</th>
                    <th style={styles.th}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => {
                    const statusStyle = getStatusStyle(log.status);
                    const actionUpper = (log.action || "").toUpperCase();
                    const isSuspicious = log.status === "FAILED" || 
                                       actionUpper.includes("UNAUTHORIZED") || 
                                       actionUpper.includes("TAMPER");

                    return (
                      <tr 
                        key={log.id}
                        style={isSuspicious ? (actionUpper.includes("TAMPER") ? styles.tamperRow : styles.suspiciousRow) : {}}
                        onClick={() => {
                          setSelectedLog(log);
                          setShowModal(true);
                        }}
                      >
                        <td style={styles.td}>{index + 1}</td>
                        <td style={styles.td}><strong>#{log.user_id}</strong></td>
                        <td style={styles.td}>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px", color: actionUpper.includes("TAMPER") ? "#fcd34d" : "#67e8f9" }}>
                            {getActionIcon(log.action)} {log.action}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color
                          }}>
                            {log.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td style={styles.td}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                              setShowModal(true);
                            }}
                            style={{
                              background: "rgba(103,232,249,0.12)",
                              color: "#67e8f9",
                              border: "none",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "10px",
                              cursor: "pointer"
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredLogs.length > 0 && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button
                onClick={() => {
                  const csvContent = [
                    ["ID","User ID","Action","Status","Timestamp","Details"],
                    ...filteredLogs.map(log => [
                      log.id,
                      log.user_id,
                      log.action || "",
                      log.status,
                      new Date(log.created_at).toLocaleString(),
                      log.details || ""
                    ])
                  ].map(row => row.join(",")).join("\n");

                  const blob = new Blob([csvContent], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `security-logs-${new Date().toISOString().slice(0,10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  background: "linear-gradient(90deg, #7c3aed, #22d3ee)",
                  color: "#0a0a14",
                  padding: "8px 20px",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "600",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FaDownload size={12} /> Export Logs (CSV)
              </button>
            </div>
          )}
        </div>
      </main>

      {showModal && selectedLog && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: "#f0f9ff", marginBottom: "16px", fontSize: "18px" }}>Log Details</h3>
            
            <div style={{ marginBottom: "12px", fontSize: "13px" }}>
              <strong style={{ color: "#c4b5fd" }}>Log ID:</strong> #{selectedLog.id}
            </div>
            <div style={{ marginBottom: "12px", fontSize: "13px" }}>
              <strong style={{ color: "#c4b5fd" }}>User ID:</strong> {selectedLog.user_id}
            </div>
            <div style={{ marginBottom: "12px", fontSize: "13px" }}>
              <strong style={{ color: "#c4b5fd" }}>Action:</strong> {selectedLog.action}
            </div>
            <div style={{ marginBottom: "12px", fontSize: "13px" }}>
              <strong style={{ color: "#c4b5fd" }}>Status:</strong> 
              <span style={{ color: selectedLog.status === "SUCCESS" ? "#67e8f9" : "#fca5a5" }}>
                {" "}{selectedLog.status}
              </span>
            </div>
            <div style={{ marginBottom: "12px", fontSize: "13px" }}>
              <strong style={{ color: "#c4b5fd" }}>Timestamp:</strong> 
              {new Date(selectedLog.created_at).toLocaleString()}
            </div>
            {selectedLog.details && (
              <div style={{ marginTop: "8px" }}>
                <strong style={{ color: "#c4b5fd" }}>Details:</strong>
                <div style={{ marginTop: "6px", color: "#e0f2fe", background: "rgba(30,30,60,0.6)", padding: "10px", borderRadius: "10px", fontSize: "12px" }}>
                  {selectedLog.details}
                </div>
              </div>
            )}

            <button 
              onClick={() => setShowModal(false)}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "10px",
                background: "rgba(167,139,250,0.15)",
                color: "#c4b5fd",
                border: "1px solid rgba(167,139,250,0.3)",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes holoScan {
          0% { background-position: 0 0; }
          100% { background-position: 80px 80px; }
        }
      `}</style>
    </div>
  );
}

export default LogsPage;