import React from "react";
import "./Documents.css";
import Navbar from "../components/Navbar";

function Documents() {

  // 🔹 Dummy data (for now)
  const documents = [
    { id: 1, name: "Report.pdf", uploadedBy: "Abi" },
    { id: 2, name: "Project.docx", uploadedBy: "John" },
    { id: 3, name: "Data.xlsx", uploadedBy: "Sara" }
  ];

  return (
    <>
    <Navbar />
    <div className="documents-container">
      <div className="documents-card">
        <h2>Documents</h2>

        <table>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Uploaded By</th>
              <th>Download</th>
            </tr>
          </thead>

          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.name}</td>
                <td>{doc.uploadedBy}</td>
                <td>
                  <button className="download-btn">
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
    </>
  );
}

export default Documents;