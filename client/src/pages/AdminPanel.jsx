// client/src/pages/AdminPanel.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { 
  FaTrash, 
  FaKey, 
  FaUserPlus, 
  FaUserShield,
  FaUserTie,
  FaUser,
  FaTimes,
  FaUnlockAlt,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle
} from "react-icons/fa";
import { RiGovernmentFill } from "react-icons/ri";

function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showResetModal, setShowResetModal] = useState(null); // { id, name }
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer"
  });
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resettingUser, setResettingUser] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toast, setToast] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [user, setUser] = useState(null);
  const [unlockingUser, setUnlockingUser] = useState(null);

  const isMobile = windowWidth < 768;

  // Password strength states for reset modal
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Check password strength in real-time for reset modal
  useEffect(() => {
    setPasswordStrength({
      length: resetPassword.length >= 8,
      uppercase: /[A-Z]/.test(resetPassword),
      lowercase: /[a-z]/.test(resetPassword),
      number: /[0-9]/.test(resetPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(resetPassword)
    });
  }, [resetPassword]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);
      const response = await API.get("/admin/users");
      setUsers(response.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching users:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        setError(err.response?.data?.message || "Failed to load users");
        setToast({ message: err.response?.data?.message || "Failed to load users", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== "admin") {
          navigate("/dashboard", { replace: true });
          return;
        }
        setUser(parsedUser);
        setIsCheckingAuth(false);
      } catch (e) {
        navigate("/login", { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  // Fetch users when authenticated
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.email || !formData.password) {
      setToast({ message: "All fields are required", type: "error" });
      return;
    }

    if (formData.password.length < 6) {
      setToast({ message: "Password must be at least 6 characters", type: "error" });
      return;
    }

    try {
      const response = await API.post("/admin/users", formData);
      setToast({ message: `User ${response.data.user?.name || formData.name} created successfully! Setup link sent via email.`, type: "success" });
      setShowCreateModal(false);
      setFormData({ name: "", email: "", password: "", role: "viewer" });
      fetchUsers();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to create user", type: "error" });
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    setShowDeleteConfirm(null);
    try {
      await API.delete(`/admin/users/${userId}`);
      setToast({ message: `User "${userName}" deleted successfully`, type: "success" });
      fetchUsers();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to delete user", type: "error" });
    }
  };

  // Updated Reset Password function - opens modal instead of prompt
  const handleResetPassword = (userId, userName) => {
    setShowResetModal({ id: userId, name: userName });
    setResetPassword("");
    setResetConfirmPassword("");
    setShowResetPassword(false);
  };

  // Confirm password reset with validation
  const handleConfirmResetPassword = async () => {
    // Validate password strength
    if (resetPassword.length < 8) {
      setToast({ message: "Password must be at least 8 characters long", type: "error" });
      return;
    }
    if (!/[A-Z]/.test(resetPassword)) {
      setToast({ message: "Password must contain at least one uppercase letter", type: "error" });
      return;
    }
    if (!/[a-z]/.test(resetPassword)) {
      setToast({ message: "Password must contain at least one lowercase letter", type: "error" });
      return;
    }
    if (!/[0-9]/.test(resetPassword)) {
      setToast({ message: "Password must contain at least one number", type: "error" });
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(resetPassword)) {
      setToast({ message: "Password must contain at least one special character (!@#$%^&* etc.)", type: "error" });
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      setToast({ message: "Passwords do not match", type: "error" });
      return;
    }

    setResettingUser(true);
    try {
      await API.post(`/admin/users/${showResetModal.id}/reset-password`, { 
        password: resetPassword 
      });
      setToast({ 
        message: `Password reset for "${showResetModal.name}". User can now login with new password.`, 
        type: "success" 
      });
      setShowResetModal(null);
      setResetPassword("");
      setResetConfirmPassword("");
    } catch (err) {
      setToast({ 
        message: err.response?.data?.message || "Failed to reset password", 
        type: "error" 
      });
    } finally {
      setResettingUser(false);
    }
  };

  // Unlock Account function
  const handleUnlockAccount = async (email, userName) => {
    setUnlockingUser(email);
    try {
      const response = await API.post("/auth/admin/unlock-account", { email });
      setToast({ message: response.data.message || `Account "${userName}" unlocked successfully`, type: "success" });
      fetchUsers();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to unlock account", type: "error" });
    } finally {
      setUnlockingUser(null);
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch(role) {
      case "admin":
        return { bg: "rgba(248, 113, 113, 0.15)", color: "#fda4af", icon: <FaUserShield size={11} /> };
      case "officer":
        return { bg: "rgba(103, 232, 249, 0.15)", color: "#67e8f9", icon: <FaUserTie size={11} /> };
      default:
        return { bg: "rgba(148, 163, 184, 0.15)", color: "#94a3b8", icon: <FaUser size={11} /> };
    }
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

  if (isCheckingAuth) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a14", display: "flex", alignItems: "center", justifyContent: "center", color: "#67e8f9" }}>
        Loading Admin Panel...
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const adminCount = users.filter(u => u.role === "admin").length;
  const officerCount = users.filter(u => u.role === "officer").length;
  const viewerCount = users.filter(u => u.role === "viewer").length;

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
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
      gap: "12px",
      marginBottom: "24px",
    },

    statCard: {
      background: "rgba(30, 30, 60, 0.6)",
      border: "1px solid rgba(167, 139, 250, 0.2)",
      borderRadius: "12px",
      padding: "14px",
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

    tableWrapper: {
      overflowX: "auto",
      borderRadius: "12px",
      border: "1px solid rgba(167, 139, 250, 0.15)",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
      background: "rgba(15, 15, 35, 0.6)",
      minWidth: "900px",
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

    roleBadge: {
      padding: "4px 12px",
      borderRadius: "16px",
      fontSize: "10px",
      fontWeight: "600",
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
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

    resetBtn: {
      background: "rgba(167, 139, 250, 0.12)",
      color: "#c4b5fd",
      border: "1px solid rgba(167, 139, 250, 0.3)",
    },

    unlockBtn: {
      background: "rgba(16, 185, 129, 0.12)",
      color: "#10b981",
      border: "1px solid rgba(16, 185, 129, 0.3)",
    },

    deleteBtn: {
      background: "rgba(248, 113, 113, 0.12)",
      color: "#fca5a5",
      border: "1px solid rgba(248, 113, 113, 0.3)",
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

    successAlert: {
      background: "rgba(103, 232, 249, 0.12)",
      border: "1px solid rgba(103, 232, 249, 0.3)",
      color: "#67e8f9",
      padding: "10px 14px",
      borderRadius: "10px",
      marginBottom: "20px",
      fontSize: "12px",
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
      padding: isMobile ? "16px" : "20px",
    },

    modal: {
      background: "rgba(15, 15, 35, 0.98)",
      border: "1px solid rgba(167, 139, 250, 0.4)",
      borderRadius: "16px",
      padding: isMobile ? "20px" : "24px",
      width: "90%",
      maxWidth: "440px",
      maxHeight: isMobile ? "90vh" : "auto",
      overflowY: "auto",
      boxSizing: "border-box",
    },

    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      flexWrap: "wrap",
      gap: "10px",
    },

    modalTitle: {
      color: "#f0f9ff",
      fontSize: isMobile ? "16px" : "18px",
      margin: 0,
      fontWeight: "600",
    },

    closeButton: {
      background: "none",
      border: "none",
      color: "#9ca3af",
      cursor: "pointer",
      padding: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "color 0.2s ease",
    },

    formGroup: {
      marginBottom: "14px",
      width: "100%",
    },

    formLabel: {
      color: "#c4b5fd",
      display: "block",
      marginBottom: "5px",
      fontSize: "11px",
      fontWeight: "500",
    },

    formInput: {
      width: "100%",
      padding: "9px 12px",
      background: "rgba(15,15,35,0.85)",
      border: "1.5px solid rgba(129,140,248,0.35)",
      borderRadius: "8px",
      color: "#f0f9ff",
      fontSize: "12px",
      outline: "none",
      boxSizing: "border-box",
      transition: "border-color 0.2s ease",
    },

    selectInput: {
      width: "100%",
      padding: "9px 12px",
      background: "rgba(15,15,35,0.85)",
      border: "1.5px solid rgba(129,140,248,0.35)",
      borderRadius: "8px",
      color: "#f0f9ff",
      fontSize: "12px",
      outline: "none",
      boxSizing: "border-box",
      cursor: "pointer",
    },

    modalActions: {
      display: "flex",
      gap: "10px",
      justifyContent: "flex-end",
      marginTop: "24px",
      flexDirection: isMobile ? "column" : "row",
    },

    cancelButton: {
      padding: isMobile ? "10px 20px" : "8px 20px",
      background: "rgba(148,163,184,0.2)",
      color: "#e0f2fe",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "11px",
      fontWeight: "500",
      width: isMobile ? "100%" : "auto",
      transition: "background 0.2s ease",
    },

    submitButton: {
      padding: isMobile ? "10px 24px" : "8px 24px",
      background: "linear-gradient(90deg, #7c3aed, #22d3ee)",
      color: "#0a0a14",
      border: "none",
      borderRadius: "8px",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: "11px",
      width: isMobile ? "100%" : "auto",
      transition: "opacity 0.2s ease",
    },

    guidelinesBox: {
      marginTop: "20px",
      padding: "16px",
      background: "rgba(30,30,60,0.5)",
      borderRadius: "12px",
      border: "1px solid rgba(167,139,250,0.15)",
    },

    strengthContainer: {
      marginTop: "8px",
      padding: "8px",
      background: "rgba(15,15,35,0.6)",
      borderRadius: "8px",
    },

    strengthBar: {
      height: "4px",
      background: "#2a2a4a",
      borderRadius: "2px",
      overflow: "hidden",
      marginBottom: "8px",
    },

    strengthFill: {
      width: `${(Object.values(passwordStrength).filter(v => v === true).length / 5) * 100}%`,
      height: "100%",
      background: getStrengthColor(),
      transition: "width 0.3s ease",
    },

    strengthText: {
      fontSize: "10px",
      color: getStrengthColor(),
      textAlign: "right",
      marginBottom: "8px",
    },

    rulesList: {
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
      marginTop: "8px",
    },

    ruleItem: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "9px",
      color: "#94a3b8",
    },
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete "${showDeleteConfirm.name}"? This action cannot be undone.`}
          onConfirm={() => handleDeleteUser(showDeleteConfirm.id, showDeleteConfirm.name)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      <div style={styles.container}>
        <div style={styles.backgroundLayer} />
        <div style={styles.holographicGrid} />

        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.logoSection}>
              <RiGovernmentFill size={18} color="#67e8f9" />
              <div>
                <div style={styles.logo}>Confidential Document System</div>
                <div style={{ fontSize: "9px", color:"#a5b4fc" }}>Admin Control Panel</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button 
                onClick={() => navigate("/dashboard")}
                style={{
                  background: "rgba(167, 139, 250, 0.12)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(167, 139, 250, 0.3)",
                  padding: isMobile ? "6px 12px" : "6px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "11px"
                }}
              >
                Dashboard
              </button>

              <button 
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: "linear-gradient(90deg, #7c3aed, #22d3ee)",
                  color: "#0a0a14",
                  padding: isMobile ? "6px 12px" : "6px 16px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <FaUserPlus size={11} /> Create User
              </button>
            </div>
          </div>
        </header>

        <main style={styles.main}>
          <div style={styles.card}>
            <h1 style={styles.title}>User Management</h1>

            <div style={styles.stats}>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{users.length}</div>
                <div style={styles.statLabel}>Total Users</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statNumber, color: "#fda4af" }}>{adminCount}</div>
                <div style={styles.statLabel}>Administrators</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statNumber, color: "#67e8f9" }}>{officerCount + viewerCount}</div>
                <div style={styles.statLabel}>Staff Members</div>
              </div>
            </div>

            {error && <div style={styles.errorAlert}>{error}</div>}
            {success && <div style={styles.successAlert}>{success}</div>}

            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#67e8f9", fontSize: "13px" }}>
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "12px" }}>
                No users found. Create your first user.
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Joined</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userItem) => {
                      const roleStyle = getRoleBadgeStyle(userItem.role);
                      const isLocked = userItem.is_locked === 1;
                      
                      return (
                        <tr key={userItem.id}>
                          <td style={styles.td}>{userItem.id}</td>
                          <td style={styles.td}><strong>{userItem.name}</strong></td>
                          <td style={styles.td}>{userItem.email}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.roleBadge,
                              backgroundColor: roleStyle.bg,
                              color: roleStyle.color
                            }}>
                              {roleStyle.icon} {userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString('en-IN') : "N/A"}
                          </td>
                          <td style={styles.td}>
                            {isLocked ? (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "3px 10px",
                                borderRadius: "20px",
                                fontSize: "10px",
                                fontWeight: "600",
                                background: "rgba(239, 68, 68, 0.15)",
                                color: "#f87171"
                              }}>
                                <FaLock size={10} /> Locked
                              </span>
                            ) : (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "3px 10px",
                                borderRadius: "20px",
                                fontSize: "10px",
                                fontWeight: "600",
                                background: "rgba(16, 185, 129, 0.15)",
                                color: "#10b981"
                              }}>
                                <FaUnlockAlt size={10} /> Active
                              </span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <button
                              onClick={() => handleResetPassword(userItem.id, userItem.name)}
                              style={{ ...styles.actionBtn, ...styles.resetBtn }}
                              title="Reset Password"
                            >
                              <FaKey size={10} /> Reset PW
                            </button>
                            
                            {isLocked && (
                              <button
                                onClick={() => handleUnlockAccount(userItem.email, userItem.name)}
                                disabled={unlockingUser === userItem.email}
                                style={{ 
                                  ...styles.actionBtn, 
                                  ...styles.unlockBtn,
                                  opacity: unlockingUser === userItem.email ? 0.6 : 1,
                                  cursor: unlockingUser === userItem.email ? "not-allowed" : "pointer"
                                }}
                                title="Unlock Account (locked due to failed login attempts)"
                              >
                                <FaUnlockAlt size={10} /> {unlockingUser === userItem.email ? "Unlocking..." : "Unlock"}
                              </button>
                            )}
                            
                            {userItem.id !== user?.id && (
                              <button
                                onClick={() => setShowDeleteConfirm({ id: userItem.id, name: userItem.name })}
                                style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                                title="Delete User"
                              >
                                <FaTrash size={10} /> Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={styles.guidelinesBox}>
              <strong style={{ color: "#c4b5fd", fontSize: "12px" }}>Admin Guidelines:</strong>
              <ul style={{ marginTop: "8px", color: "#a5b4fc", fontSize: "11px", lineHeight: "1.6", marginLeft: "20px" }}>
                <li>Administrators have full access including user management</li>
                <li>Officers can upload and manage documents</li>
                <li>Viewers can only view documents</li>
                <li>You cannot delete your own account</li>
                <li>"Locked" status appears after 5 failed login attempts within 30 minutes</li>
                <li>Click "Unlock" to immediately unlock a locked account</li>
              </ul>
            </div>
          </div>
        </main>

        {/* Create User Modal */}
        {showCreateModal && (
          <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Create New User</h3>
                <button 
                  onClick={() => setShowCreateModal(false)} 
                  style={styles.closeButton}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#f0f9ff"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}
                >
                  <FaTimes size={isMobile ? 14 : 16} />
                </button>
              </div>
              
              <form onSubmit={handleCreateUser}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter full name"
                    style={styles.formInput}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="user@gov.in"
                    style={styles.formInput}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Minimum 6 characters"
                    style={styles.formInput}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    style={styles.selectInput}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="officer">Officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div style={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={styles.cancelButton}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(148,163,184,0.3)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(148,163,184,0.2)"}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={styles.submitButton}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetModal && (
          <div style={styles.modalOverlay} onClick={() => setShowResetModal(null)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Reset Password</h3>
                <button 
                  onClick={() => setShowResetModal(null)} 
                  style={styles.closeButton}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#f0f9ff"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}
                >
                  <FaTimes size={isMobile ? 14 : 16} />
                </button>
              </div>
              
              <div style={{ marginBottom: "16px" }}>
                <p style={{ color: "#a5b4fc", fontSize: "13px", marginBottom: "4px" }}>
                  Resetting password for:
                </p>
                <p style={{ color: "#67e8f9", fontWeight: "600", fontSize: "14px" }}>
                  {showResetModal.name}
                </p>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleConfirmResetPassword(); }}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>New Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showResetPassword ? "text" : "password"}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Minimum 8 characters with uppercase, lowercase, number & special char"
                      style={styles.formInput}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#a5b4fc",
                        cursor: "pointer"
                      }}
                    >
                      {showResetPassword ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {resetPassword && (
                    <div style={styles.strengthContainer}>
                      <div style={styles.strengthBar}>
                        <div style={styles.strengthFill} />
                      </div>
                      <div style={styles.strengthText}>
                        Password Strength: {getStrengthText()}
                      </div>
                      <div style={styles.rulesList}>
                        <div style={{ ...styles.ruleItem, color: passwordStrength.length ? "#10b981" : "#94a3b8" }}>
                          {passwordStrength.length ? <FaCheckCircle size={8} /> : <FaTimesCircle size={8} />}
                          8+ characters
                        </div>
                        <div style={{ ...styles.ruleItem, color: passwordStrength.uppercase ? "#10b981" : "#94a3b8" }}>
                          {passwordStrength.uppercase ? <FaCheckCircle size={8} /> : <FaTimesCircle size={8} />}
                          Uppercase
                        </div>
                        <div style={{ ...styles.ruleItem, color: passwordStrength.lowercase ? "#10b981" : "#94a3b8" }}>
                          {passwordStrength.lowercase ? <FaCheckCircle size={8} /> : <FaTimesCircle size={8} />}
                          Lowercase
                        </div>
                        <div style={{ ...styles.ruleItem, color: passwordStrength.number ? "#10b981" : "#94a3b8" }}>
                          {passwordStrength.number ? <FaCheckCircle size={8} /> : <FaTimesCircle size={8} />}
                          Number
                        </div>
                        <div style={{ ...styles.ruleItem, color: passwordStrength.special ? "#10b981" : "#94a3b8" }}>
                          {passwordStrength.special ? <FaCheckCircle size={8} /> : <FaTimesCircle size={8} />}
                          Special char
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Confirm Password</label>
                  <input
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    style={styles.formInput}
                    required
                  />
                </div>

                <div style={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(null)}
                    style={styles.cancelButton}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(148,163,184,0.3)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(148,163,184,0.2)"}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resettingUser}
                    style={{
                      ...styles.submitButton,
                      opacity: resettingUser ? 0.6 : 1,
                      cursor: resettingUser ? "not-allowed" : "pointer"
                    }}
                    onMouseEnter={(e) => {
                      if (!resettingUser) {
                        e.currentTarget.style.opacity = "0.9";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!resettingUser) {
                        e.currentTarget.style.opacity = "1";
                      }
                    }}
                  >
                    {resettingUser ? "Resetting..." : "Reset Password"}
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
          
          /* Mobile-specific adjustments */
          @media (max-width: 768px) {
            input, select, button {
              font-size: 14px !important;
            }
            
            input:focus, select:focus, textarea:focus {
              font-size: 14px !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}

export default AdminPanel;