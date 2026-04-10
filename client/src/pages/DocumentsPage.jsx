// client/src/pages/DocumentsPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import PDFViewer from "../components/PDFViewer";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { 
  FaEye, 
  FaDownload, 
  FaTrash, 
  FaSearch,
} from "react-icons/fa";
import { RiGovernmentFill } from "react-icons/ri";

function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showViewer, setShowViewer] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [user, setUser] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const navigate = useNavigate();
  const isMobile = windowWidth < 768;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await API.get("/documents/list");
      setDocuments(response.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err.response?.data?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (docId, filename) => {
    if (user?.role !== "admin") {
      setToast({ message: "Only administrators can download documents", type: "warning" });
      return;
    }

    try {
      setDownloading(docId);
      const response = await API.get(`/documents/download/${docId}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setToast({ message: `"${filename}" downloaded successfully`, type: "success" });
    } catch (err) {
      setToast({ message: "Failed to download document", type: "error" });
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = (docId, docName) => {
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
          setToast({ message: err.response?.data?.message || "Failed to delete document", type: "error" });
        }
      }
    });
  };

  const handleOpenViewer = useCallback((doc) => {
    setViewerDoc(doc);
    setShowViewer(true);
  }, []);

  const getUploaderDisplay = (doc) => {
    const roleDisplay = doc.uploaded_by_role === "admin" ? "Admin" : 
                        doc.uploaded_by_role === "officer" ? "Officer" : "Viewer";
    return {
      name: doc.uploaded_by_name || "Unknown",
      role: roleDisplay,
      full: `${doc.uploaded_by_name || "Unknown"} (${roleDisplay})`,
    };
  };

  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedDocuments = [...filteredDocuments].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  const isAdmin = user?.role === "admin";

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
      marginBottom: "20px",
    },

    stats: {
      display: "flex",
      gap: "12px",
      marginBottom: "24px",
      flexWrap: "wrap",
    },

    statCard: {
      background: "rgba(30, 30, 60, 0.6)",
      border: "1px solid rgba(167, 139, 250, 0.2)",
      borderRadius: "12px",
      padding: "14px 16px",
      flex: "1",
      minWidth: "120px",
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

    searchWrapper: {
      position: "relative",
      marginBottom: "20px",
      width: "100%",
    },

    searchIcon: {
      position: "absolute",
      left: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#818cf8",
      fontSize: "14px",
    },

    searchBox: {
      width: "100%",
      padding: "10px 14px 10px 40px",
      background: "rgba(15, 15, 35, 0.85)",
      border: "1.5px solid rgba(129, 140, 248, 0.35)",
      borderRadius: "10px",
      color: "#f0f9ff",
      fontSize: "12px",
      outline: "none",
      boxSizing: "border-box",
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

    actionBtn: {
      padding: "5px 12px",
      margin: "0 4px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "11px",
      fontWeight: "500",
      transition: "all 0.2s ease",
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
    },

    viewBtn: {
      background: "rgba(103, 232, 249, 0.12)",
      color: "#67e8f9",
      border: "1px solid rgba(103, 232, 249, 0.3)",
    },

    downloadBtn: {
      background: "rgba(167, 139, 250, 0.12)",
      color: "#c4b5fd",
      border: "1px solid rgba(167, 139, 250, 0.3)",
    },

    deleteBtn: {
      background: "rgba(248, 113, 113, 0.12)",
      color: "#fca5a5",
      border: "1px solid rgba(248, 113, 113, 0.3)",
    },

    badge: {
      padding: "3px 10px",
      background: "rgba(103,232,249,0.12)",
      color: "#67e8f9",
      borderRadius: "16px",
      fontSize: "10px",
      fontWeight: "500",
    },

    emptyState: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#94a3b8",
      fontSize: "12px",
    },

    errorAlert: {
      background: "rgba(248, 113, 113, 0.12)",
      border: "1px solid rgba(248, 113, 113, 0.3)",
      color: "#fca5a5",
      padding: "10px 14px",
      borderRadius: "10px",
      marginBottom: "20px",
      fontSize: "12px",
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

      <div style={styles.container}>
        <div style={styles.backgroundLayer} />
        <div style={styles.holographicGrid} />

        {showViewer && viewerDoc && (
          <PDFViewer 
            docId={viewerDoc.id}
            filename={viewerDoc.filename}
            onClose={() => setShowViewer(false)}
          />
        )}

        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.logoSection}>
              <RiGovernmentFill size={18} color="#67e8f9" />
              <div>
                <div style={styles.logo}>Confidential Document System</div>
                <div style={{ fontSize: "9px", color: "#a5b4fc" }}>Document Management</div>
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

              {(user.role === "admin" || user.role === "officer") && (
                <button 
                  onClick={() => navigate("/upload")}
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
                  Upload Document
                </button>
              )}
            </div>
          </div>
        </header>

        <main style={styles.main}>
          <div style={styles.card}>
            <h1 style={styles.title}>Documents</h1>

            <div style={styles.stats}>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{documents.length}</div>
                <div style={styles.statLabel}>Total Documents</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statNumber, color: "#67e8f9" }}>
                  {user.role === "admin" ? "Admin" : user.role === "officer" ? "Officer" : "Viewer"}
                </div>
                <div style={styles.statLabel}>Your Role</div>
              </div>
            </div>

            <div style={styles.searchWrapper}>
              <FaSearch style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchBox}
              />
            </div>

            {error && <div style={styles.errorAlert}>{error}</div>}

            {loading ? (
              <div style={styles.emptyState}>Loading documents...</div>
            ) : sortedDocuments.length === 0 ? (
              <div style={styles.emptyState}>
                No documents found
                {(user.role === "admin" || user.role === "officer") && (
                  <button 
                    onClick={() => navigate("/upload")} 
                    style={{
                      marginTop: "16px",
                      background: "linear-gradient(90deg, #7c3aed, #22d3ee)",
                      color: "#0a0a14",
                      padding: "8px 20px",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "11px",
                      cursor: "pointer"
                    }}
                  >
                    Upload your first document
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Filename</th>
                      <th style={styles.th}>Uploaded By</th>
                      <th style={styles.th}>Upload Date</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDocuments.map((doc, index) => {
                      const uploader = getUploaderDisplay(doc);
                      return (
                        <tr key={doc.id}>
                          <td style={styles.td}>{index + 1}</td>
                          <td style={styles.td}>
                            <strong>{doc.filename}</strong>
                          </td>
                          <td style={styles.td}>
                            {uploader.full}
                          </td>
                          <td style={styles.td}>
                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-IN') : "N/A"}
                          </td>
                          <td style={styles.td}>
                            <span style={styles.badge}>Encrypted</span>
                          </td>
                          <td style={styles.td}>
                            <button
                              onClick={() => handleOpenViewer(doc)}
                              style={{ ...styles.actionBtn, ...styles.viewBtn }}
                            >
                              <FaEye size={10} /> View
                            </button>

                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleDownload(doc.id, doc.filename)}
                                  disabled={downloading === doc.id}
                                  style={{
                                    ...styles.actionBtn,
                                    ...(downloading === doc.id ? { background: "#475569", color: "#94a3b8", cursor: "not-allowed" } : styles.downloadBtn)
                                  }}
                                >
                                  <FaDownload size={10} /> 
                                  {downloading === doc.id ? "Downloading..." : "Download"}
                                </button>

                                <button
                                  onClick={() => handleDelete(doc.id, doc.filename)}
                                  style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                                >
                                  <FaTrash size={10} /> Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

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

export default DocumentsPage;