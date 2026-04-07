import React, { useState } from "react";
import Navbar from "../components/Navbar";
import "./Upload.css";

function Upload() {
  const [file, setFile] = useState(null);

  return (
    <>
      <Navbar />

      <div className="upload-container">
        <div className="upload-card">

          <h2>Upload Document</h2>
          <p className="subtitle">Upload secure files (PDF, DOC, etc.)</p>

          {/* Drag & Drop Box */}
          <label className="drop-area">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <div className="drop-content">
              <p className="icon">📂</p>
              <p>
                {file ? file.name : "Drag & Drop your file here"}
              </p>
              <span>or click to browse</span>
            </div>
          </label>

          {/* Upload Button */}
          <button className="upload-btn">
            Upload File
          </button>

        </div>
      </div>
    </>
  );
}

export default Upload;