// client/src/pages/DocumentsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [user, setUser] = useState(null);
  const [downloading, setDownloading] = useState(null); // Track which doc is downloading

  const navigate = useNavigate();
  const isMobile = windowWidth < 768;

  // Get user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
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

  // Fetch documents
  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await API.get("/documents/list");
      setDocuments(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err.response?.data?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Proper download with authentication
  const handleDownload = async (docId, filename) => {
    try {
      setDownloading(docId);
      
      // Make request with authentication headers
      const response = await API.get(`/documents/download/${docId}`, {
        responseType: "blob", // Important: tells axios to handle binary data
      });
      
      // Create blob URL
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Download error:", err);
      
      // Handle specific error cases
      if (err.response?.status === 403) {
        alert("You don't have permission to download this document");
      } else if (err.response?.status === 404) {
        alert("Document not found");
      } else {
        alert("Failed to download document. Please try again.");
      }
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }
    
    try {
      await API.delete(`/documents/${docId}`);
      fetchDocuments(); // Refresh the list
      alert("Document deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Failed to delete document");
    }
  };

  const handleView = (doc) => {
    setSelectedDoc(doc);
    setShowModal(true);
  };

  // Filter documents based on search
  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort by newest first
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const role = user?.role;
  const isAdmin = role === "admin";

  // ✅ STYLES DEFINED HERE - BEFORE THEY ARE USED
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
    uploadBtn: {
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
    stats: {
      display: "flex",
      gap: "16px",
      marginBottom: "24px",
      flexWrap: "wrap"
    },
    statCard: {
      backgroundColor: "#f8fafc",
      padding: "16px",
      borderRadius: "12px",
      flex: "1",
      minWidth: "120px",
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
    searchBox: {
      width: "100%",
      padding: "12px 16px",
      fontSize: "14px",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      marginBottom: "24px",
      outline: "none",
      transition: "border-color 0.3s"
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
      minWidth: "600px"
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
    actionBtn: {
      padding: "6px 12px",
      margin: "0 4px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "500",
      transition: "all 0.2s"
    },
    viewBtn: {
      backgroundColor: "#3b82f6",
      color: "white"
    },
    downloadBtn: {
      backgroundColor: "#10b981",
      color: "white"
    },
    downloadBtnDisabled: {
      backgroundColor: "#9ca3af",
      color: "white",
      cursor: "not-allowed"
    },
    deleteBtn: {
      backgroundColor: "#ef4444",
      color: "white"
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
      color: "#475569"
    },
    errorAlert: {
      backgroundColor: "#fee2e2",
      color: "#dc2626",
      padding: "12px",
      borderRadius: "10px",
      marginBottom: "20px",
      fontSize: "14px",
      borderLeft: "4px solid #dc2626"
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
    badge: {
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "500",
      backgroundColor: "#dcfce7",
      color: "#166534"
    }
  };

  // Show loading state while user data loads (using styles defined above)
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
          <div style={styles.headerTitle}>📋 Document Management System</div>
          <div style={styles.headerSubtitle}>
            Secure AES-256 Encrypted Document Storage
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
            onClick={() => navigate("/upload")}
            style={styles.uploadBtn}
            onMouseEnter={e => e.target.style.backgroundColor = "#16a34a"}
            onMouseLeave={e => e.target.style.backgroundColor = "#22c55e"}
          >
            + Upload New
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.card}>
        <h1 style={styles.title}>📄 My Documents</h1>

        {/* Statistics */}
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{documents.length}</div>
            <div style={styles.statLabel}>Total Documents</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{documents.filter(d => d.uploaded_by === user?.id).length}</div>
            <div style={styles.statLabel}>Your Documents</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{isAdmin ? "Admin" : role === "officer" ? "Officer" : "Viewer"}</div>
            <div style={styles.statLabel}>Your Role</div>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search by filename..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchBox}
          onFocus={(e) => e.target.style.borderColor = "#1a5f7a"}
          onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
        />

        {/* Error Message */}
        {error && <div style={styles.errorAlert}>{error}</div>}

        {/* Documents Table */}
        {loading ? (
          <div style={styles.emptyState}>⏳ Loading documents...</div>
        ) : sortedDocuments.length === 0 ? (
          <div style={styles.emptyState}>
            📭 No documents found
            {searchTerm && " matching your search"}
            <div style={{ marginTop: "16px" }}>
              <button
                onClick={() => navigate("/upload")}
                style={styles.uploadBtn}
              >
                Upload your first document
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>📄 Filename</th>
                  {isAdmin && <th style={styles.th}>👤 Uploaded By</th>}
                  <th style={styles.th}>📅 Upload Date</th>
                  <th style={styles.th}>🔒 Status</th>
                  <th style={styles.th}>⚡ Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDocuments.map((doc, index) => (
                  <tr key={doc.id}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      <strong>{doc.filename}</strong>
                    </td>
                    {isAdmin && <td style={styles.td}>{doc.uploaded_by || "Unknown"}</td>}
                    <td style={styles.td}>
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badge}>🔐 Encrypted</span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleView(doc)}
                        style={{ ...styles.actionBtn, ...styles.viewBtn }}
                        onMouseEnter={e => e.target.style.opacity = "0.8"}
                        onMouseLeave={e => e.target.style.opacity = "1"}
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleDownload(doc.id, doc.filename)}
                        disabled={downloading === doc.id}
                        style={{
                          ...styles.actionBtn,
                          ...(downloading === doc.id ? styles.downloadBtnDisabled : styles.downloadBtn)
                        }}
                        onMouseEnter={e => {
                          if (downloading !== doc.id) {
                            e.target.style.opacity = "0.8";
                          }
                        }}
                        onMouseLeave={e => {
                          if (downloading !== doc.id) {
                            e.target.style.opacity = "1";
                          }
                        }}
                      >
                        {downloading === doc.id ? "⏳ Downloading..." : "📥 Download"}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                          onMouseEnter={e => e.target.style.opacity = "0.8"}
                          onMouseLeave={e => e.target.style.opacity = "1"}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showModal && selectedDoc && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>📄 Document Details</h3>
            <div style={styles.modalInfo}>
              <div style={styles.modalLabel}>Filename:</div>
              <div style={styles.modalValue}>{selectedDoc.filename}</div>
            </div>
            <div style={styles.modalInfo}>
              <div style={styles.modalLabel}>Uploaded By:</div>
              <div style={styles.modalValue}>{selectedDoc.uploaded_by || "Unknown"}</div>
            </div>
            <div style={styles.modalInfo}>
              <div style={styles.modalLabel}>Upload Date:</div>
              <div style={styles.modalValue}>
                {selectedDoc.created_at ? new Date(selectedDoc.created_at).toLocaleString() : "N/A"}
              </div>
            </div>
            <div style={styles.modalInfo}>
              <div style={styles.modalLabel}>Document ID:</div>
              <div style={styles.modalValue}>#{selectedDoc.id}</div>
            </div>
            <div style={styles.modalInfo}>
              <div style={styles.modalLabel}>Security Status:</div>
              <div style={styles.modalValue}>🔐 AES-256-GCM Encrypted</div>
            </div>
            <div style={styles.modalInfo}>
              <div style={styles.modalLabel}>Tamper Protection:</div>
              <div style={styles.modalValue}>✅ Active with backup recovery</div>
            </div>
            <div>
              <button
                onClick={() => handleDownload(selectedDoc.id, selectedDoc.filename)}
                disabled={downloading === selectedDoc.id}
                style={{
                  ...styles.actionBtn,
                  ...(downloading === selectedDoc.id ? styles.downloadBtnDisabled : styles.downloadBtn),
                  padding: "8px 16px"
                }}
              >
                {downloading === selectedDoc.id ? "⏳ Downloading..." : "📥 Download Document"}
              </button>
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
    </div>
  );
}

export default DocumentsPage;