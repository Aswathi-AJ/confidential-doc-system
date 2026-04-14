// client/src/components/ConfirmModal.jsx
import { FaExclamationTriangle } from "react-icons/fa";

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.8)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
      animation: "fadeIn 0.2s ease-out"
    }}>
      <div style={{
        background: "#1e1e2e",
        borderRadius: "16px",
        padding: "28px",
        width: "90%",
        maxWidth: "400px",
        textAlign: "center",
        border: "1px solid rgba(167, 139, 250, 0.3)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        animation: "scaleIn 0.2s ease-out"
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          background: "rgba(245, 158, 11, 0.15)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px"
        }}>
          <FaExclamationTriangle size={24} color="#fbbf24" />
        </div>
        <h3 style={{ color: "#f0f9ff", fontSize: "18px", marginBottom: "8px" }}>{title}</h3>
        <p style={{ color: "#a5b4fc", fontSize: "13px", marginBottom: "24px" }}>{message}</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 24px",
              background: "rgba(148, 163, 184, 0.2)",
              color: "#e0e0e0",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500"
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 24px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600"
            }}
          >
            Confirm
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ConfirmModal;