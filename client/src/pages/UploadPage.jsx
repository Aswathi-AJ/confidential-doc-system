// client/src/pages/UploadPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function UploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [user, setUser] = useState(null);

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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle file selection
  const handleFileSelect = (file) => {
    setError("");
    setSuccess("");
    
    // Check if file exists
    if (!file) {
      setError("Please select a file");
      return;
    }
    
    // Check file type (PDF only)
    if (file.type !== "application/pdf") {
      setError("❌ Only PDF files are allowed");
      setSelectedFile(null);
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("❌ File size must be less than 5MB");
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }
    
    setUploading(true);
    setError("");
    setSuccess("");
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    try {
      await API.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      setSuccess("✅ Document uploaded and encrypted successfully!");
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById("fileInput");
      if (fileInput) fileInput.value = "";
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
      
      // Optional: Redirect to documents page after 1 second
      setTimeout(() => {
        if (window.confirm("Document uploaded successfully! Go to Documents page?")) {
          navigate("/documents");
        }
      }, 500);
      
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  // ✅ STYLES DEFINED HERE - BEFORE THEY ARE USED
  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      padding: isMobile ? "16px" : "24px"
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
    card: {
      maxWidth: "600px",
      margin: "0 auto",
      backgroundColor: "white",
      borderRadius: "24px",
      padding: isMobile ? "24px" : "32px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
    },
    title: {
      fontSize: isMobile ? "24px" : "28px",
      fontWeight: "700",
      color: "#1a3c34",
      marginBottom: "8px",
      textAlign: "center"
    },
    subtitle: {
      fontSize: "14px",
      color: "#6b7280",
      textAlign: "center",
      marginBottom: "24px"
    },
    uploadArea: {
      border: `2px dashed ${dragOver ? "#1a5f7a" : "#cbd5e1"}`,
      borderRadius: "16px",
      padding: isMobile ? "30px 20px" : "40px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.3s",
      backgroundColor: dragOver ? "#f0f9ff" : "#fafbfc",
      marginBottom: "20px"
    },
    uploadIcon: {
      fontSize: isMobile ? "48px" : "64px",
      marginBottom: "16px"
    },
    uploadText: {
      fontSize: isMobile ? "14px" : "16px",
      color: "#64748b",
      marginBottom: "8px"
    },
    uploadHint: {
      fontSize: "12px",
      color: "#94a3b8",
      marginBottom: "16px"
    },
    selectBtn: {
      backgroundColor: "#1a5f7a",
      color: "white",
      padding: "10px 20px",
      borderRadius: "8px",
      cursor: "pointer",
      display: "inline-block",
      fontSize: "14px",
      fontWeight: "500",
      border: "none",
      transition: "background 0.3s"
    },
    fileInfo: {
      backgroundColor: "#f1f5f9",
      padding: "16px",
      borderRadius: "12px",
      marginBottom: "20px"
    },
    fileName: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#1e293b",
      wordBreak: "break-all"
    },
    fileSize: {
      fontSize: "12px",
      color: "#64748b",
      marginTop: "4px"
    },
    securityBox: {
      backgroundColor: "#f0fdf4",
      padding: "16px",
      borderRadius: "12px",
      marginBottom: "20px",
      borderLeft: "4px solid #22c55e"
    },
    securityTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#166534",
      marginBottom: "8px"
    },
    securityList: {
      fontSize: "12px",
      color: "#15803d",
      marginLeft: "20px",
      lineHeight: "1.6"
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
    successAlert: {
      backgroundColor: "#dcfce7",
      color: "#166534",
      padding: "12px",
      borderRadius: "10px",
      marginBottom: "20px",
      fontSize: "14px",
      borderLeft: "4px solid #22c55e"
    },
    uploadBtn: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#1a5f7a",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background 0.3s",
      marginTop: "8px"
    },
    uploadBtnDisabled: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#9ca3af",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "not-allowed",
      marginTop: "8px"
    },
    requirements: {
      marginTop: "20px",
      paddingTop: "20px",
      borderTop: "1px solid #e2e8f0"
    },
    reqTitle: {
      fontSize: "12px",
      fontWeight: "600",
      color: "#64748b",
      marginBottom: "8px"
    },
    reqList: {
      fontSize: "11px",
      color: "#94a3b8",
      marginLeft: "20px",
      lineHeight: "1.6"
    },
    accessDenied: {
      textAlign: "center",
      backgroundColor: "white",
      borderRadius: "24px",
      padding: "48px",
      maxWidth: "500px",
      margin: "100px auto",
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
    }
  };

  const role = user?.role;
  
  // ✅ FIX: Prevent flash of "Access Denied" while loading user
  if (!user) {
    return <div>Loading...</div>; // or return a loading spinner
  }
  
  // Check permission
  if (role !== "admin" && role !== "officer") {
    return (
      <div style={styles.container}>
        <div style={styles.accessDenied}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🚫</div>
          <h2>Access Denied</h2>
          <p>Only Administrators and Officers can upload documents.</p>
          <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>🔐 Confidential Document System</div>
          <div style={styles.headerSubtitle}>Secure AES-256 Encrypted Upload</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            onClick={() => navigate("/documents")} 
            style={styles.backBtn}
            onMouseEnter={e => e.target.style.backgroundColor = "rgba(255,255,255,0.3)"}
            onMouseLeave={e => e.target.style.backgroundColor = "rgba(255,255,255,0.2)"}
          >
            📋 My Documents
          </button>
          <button 
            onClick={() => navigate("/dashboard")} 
            style={styles.backBtn}
            onMouseEnter={e => e.target.style.backgroundColor = "rgba(255,255,255,0.3)"}
            onMouseLeave={e => e.target.style.backgroundColor = "rgba(255,255,255,0.2)"}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Upload Card */}
      <div style={styles.card}>
        <h1 style={styles.title}>📄 Upload Document</h1>
        <p style={styles.subtitle}>Securely upload encrypted government documents</p>

        {/* Error/Success Messages */}
        {error && <div style={styles.errorAlert}>{error}</div>}
        {success && <div style={styles.successAlert}>{success}</div>}

        {/* Upload Area */}
        <div
          style={styles.uploadArea}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("fileInput").click()}
        >
          <div style={styles.uploadIcon}>📁</div>
          <div style={styles.uploadText}>
            {dragOver ? "Drop your PDF here" : "Click or drag PDF file here"}
          </div>
          <div style={styles.uploadHint}>Only PDF files, Max 5MB</div>
          <input
            id="fileInput"
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            style={{ display: "none" }}
          />
          <button
            style={styles.selectBtn}
            onMouseEnter={e => e.target.style.backgroundColor = "#0e4a60"}
            onMouseLeave={e => e.target.style.backgroundColor = "#1a5f7a"}
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById("fileInput").click();
            }}
          >
            Select File
          </button>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div style={styles.fileInfo}>
            <div style={styles.fileName}>📄 {selectedFile.name}</div>
            <div style={styles.fileSize}>
              Size: {(selectedFile.size / 1024).toFixed(2)} KB
            </div>
          </div>
        )}

        {/* Security Information */}
        <div style={styles.securityBox}>
          <div style={styles.securityTitle}>🔐 Security Features (Active)</div>
          <ul style={styles.securityList}>
            <li>AES-256-GCM encryption before storage</li>
            <li>Tamper detection with authentication tags</li>
            <li>Backup encryption for data recovery</li>
            <li>Audit logging of all uploads</li>
          </ul>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          style={(!selectedFile || uploading) ? styles.uploadBtnDisabled : styles.uploadBtn}
          onMouseEnter={e => {
            if (!(!selectedFile || uploading)) {
              e.target.style.backgroundColor = "#0e4a60";
            }
          }}
          onMouseLeave={e => {
            if (!(!selectedFile || uploading)) {
              e.target.style.backgroundColor = "#1a5f7a";
            }
          }}
        >
          {uploading ? (
            "⏳ Encrypting & Uploading..."
          ) : (
            "🔐 Encrypt & Upload Securely"
          )}
        </button>

        {/* Requirements */}
        <div style={styles.requirements}>
          <div style={styles.reqTitle}>📋 Requirements:</div>
          <ul style={styles.reqList}>
            <li>Only PDF files are allowed</li>
            <li>Maximum file size: 5MB</li>
            <li>Files are encrypted before storage</li>
            <li>Upload history is logged for audit</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;