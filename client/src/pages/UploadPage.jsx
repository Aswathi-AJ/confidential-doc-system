// client/src/pages/UploadPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Toast from "../components/Toast";
import { 
  FaUpload, 
  FaShieldAlt, 

} from "react-icons/fa";
import { MdSecurity } from "react-icons/md";
import { RiGovernmentFill } from "react-icons/ri";

function UploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  const isMobile = windowWidth < 768;

  const allowedFileTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "text/plain"
  ];

  const acceptTypes = ".pdf,.jpg,.jpeg,.png,.txt";

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toUpperCase();
  };

  const getFileIcon = (file) => {
    const type = file.type;
    if (type === "application/pdf") return "📄";
    if (type.includes("image")) return "🖼️";
    if (type.includes("text")) return "📃";
    return "📁";
  };

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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFileSelect = (file) => {
    setError("");
    setSuccess("");
    
    if (!file) {
      setToast({ message: "Please select a file", type: "error" });
      return;
    }
    
    if (!allowedFileTypes.includes(file.type)) {
      setToast({ message: "Only PDF, JPG, PNG, and TXT files are allowed", type: "error" });
      setSelectedFile(null);
      return;
    }
    
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setToast({ message: `File size must be less than 50MB. Current: ${(file.size / (1024 * 1024)).toFixed(2)}MB`, type: "error" });
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setToast({ message: "Please select a file first", type: "error" });
      return;
    }
    
    setUploading(true);
    setError("");
    setSuccess("");
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    try {
      await API.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setToast({ message: "Document uploaded and encrypted successfully!", type: "success" });
      setSelectedFile(null);
      
      const fileInput = document.getElementById("fileInput");
      if (fileInput) fileInput.value = "";
      
      setTimeout(() => {
        if (window.confirm("Document uploaded successfully! Go to Documents page?")) {
          navigate("/documents");
        }
      }, 800);
      
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Upload failed. Please try again.", type: "error" });
    } finally {
      setUploading(false);
    }
  };

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

  const role = user?.role;
  
  if (!user) {
    return <div style={{ minHeight: "100vh", background: "#0a0a14", display: "flex", alignItems: "center", justifyContent: "center", color: "#67e8f9" }}>Loading...</div>;
  }
  
  if (role !== "admin" && role !== "officer") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          background: "rgba(15,15,35,0.95)",
          border: "1px solid rgba(167,139,250,0.4)",
          borderRadius: "20px",
          padding: "32px 24px",
          textAlign: "center",
          maxWidth: "400px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
        }}>
          <FaShieldAlt size={48} color="#fda4af" style={{ marginBottom: "16px" }} />
          <h2 style={{ color: "#f0f9ff", fontSize: "22px", marginBottom: "8px" }}>Access Denied</h2>
          <p style={{ color: "#a5b4fc", margin: "12px 0", fontSize: "13px" }}>
            Only Administrators and Officers can upload documents.
          </p>
          <button 
            onClick={() => navigate("/dashboard")}
            style={{
              background: "linear-gradient(90deg, #7c3aed, #22d3ee)",
              color: "#0a0a14",
              padding: "10px 28px",
              border: "none",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
      background: "rgba(15, 15, 35, 0.96)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(167, 139, 250, 0.25)",
      padding: isMobile ? "12px 16px" : "14px 32px",
      position: "sticky",
      top: 0,
      zIndex: 100,
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
      maxWidth: "600px",
      margin: "0 auto",
      padding: isMobile ? "20px 16px" : "30px 24px",
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
      textAlign: "center",
      marginBottom: "6px",
    },

    subtitle: {
      fontSize: "11px",
      color: "#a5b4fc",
      textAlign: "center",
      marginBottom: "20px",
    },

    uploadArea: {
      border: `2px dashed ${dragOver ? "#67e8f9" : "rgba(167, 139, 250, 0.4)"}`,
      borderRadius: "14px",
      padding: isMobile ? "25px 16px" : "32px 24px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.3s ease",
      background: dragOver ? "rgba(103, 232, 249, 0.08)" : "rgba(15, 15, 35, 0.6)",
      marginBottom: "20px",
    },

    uploadIcon: {
      fontSize: "40px",
      marginBottom: "10px",
      color: "#67e8f9",
    },

    uploadText: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#e0f2fe",
      marginBottom: "5px",
    },

    uploadHint: {
      fontSize: "10px",
      color: "#94a3b8",
      marginBottom: "14px",
    },

    fileInfo: {
      background: "rgba(30, 30, 60, 0.7)",
      border: "1px solid rgba(167, 139, 250, 0.3)",
      padding: "12px",
      borderRadius: "10px",
      marginBottom: "20px",
    },

    fileName: {
      fontSize: "12px",
      fontWeight: "600",
      color: "#e0f2fe",
      wordBreak: "break-all",
    },

    fileSize: {
      fontSize: "10px",
      color: "#94a3b8",
      marginTop: "3px",
    },

    securityBox: {
      background: "rgba(30, 30, 60, 0.6)",
      border: "1px solid rgba(167, 139, 250, 0.25)",
      padding: "14px",
      borderRadius: "10px",
      marginBottom: "20px",
    },

    securityTitle: {
      fontSize: "12px",
      fontWeight: "700",
      color: "#c4b5fd",
      marginBottom: "8px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },

    securityList: {
      fontSize: "10px",
      color: "#a5b4fc",
      lineHeight: "1.6",
      marginLeft: "18px",
    },

    errorAlert: {
      background: "rgba(248, 113, 113, 0.12)",
      border: "1px solid rgba(248, 113, 113, 0.4)",
      color: "#fca5a5",
      padding: "10px 14px",
      borderRadius: "10px",
      marginBottom: "16px",
      fontSize: "11px",
    },

    successAlert: {
      background: "rgba(103, 232, 249, 0.12)",
      border: "1px solid rgba(103, 232, 249, 0.4)",
      color: "#67e8f9",
      padding: "10px 14px",
      borderRadius: "10px",
      marginBottom: "16px",
      fontSize: "11px",
    },

    uploadBtn: {
      width: "100%",
      padding: "10px",
      background: "linear-gradient(90deg, #7c3aed, #22d3ee)",
      color: "#0a0a14",
      border: "none",
      borderRadius: "10px",
      fontSize: "13px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },

    uploadBtnDisabled: {
      width: "100%",
      padding: "10px",
      background: "#475569",
      color: "#94a3b8",
      border: "none",
      borderRadius: "10px",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "not-allowed",
    },

    backButton: {
      background: "rgba(167, 139, 250, 0.12)",
      color: "#c4b5fd",
      border: "1px solid rgba(167, 139, 250, 0.3)",
      padding: "5px 12px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "11px",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      gap: "5px",
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={styles.container}>
        <div style={styles.backgroundLayer} />
        <div style={styles.holographicGrid} />

        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.logoSection}>
              <RiGovernmentFill size={18} color="#67e8f9" />
              <div>
                <div style={styles.logo}>Confidential Document System</div>
                <div style={{ fontSize: "9px", color: "#a5b4fc" }}>Secure Document Upload</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={() => navigate("/dashboard")} 
                style={styles.backButton}
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate("/documents")} 
                style={styles.backButton}
              >
                My Documents
              </button>
            </div>
          </div>
        </header>

        <main style={styles.main}>
          <div style={styles.card}>
            <h1 style={styles.title}>Upload Document</h1>
            <p style={styles.subtitle}>
              Files are encrypted with AES-256-GCM before storage
            </p>

            {error && <div style={styles.errorAlert}>{error}</div>}
            {success && <div style={styles.successAlert}>{success}</div>}

            <div
              style={styles.uploadArea}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("fileInput").click()}
            >
              <div style={styles.uploadIcon}>
                {selectedFile ? getFileIcon(selectedFile) : <FaUpload />}
              </div>
              <div style={styles.uploadText}>
                {dragOver ? "Drop file to upload" : selectedFile ? "File Ready" : "Click or Drag File Here"}
              </div>
              <div style={styles.uploadHint}>
                Supported: PDF, JPG, PNG, TXT • Max 50MB
              </div>

              <input
                id="fileInput"
                type="file"
                accept={acceptTypes}
                onChange={(e) => handleFileSelect(e.target.files[0])}
                style={{ display: "none" }}
              />

              <button
                style={{
                  background: "rgba(167, 139, 250, 0.15)",
                  color: "#c4b5fd",
                  padding: "6px 16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(167, 139, 250, 0.3)",
                  fontWeight: "500",
                  fontSize: "11px",
                  cursor: "pointer",
                  marginTop: "8px"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById("fileInput").click();
                }}
              >
                Select File
              </button>
            </div>

            {selectedFile && (
              <div style={styles.fileInfo}>
                <div style={styles.fileName}>
                  {getFileIcon(selectedFile)} {selectedFile.name}
                </div>
                <div style={styles.fileSize}>
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {getFileExtension(selectedFile.name)}
                </div>
              </div>
            )}

            <div style={styles.securityBox}>
              <div style={styles.securityTitle}>
                <MdSecurity size={13} /> Security Features Active
              </div>
              <ul style={styles.securityList}>
                <li>AES-256-GCM encryption before storage</li>
                <li>Tamper detection with authentication tags</li>
                <li>Backup encryption for data recovery</li>
                <li>Audit logging of all uploads</li>
              </ul>
            </div>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              style={(!selectedFile || uploading) ? styles.uploadBtnDisabled : styles.uploadBtn}
            >
              {uploading ? "Encrypting & Uploading..." : "Encrypt & Upload Securely"}
            </button>
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

export default UploadPage;