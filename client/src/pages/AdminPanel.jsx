// client/src/pages/AdminPanel.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [user, setUser] = useState(null);

  const isMobile = windowWidth < 768;

  // Get current user
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.role !== "admin") {
        navigate("/dashboard");
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

  // Fetch users
  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await API.get("/admin/users");
      setUsers(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await API.post("/admin/users", formData);
      setSuccess(`User ${response.data.name} created successfully!`);
      setShowCreateModal(false);
      setFormData({ name: "", email: "", password: "", role: "viewer" });
      fetchUsers(); // Refresh list
      
      // Clear success after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Create user error:", err);
      setError(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await API.delete(`/admin/users/${userId}`);
      setSuccess("User deleted successfully!");
      setShowDeleteConfirm(null);
      fetchUsers(); // Refresh list
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Delete user error:", err);
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt("Enter new password (min 6 characters):");
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      await API.post(`/admin/users/${userId}/reset-password`, { password: newPassword });
      alert("Password reset successfully!");
    } catch (err) {
      console.error("Reset password error:", err);
      alert(err.response?.data?.message || "Failed to reset password");
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch(role) {
      case "admin":
        return { backgroundColor: "#fee2e2", color: "#dc2626", icon: "👑" };
      case "officer":
        return { backgroundColor: "#dcfce7", color: "#16a34a", icon: "📋" };
      default:
        return { backgroundColor: "#f3f4f6", color: "#6b7280", icon: "👁️" };
    }
  };

  // Check if user is admin
  if (!user || user.role !== "admin") {
    return null;
  }

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
    createBtn: {
      backgroundColor: "#22c55e",
      border: "none",
      padding: "10px 20px",
      borderRadius: "8px",
      color: "white",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
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
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
      gap: "16px",
      marginBottom: "24px"
    },
    statCard: {
      backgroundColor: "#f8fafc",
      padding: "16px",
      borderRadius: "12px",
      textAlign: "center"
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
    roleBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "500"
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
    resetBtn: {
      backgroundColor: "#f59e0b",
      color: "white"
    },
    deleteBtn: {
      backgroundColor: "#ef4444",
      color: "white"
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
      zIndex: 1000,
      padding: "16px"
    },
    modal: {
      backgroundColor: "white",
      borderRadius: "16px",
      padding: "24px",
      width: "100%",
      maxWidth: "500px",
      maxHeight: "90vh",
      overflow: "auto"
    },
    modalTitle: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#1a3c34",
      marginBottom: "20px"
    },
    inputGroup: {
      marginBottom: "16px"
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "6px"
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
      transition: "border-color 0.3s"
    },
    select: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
      backgroundColor: "white"
    },
    modalButtons: {
      display: "flex",
      gap: "12px",
      marginTop: "20px",
      justifyContent: "flex-end"
    },
    submitBtn: {
      backgroundColor: "#1a5f7a",
      color: "white",
      padding: "10px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500"
    },
    cancelBtn: {
      backgroundColor: "#e5e7eb",
      color: "#374151",
      padding: "10px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500"
    },
    emptyState: {
      textAlign: "center",
      padding: "48px",
      color: "#64748b"
    },
    credentialBox: {
      backgroundColor: "#f0fdf4",
      border: "1px solid #22c55e",
      borderRadius: "8px",
      padding: "12px",
      marginTop: "16px"
    }
  };

  // Calculate stats
  const adminCount = users.filter(u => u.role === "admin").length;
  const officerCount = users.filter(u => u.role === "officer").length;
  const viewerCount = users.filter(u => u.role === "viewer").length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>👑 Admin Control Panel</div>
          <div style={styles.headerSubtitle}>User Management & System Administration</div>
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
            onClick={() => setShowCreateModal(true)}
            style={styles.createBtn}
            onMouseEnter={e => e.target.style.backgroundColor = "#16a34a"}
            onMouseLeave={e => e.target.style.backgroundColor = "#22c55e"}
          >
            + Create New User
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.card}>
        <h1 style={styles.title}>👥 User Management</h1>
        
        {/* Stats */}
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{users.length}</div>
            <div style={styles.statLabel}>Total Users</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{adminCount}</div>
            <div style={styles.statLabel}>Administrators</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{officerCount + viewerCount}</div>
            <div style={styles.statLabel}>Staff Users</div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && <div style={styles.errorAlert}>{error}</div>}
        {success && <div style={styles.successAlert}>{success}</div>}

        {/* Users Table */}
        {loading ? (
          <div style={styles.emptyState}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={styles.emptyState}>
            📭 No users found. Create your first user!
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
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem) => {
                  const roleStyle = getRoleBadgeStyle(userItem.role);
                  return (
                    <tr key={userItem.id}>
                      <td style={styles.td}>{userItem.id}</td>
                      <td style={styles.td}>
                        <strong>{userItem.name}</strong>
                      </td>
                      <td style={styles.td}>{userItem.email}</td>
                      <td style={styles.td}>
                        <span style={{...styles.roleBadge, backgroundColor: roleStyle.backgroundColor, color: roleStyle.color}}>
                          {roleStyle.icon} {userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleResetPassword(userItem.id)}
                          style={{ ...styles.actionBtn, ...styles.resetBtn }}
                          title="Reset Password"
                        >
                          🔑 Reset PW
                        </button>
                        {userItem.id !== user?.id && (
                          <button
                            onClick={() => setShowDeleteConfirm(userItem.id)}
                            style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                            title="Delete User"
                          >
                            🗑️ Delete
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

        {/* Info Box */}
        <div style={styles.credentialBox}>
          <strong>📌 Admin Tips:</strong>
          <ul style={{ marginTop: "8px", marginLeft: "20px", fontSize: "13px" }}>
            <li>Create user accounts and share credentials securely</li>
            <li>Officers can upload documents, Viewers can only view/download</li>
            <li>Reset passwords when users forget them</li>
            <li>You cannot delete your own account</li>
          </ul>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>➕ Create New User</h3>
            <form onSubmit={handleCreateUser}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  style={styles.input}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Password *</label>
                <input
                  type="password"
                  style={styles.input}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Min 6 characters"
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Role *</label>
                <select
                  style={styles.select}
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="viewer">👁️ Viewer (Can view/download only)</option>
                  <option value="officer">📋 Officer (Can upload documents)</option>
                  <option value="admin">👑 Administrator (Full access)</option>
                </select>
              </div>
              <div style={styles.modalButtons}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitBtn}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowDeleteConfirm(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>⚠️ Confirm Delete</h3>
            <p>Are you sure you want to delete this user?</p>
            <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "8px" }}>
              This action cannot be undone.
            </p>
            <div style={styles.modalButtons}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                style={{...styles.submitBtn, backgroundColor: "#dc2626"}}
                onClick={() => handleDeleteUser(showDeleteConfirm)}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;