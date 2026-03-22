// Dashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import OfficerDashboard from "./OfficerDashboard";
import ViewerDashboard from "./ViewerDashboard";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
  const storedUser = localStorage.getItem("user");

  if (!storedUser || storedUser === "undefined") {
    navigate("/");
  } else {
    try {
      setUser(JSON.parse(storedUser));
    } catch (err) {
      console.error("Invalid user data");
      navigate("/");
    }
  }
}, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) return <h2>Loading...</h2>;

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user.name}</h2>
      <p>Your role: {user.role}</p>

      {/* 🔥 Role-based rendering */}
      {user.role === "admin" && <AdminDashboard />}
      {user.role === "officer" && <OfficerDashboard />}
      {user.role === "viewer" && <ViewerDashboard />}

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;