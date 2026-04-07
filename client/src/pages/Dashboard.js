import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Dashboard.css";
import { FaFileAlt, FaUpload, FaChartBar } from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  let role = "";
  let name = "User";

  if (token) {
    const decoded = JSON.parse(atob(token.split(".")[1]));
    role = decoded.role;
    name = decoded.name || "User";
  }

let storedUser = null;

try {
  const userData = localStorage.getItem("user");
  if (userData) {
    storedUser = JSON.parse(userData);
    if (storedUser.name) {
      name = storedUser.name;
    }
  }
} catch (error) {
  console.log("Error parsing user:", error);
}

  return (
    <>
      <Navbar />

      <div className="dashboard-container">
        {/* ✅ Updated Header */}
        <h2 className="welcome-text">Welcome👋</h2>
        <p className="role-text">"{role}</p>

        <div className="card-container">

          {/* 👤 Viewer */}
          {role === "viewer" && (
            <div
              className="card documents"
              onClick={() => navigate("/documents")}
            >
              <div className="card-icon">📄</div>
              <h3>Documents</h3>
              <p>View and download files</p>
            </div>
          )}

          {/* 👨‍💼 Officer */}
          {role === "officer" && (
            <>
              <div
                className="card upload"
                onClick={() => navigate("/upload")}
              >
                <div className="card-icon">⬆</div>
                <h3>Upload</h3>
                <p>Upload secure documents</p>
              </div>

              <div
                className="card documents"
                onClick={() => navigate("/documents")}
              >
                <div className="card-icon"><FaFileAlt /></div>
                <h3>Documents</h3>
                <p>View and download files</p>
              </div>
            </>
          )}

          {/* 👑 Admin */}
          {role === "admin" && (
            <>
              <div
                className="card documents"
                onClick={() => navigate("/documents")}
              >
                <div className="card-icon"><FaFileAlt/></div>
                <h3>Documents</h3>
                <p>Manage all documents</p>
              </div>

              <div
                className="card logs"
                onClick={() => navigate("/logs")}
              >
                <div className="card-icon"><FaChartBar/></div>
                <h3>Logs</h3>
                <p>View system activity</p>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}

export default Dashboard;