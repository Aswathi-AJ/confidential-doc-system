import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

function Dashboard() {

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">

      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="dashboard-content">
        <h3>Welcome to Confidential Document System</h3>

        <div className="dashboard-actions">
          <button>Upload Document</button>
          <button>View Documents</button>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;