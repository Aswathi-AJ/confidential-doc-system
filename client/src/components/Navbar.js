import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import { FaBars } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);  // ✅ toggle menu

  const token = localStorage.getItem("token");

  let role = "";
  if (token) {
    const decoded = JSON.parse(atob(token.split(".")[1]));
    role = decoded.role;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="navbar">
      <h2 className="logo">DocSystem</h2>

      {/* ☰ Hamburger Icon */}
      <div className="menu-icon" onClick={() => setOpen(!open)}>
        <FaBars />
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div className="menu">

          <p onClick={() => navigate("/dashboard")}>Dashboard</p>

          {/* Viewer */}
          {role === "viewer" && (
            <p onClick={() => navigate("/documents")}>Documents</p>
          )}

          {/* Officer */}
          {role === "officer" && (
            <>
              <p onClick={() => navigate("/upload")}>Upload</p>
              <p onClick={() => navigate("/documents")}>Documents</p>
            </>
          )}

          {/* Admin */}
          {role === "admin" && (
            <>
              <p onClick={() => navigate("/documents")}>Documents</p>
              <p onClick={() => navigate("/logs")}>Logs</p>
            </>
          )}

          <p className="logout" onClick={handleLogout}>
            Logout
          </p>

        </div>
      )}
    </div>
  );
}

export default Navbar;