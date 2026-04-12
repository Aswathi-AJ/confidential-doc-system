import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import DocumentsPage from "./pages/DocumentsPage";
import LogsPage from "./pages/LogsPage";
import AdminPanel from "./pages/AdminPanel";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SetupAccount from "./pages/SetupAccount";

// Session Timeout Component (Wrapper)

function SessionTimeout({ children }) {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  let inactivityTimer;
  let warningTimer;

  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const WARNING_TIME = 60 * 1000; // Show warning 1 minute before timeout

  const resetTimers = () => {
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
    setShowWarning(false);
    
    warningTimer = setTimeout(() => {
      setShowWarning(true);
    }, SESSION_TIMEOUT - WARNING_TIME);
    
    inactivityTimer = setTimeout(() => {
      handleLogout();
    }, SESSION_TIMEOUT);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const stayLoggedIn = () => {
    resetTimers();
    setShowWarning(false);
  };

  useEffect(() => {
  // Only start timer if user is logged in
  const token = localStorage.getItem("token");
  if (token) {
    resetTimers();
    
    // Events that reset the timer
    const events = ['mousemove', 'keypress', 'click', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, resetTimers);
    });
    
    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetTimers);
      });
    };
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Disable the warning because resetTimers is stable

  // Warning Modal Styles
  const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
    },
    modal: {
      background: "rgba(15,15,35,0.98)",
      border: "1px solid rgba(103,232,249,0.3)",
      borderRadius: "20px",
      padding: "32px",
      width: "90%",
      maxWidth: "400px",
      textAlign: "center",
      boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
    },
    title: {
      color: "#f0f9ff",
      fontSize: "22px",
      marginBottom: "16px",
    },
    message: {
      color: "#a5b4fc",
      fontSize: "14px",
      marginBottom: "24px",
      lineHeight: "1.5",
    },
    buttonGroup: {
      display: "flex",
      gap: "12px",
      justifyContent: "center",
    },
    stayBtn: {
      background: "linear-gradient(90deg, #10b981, #059669)",
      color: "white",
      padding: "10px 24px",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: "600",
    },
    logoutBtn: {
      background: "rgba(248,113,113,0.2)",
      color: "#fca5a5",
      border: "1px solid rgba(248,113,113,0.4)",
      padding: "10px 24px",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: "600",
    },
  };

  if (showWarning) {
    return (
      <>
        {children}
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h3 style={modalStyles.title}>Session Timeout Warning</h3>
            <p style={modalStyles.message}>
              Your session will expire in 1 minute due to inactivity.
              Do you want to stay logged in?
            </p>
            <div style={modalStyles.buttonGroup}>
              <button onClick={stayLoggedIn} style={modalStyles.stayBtn}>
                Stay Logged In
              </button>
              <button onClick={handleLogout} style={modalStyles.logoutBtn}>
                Logout Now
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return children;
}
// Main App Component
function App() {
  return (
    <BrowserRouter>
      <SessionTimeout>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} /> 
          <Route path="/setup-account" element={<SetupAccount />} />  
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SessionTimeout>
    </BrowserRouter>
  );
}

export default App;