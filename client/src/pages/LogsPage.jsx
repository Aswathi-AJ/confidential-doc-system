// client/src/pages/LogsPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

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

  // ✅ STYLES DEFINED FIRST - BEFORE ANY RETURN STATEMENTS
  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      padding: isMobile ? "16px" : "24px"
    },
    loadingContainer: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      fontFamily: "'Segoe UI', Roboto, sans-serif"
    },
    spinner: {
      fontSize: "48px",
      marginBottom: "16px",
      animation: "spin 1s linear infinite"
    },
    header: {
      backgroundColor: "#1a3c34",
      color: "white",
      padding: isMobile ? "16px" : "20px 32px",
      borderRadius: "16px",
      marginBottom: "24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "16px"
    },
    headerTitle: {
      fontSize: isMobile ? "18px" : "24px",
      fontWeight: "700"
    },
    headerSubtitle: {
      fontSize: isMobile ? "12px" : "14px",
      opacity: 0.8,
      marginTop: "4px"
    },
    backBtn: {
      backgroundColor: "rgba(255,255,255,0.2)",
      border: "none",
      padding: "8px 16px",
      borderRadius: "8px",
      color: "white",
      cursor: "pointer",
      fontSize: "14px",
      transition: "background 0.3s"
    },
    refreshBtn: {
      backgroundColor: "#22c55e",
      border: "none",
      padding: "8px 16px",
      borderRadius: "8px",
      color: "white",
      cursor: "pointer",
      fontSize: "14px",
      marginLeft: "8px",
      transition: "background 0.3s"
    },
    autoRefreshBtn: {
      backgroundColor: autoRefresh ? "#f59e0b" : "rgba(255,255,255,0.2)",
      border: "none",
      padding: "8px 16px",
      borderRadius: "8px",
      color: "white",
      cursor: "pointer",
      fontSize: "14px",
      marginLeft: "8px",
      transition: "background 0.3s"
    },
    card: {
      backgroundColor: "white",
      borderRadius: "24px",
      padding: isMobile ? "20px" : "32px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
    },
    title: {
      fontSize: isMobile ? "24px" : "28px",
      fontWeight: "700",
      color: "#1a3c34",
      marginBottom: "8px"
    },
    alertBanner: {
      backgroundColor: "#fee2e2",
      borderLeft: "4px solid #dc2626",
      padding: "16px",
      borderRadius: "12px",
      marginBottom: "24px",
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    alertText: {
      color: "#dc2626",
      fontWeight: "500"
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
      gap: "16px",
      marginBottom: "24px"
    },
    statCard: {
      backgroundColor: "#f8fafc",
      padding: "16px",
      borderRadius: "12px",
      textAlign: "center",
      cursor: "pointer",
      transition: "transform 0.3s"
    },
    statNumber: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#1a3c34"
    },
    statLabel: {
      fontSize: "12px",
      color: "#64748b",
      marginTop: "4px"
    },
    filterBar: {
      display: "flex",
      gap: "12px",
      marginBottom: "24px",
      flexWrap: "wrap"
    },
    searchBox: {
      flex: "1",
      padding: "10px 16px",
      fontSize: "14px",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      outline: "none",
      minWidth: "200px"
    },
    select: {
      padding: "10px 16px",
      fontSize: "14px",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      backgroundColor: "white",
      cursor: "pointer",
      outline: "none"
    },
    tableWrapper: {
      overflowX: "auto",
      borderRadius: "12px",
      border: "1px solid #e2e8f0"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      backgroundColor: "white",
      minWidth: "800px"
    },
    th: {
      textAlign: "left",
      padding: "12px 16px",
      backgroundColor: "#f8fafc",
      borderBottom: "2px solid #e2e8f0",
      fontWeight: "600",
      color: "#1e293b",
      fontSize: "14px"
    },
    td: {
      padding: "12px 16px",
      borderBottom: "1px solid #e2e8f0",
      color: "#475569",
      fontSize: "14px"
    },
    statusBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "500"
    },
    suspiciousRow: {
      backgroundColor: "#fef2f2",
      borderLeft: "3px solid #dc2626",
      cursor: "pointer",
      transition: "background 0.2s"
    },
    normalRow: {
      cursor: "pointer",
      transition: "background 0.2s"
    },
    emptyState: {
      textAlign: "center",
      padding: "48px",
      color: "#64748b"
    },
    modal: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      padding: "16px"
    },
    modalContent: {
      backgroundColor: "white",
      borderRadius: "16px",
      padding: "24px",
      maxWidth: "500px",
      width: "100%",
      maxHeight: "90%",
      overflow: "auto"
    },
    modalTitle: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#1a3c34",
      marginBottom: "16px"
    },
    modalInfo: {
      marginBottom: "12px",
      padding: "8px 0",
      borderBottom: "1px solid #e2e8f0"
    },
    modalLabel: {
      fontWeight: "600",
      color: "#1e293b",
      marginBottom: "4px"
    },
    modalValue: {
      color: "#475569",
      wordBreak: "break-word"
    },
    closeBtn: {
      backgroundColor: "#e2e8f0",
      color: "#475569",
      padding: "8px 16px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      marginTop: "16px",
      marginRight: "8px"
    },
    loadingState: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#6b7280"
    }
  };

  // Get user from localStorage
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

  // Handle window resize
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
      // Sort by latest first
      const sortedLogs = response.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setLogs(sortedLogs);
      
      // Calculate stats
      const total = sortedLogs.length;
      const success = sortedLogs.filter(log => log.status === "SUCCESS").length;
      const failed = sortedLogs.filter(log => log.status === "FAILED").length;
      
      // Case-insensitive suspicious detection
      const suspicious = sortedLogs.filter(log => {
        const actionUpper = (log.action || "").toUpperCase();
        return actionUpper.includes("UNAUTHORIZED") || 
               actionUpper.includes("VIOLATION") ||
               log.status === "FAILED";
      }).length;
      
      setStats({ total, success, failed, suspicious });
      
    } catch (err) {
      console.error("Error fetching logs:", err);
      alert("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto refresh every 10 seconds
  useEffect(() => {
    if (user) fetchLogs();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, autoRefresh, fetchLogs]);

  // Filter logs
  useEffect(() => {
    let filtered = [...logs];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        (log.action || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_id.toString().includes(searchTerm) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Action filter
    if (filterAction !== "all") {
      filtered = filtered.filter(log => log.action === filterAction);
    }
    
    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(log => log.status === filterStatus);
    }
    
    setFilteredLogs(filtered);
  }, [logs, searchTerm, filterAction, filterStatus]);

  const getActionIcon = (action) => {
    const actionUpper = (action || "").toUpperCase();
    if (actionUpper.includes("UPLOAD")) return "📤";
    if (actionUpper.includes("DOWNLOAD")) return "📥";
    if (actionUpper.includes("DELETE")) return "🗑️";
    if (actionUpper.includes("LOGIN")) return "🔐";
    if (actionUpper.includes("UNAUTHORIZED")) return "🚫";
    if (actionUpper.includes("VIOLATION")) return "⚠️";
    if (actionUpper.includes("RECOVERY")) return "🔄";
    return "📝";
  };

  const getStatusStyle = (status) => {
    if (status === "SUCCESS") {
      return { color: "#10b981", backgroundColor: "#dcfce7", icon: "✅" };
    } else if (status === "FAILED") {
      return { color: "#dc2626", backgroundColor: "#fee2e2", icon: "❌" };
    }
    return { color: "#f59e0b", backgroundColor: "#fed7aa", icon: "⚠️" };
  };

  const getActionColor = (action) => {
    const actionUpper = (action || "").toUpperCase();
    if (actionUpper.includes("UNAUTHORIZED") || actionUpper.includes("VIOLATION")) {
      return "#dc2626";
    }
    if (actionUpper.includes("RECOVERY")) {
      return "#f59e0b";
    }
    return "#1a5f7a";
  };

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  // Check for suspicious activities
  const hasSuspiciousActivity = filteredLogs.some(log => {
    const actionUpper = (log.action || "").toUpperCase();
    return log.status === "FAILED" || 
           actionUpper.includes("UNAUTHORIZED") || 
           actionUpper.includes("VIOLATION");
  });

  // Escape CSV function
  const escapeCSV = (str) => {
    if (!str) return '""';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // ✅ Show loading state while user loads (using styles defined above)
  if (!user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>⏳</div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>📊 Security Audit Logs</div>
          <div style={styles.headerSubtitle}>
            Real-time monitoring & suspicious activity detection
          </div>
        </div>
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            style={styles.backBtn}
            onMouseEnter={e => e.target.style.backgroundColor = "rgba(255,255,255,0.3)"}
            onMouseLeave={e => e.target.style.backgroundColor = "rgba(255,255,255,0.2)"}
          >
            ← Dashboard
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={styles.autoRefreshBtn}
            onMouseEnter={e => e.target.style.backgroundColor = autoRefresh ? "#d97706" : "rgba(255,255,255,0.3)"}
            onMouseLeave={e => e.target.style.backgroundColor = autoRefresh ? "#f59e0b" : "rgba(255,255,255,0.2)"}
          >
            {autoRefresh ? "⏸️ Auto Refresh ON" : "▶️ Auto Refresh OFF"}
          </button>
          <button
            onClick={fetchLogs}
            style={styles.refreshBtn}
            onMouseEnter={e => e.target.style.backgroundColor = "#16a34a"}
            onMouseLeave={e => e.target.style.backgroundColor = "#22c55e"}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.card}>
        <h1 style={styles.title}>📋 Activity Monitoring</h1>

        {/* Security Alert Banner */}
        {hasSuspiciousActivity && (
          <div style={styles.alertBanner}>
            <span style={{ fontSize: "24px" }}>🚨</span>
            <div>
              <div style={styles.alertText}>Security Alert!</div>
              <div style={{ fontSize: "13px", color: "#991b1b" }}>
                Suspicious activities detected. Review failed attempts immediately.
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.total}</div>
            <div style={styles.statLabel}>Total Activities</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNumber, color: "#10b981" }}>{stats.success}</div>
            <div style={styles.statLabel}>Successful</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNumber, color: "#dc2626" }}>{stats.failed}</div>
            <div style={styles.statLabel}>Failed Attempts</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNumber, color: "#f59e0b" }}>{stats.suspicious}</div>
            <div style={styles.statLabel}>Suspicious Events</div>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="🔍 Search by user, action, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchBox}
            onFocus={(e) => e.target.style.borderColor = "#1a5f7a"}
            onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
          />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Status</option>
            <option value="SUCCESS">✅ Success</option>
            <option value="FAILED">❌ Failed</option>
          </select>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div style={styles.loadingState}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
            <p>Loading security logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={styles.emptyState}>
            📭 No logs found matching your filters
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>👤 User ID</th>
                  <th style={styles.th}>⚡ Action</th>
                  <th style={styles.th}>📊 Status</th>
                  <th style={styles.th}>📅 Timestamp</th>
                  <th style={styles.th}>🔍 Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => {
                  const statusStyle = getStatusStyle(log.status);
                  const actionUpper = (log.action || "").toUpperCase();
                  const isSuspicious = log.status === "FAILED" || 
                                       actionUpper.includes("UNAUTHORIZED") || 
                                       actionUpper.includes("VIOLATION");
                  
                  return (
                    <tr 
                      key={log.id} 
                      style={isSuspicious ? styles.suspiciousRow : styles.normalRow}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f1f5f9";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isSuspicious ? "#fef2f2" : "";
                      }}
                      onClick={() => {
                        setSelectedLog(log);
                        setShowModal(true);
                      }}
                    >
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>
                        <strong>#{log.user_id}</strong>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: getActionColor(log.action) }}>
                          {getActionIcon(log.action)} {log.action}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: statusStyle.backgroundColor,
                          color: statusStyle.color
                        }}>
                          {statusStyle.icon} {log.status}
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
                            padding: "4px 12px",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Export Option */}
        {filteredLogs.length > 0 && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={() => {
                const csv = [
                  ["ID", "User ID", "Action", "Status", "Timestamp", "Details"],
                  ...filteredLogs.map(log => [
                    log.id,
                    log.user_id,
                    escapeCSV(log.action),
                    log.status,
                    new Date(log.created_at).toLocaleString(),
                    escapeCSV(log.details || "N/A")
                  ])
                ].map(row => row.join(",")).join("\n");
                
                const blob = new Blob([csv], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `security-logs-${new Date().toISOString()}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                transition: "background 0.3s"
              }}
              onMouseEnter={e => e.target.style.backgroundColor = "#4b5563"}
              onMouseLeave={e => e.target.style.backgroundColor = "#6b7280"}
            >
              📊 Export Logs (CSV)
            </button>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {showModal && selectedLog && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>📋 Log Details</h3>
            <div style={styles.modalInfo}>
              <div style={styles.modalLabel}>Log ID:</div>
              <div style={styles.modalValue}>#{selectedLog.id}</div>
            </div>
            <div style={styles.modalInfo}>
              <div style={styles.modalLabel}>User ID:</div>
              <div style={styles.modalValue}>{selectedLog.user_id}</div>
            </div>
            <div style={styles.modalInfo}>
              <div style={styles.modalLabel}>Action:</div>
              <div style={styles.modalValue}>
                {getActionIcon(selectedLog.action)} {selectedLog.action}
              </div>
            </div>
            <div style={styles.modalInfo}>
              <div style={styles.modalLabel}>Status:</div>
              <div style={styles.modalValue}>
                <span style={{ color: selectedLog.status === "SUCCESS" ? "#10b981" : "#dc2626" }}>
                  {selectedLog.status}
                </span>
              </div>
            </div>
            <div style={styles.modalInfo}>
              <div style={styles.modalLabel}>Timestamp:</div>
              <div style={styles.modalValue}>
                {new Date(selectedLog.created_at).toLocaleString()}
              </div>
            </div>
            {selectedLog.details && (
              <div style={styles.modalInfo}>
                <div style={styles.modalLabel}>Additional Details:</div>
                <div style={styles.modalValue}>{selectedLog.details}</div>
              </div>
            )}
            <div>
              <button
                onClick={() => setShowModal(false)}
                style={styles.closeBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LogsPage;