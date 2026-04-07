import React from "react";
import "./Logs.css";
import Navbar from "../components/Navbar";

function Logs() {

  // 🔹 Dummy log data
  const logs = [
    { id: 1, user: "Abi", action: "Uploaded file", status: "Success", time: "10:30 AM" },
    { id: 2, user: "John", action: "Downloaded file", status: "Success", time: "11:00 AM" },
    { id: 3, user: "Sara", action: "Deleted file", status: "Failed", time: "11:15 AM" }
  ];

  return (
    <>
    <Navbar />
    <div className="logs-container">
      <div className="logs-card">
        <h2>System Logs</h2>

        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.user}</td>
                <td>{log.action}</td>
                <td className={log.status === "Success" ? "success" : "failed"}>
                  {log.status}
                </td>
                <td>{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
    </>
  );
}

export default Logs;