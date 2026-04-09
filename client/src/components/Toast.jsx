// client/src/components/Toast.jsx
import { useEffect } from "react";
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaTimesCircle,
  FaTimes
} from "react-icons/fa";

function Toast({ message, type, onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = {
    success: {
      bg: "linear-gradient(135deg, #10b981, #059669)",
      icon: <FaCheckCircle size={18} />,
      borderColor: "#34d399"
    },
    error: {
      bg: "linear-gradient(135deg, #ef4444, #dc2626)",
      icon: <FaTimesCircle size={18} />,
      borderColor: "#f87171"
    },
    warning: {
      bg: "linear-gradient(135deg, #f59e0b, #d97706)",
      icon: <FaExclamationTriangle size={18} />,
      borderColor: "#fbbf24"
    },
    info: {
      bg: "linear-gradient(135deg, #3b82f6, #2563eb)",
      icon: <FaInfoCircle size={18} />,
      borderColor: "#60a5fa"
    }
  };

  const current = config[type] || config.info;

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 10000,
      animation: "slideInRight 0.3s ease-out"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "#1e1e2e",
        borderLeft: `4px solid ${current.borderColor}`,
        padding: "12px 20px",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        minWidth: "280px",
        maxWidth: "400px",
        backdropFilter: "blur(10px)"
      }}>
        <span style={{ color: current.borderColor }}>{current.icon}</span>
        <span style={{ color: "#e0e0e0", fontSize: "13px", flex: 1 }}>{message}</span>
        <button 
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#9ca3af",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "4px"
          }}
        >
          <FaTimes size={12} />
        </button>
      </div>
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default Toast;