// Dashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  // Dummy user info for now
  const [user, setUser] = useState({ name: "abcd", role: "admin" });

  const handleLogout = () => {
    navigate("/"); // Redirect to login
  };

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user.name}</h2>
      <p>Your role: {user.role}</p>

      {user.role === "admin" && <button className="role-btn">Admin Panel</button>}
      {user.role === "officer" && <p className="role-info">Officer Dashboard</p>}
      {user.role === "viewer" && <p className="role-info">View Only</p>}

      <button className="upload-btn">Upload Document</button>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;