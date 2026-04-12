// client/src/App.js
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import API from "./services/api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import DocumentsPage from "./pages/DocumentsPage";
import LogsPage from "./pages/LogsPage";
import AdminPanel from "./pages/AdminPanel";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SetupAccount from "./pages/SetupAccount";

// Constants
const SESSION_TIMEOUT = 30 * 60 * 1000;
const WARNING_TIME = 60 * 1000;

// Loading component
function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a14",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#67e8f9"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px", animation: "spin 1s linear infinite" }}>⏳</div>
        <p>Initializing secure session...</p>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Session Timeout Component
function SessionTimeout({ children }) {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  const resetTimers = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    
    setShowWarning(false);
    
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, SESSION_TIMEOUT - WARNING_TIME);
    
    inactivityTimerRef.current = setTimeout(() => {
      handleLogout();
    }, SESSION_TIMEOUT);
  }, [handleLogout]);

  const stayLoggedIn = useCallback(() => {
    resetTimers();
    setShowWarning(false);
  }, [resetTimers]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    resetTimers();
    
    const events = ['mousemove', 'keypress', 'click', 'scroll'];
    const handleUserActivity = () => resetTimers();
    
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [resetTimers]);

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await API.get("/csrf-token");
        const token = response.data.csrfToken;
        API.defaults.headers.common["CSRF-Token"] = token;
        console.log("CSRF token fetched successfully");
      } catch (error) {
        console.error("Failed to fetch CSRF token:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCsrfToken();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

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