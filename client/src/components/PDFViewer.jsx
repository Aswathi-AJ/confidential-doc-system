// client/src/components/PDFViewer.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Toast from "./Toast";
import { 
  FaLock, 
  FaShieldAlt, 
  FaTimes, 
  FaMinus, 
  FaPlus, 
  FaUndo,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

function PDFViewer({ docId, filename, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [toast, setToast] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pdfDocumentRef = useRef(null);
  const renderTaskRef = useRef(null);
  const isRenderingRef = useRef(false);
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  // Cancel any ongoing render task
  const cancelRender = useCallback(async () => {
    if (renderTaskRef.current) {
      try {
        await renderTaskRef.current.cancel();
      } catch (err) {
        // Ignore cancellation errors
      }
      renderTaskRef.current = null;
    }
    isRenderingRef.current = false;
  }, []);

  // Render the current page
  const renderCurrentPage = useCallback(async () => {
    const pdf = pdfDocumentRef.current;
    const canvas = canvasRef.current;
    
    if (!pdf || !canvas || isRenderingRef.current) return;

    await cancelRender();
    isRenderingRef.current = true;

    try {
      const page = await pdf.getPage(currentPage);
      const context = canvas.getContext('2d');
 
      let finalScale = scale;

      const scaledViewport = page.getViewport({ scale: finalScale });

      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;
      isRenderingRef.current = false;

    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error("Error rendering page:", err);
        setError("Failed to render page");
      }
      isRenderingRef.current = false;
    }
  }, [currentPage, scale, cancelRender]);

  // Load PDF document
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await fetch(`http://localhost:5000/api/documents/download/${docId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error("Failed to fetch document");

        const arrayBuffer = await response.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        pdfDocumentRef.current = pdf;
        setNumPages(pdf.numPages);

      } catch (err) {
        console.error("Error loading document:", err);
        setError("Failed to load the secure document");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();

    return () => {
      cancelRender();
      if (pdfDocumentRef.current) {
        pdfDocumentRef.current.destroy();
        pdfDocumentRef.current = null;
      }
    };
  }, [docId, cancelRender]);

  // Render when PDF is loaded or page/scale changes
  useEffect(() => {
    if (pdfDocumentRef.current && !loading) {
      renderCurrentPage();
    }
  }, [loading, currentPage, scale, renderCurrentPage]);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 2.5));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  // Security: Disable print, save, right-click, etc. - Using Toast instead of alert
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u')) || 
        e.key === 'F12' || e.key === 'PrintScreen') {
      e.preventDefault();
      setToast({ message: "This action is disabled for security reasons.", type: "warning" });
    }
  }, []);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setToast({ message: "Right-click is disabled for security reasons.", type: "warning" });
  };

  const handleBeforePrint = (e) => {
    e.preventDefault();
    setToast({ message: "Printing is disabled for security reasons.", type: "warning" });
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handleBeforePrint);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handleBeforePrint);
      document.removeEventListener('contextmenu', handleContextMenu);
      cancelRender();
    };
  }, [handleKeyDown, cancelRender]);

  const scalePercent = `${Math.round(scale * 100)}%`;

  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "#0a0a14",
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
      color: "#f0f9ff",
    },

    backgroundLayer: {
      position: "absolute",
      inset: 0,
      background: `
        radial-gradient(circle at 30% 25%, rgba(103, 232, 249, 0.08) 0%, transparent 55%),
        radial-gradient(circle at 70% 75%, rgba(167, 139, 250, 0.06) 0%, transparent 55%)
      `,
      pointerEvents: "none",
    },

    holographicGrid: {
      position: "absolute",
      inset: 0,
      backgroundImage: `
        linear-gradient(rgba(103,232,249,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(103,232,249,0.03) 1px, transparent 1px)
      `,
      backgroundSize: "40px 40px",
      animation: "holoScan 15s linear infinite",
      pointerEvents: "none",
    },

    header: {
      background: "rgba(15, 15, 35, 0.96)",
      backdropFilter: "blur(16px)",
      padding: "12px 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid rgba(167, 139, 250, 0.3)",
      position: "sticky",
      top: 0,
      zIndex: 2001,
    },

    title: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#c4b5fd",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      maxWidth: "70%",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },

    closeBtn: {
      background: "#f87171",
      color: "white",
      border: "none",
      padding: "6px 18px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "12px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },

    viewerArea: {
      flex: 1,
      overflow: "auto",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      padding: "20px",
      background: "#0f0f1a",
    },

    canvasContainer: {
      background: "#ffffff",
      borderRadius: "8px",
      boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
      overflow: "hidden",
    },

    controls: {
      background: "rgba(15, 15, 35, 0.95)",
      backdropFilter: "blur(12px)",
      padding: "10px 20px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "20px",
      borderTop: "1px solid rgba(167, 139, 250, 0.25)",
      position: "sticky",
      bottom: 0,
      zIndex: 2001,
    },

    zoomGroup: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      background: "rgba(30,30,60,0.8)",
      padding: "4px 14px",
      borderRadius: "30px",
    },

    zoomBtn: {
      background: "#7c3aed",
      color: "white",
      border: "none",
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    zoomBtnDisabled: {
      background: "#475569",
      color: "#94a3b8",
      cursor: "not-allowed",
    },

    scaleInfo: {
      color: "#c4b5fd",
      fontSize: "13px",
      fontWeight: "600",
      minWidth: "50px",
      textAlign: "center",
    },

    pageGroup: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      background: "rgba(30,30,60,0.8)",
      padding: "4px 18px",
      borderRadius: "30px",
    },

    pageBtn: {
      background: "#7c3aed",
      color: "white",
      border: "none",
      padding: "6px 14px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      gap: "5px",
    },

    pageBtnDisabled: {
      background: "#475569",
      color: "#94a3b8",
      cursor: "not-allowed",
    },

    pageInfo: {
      color: "#c4b5fd",
      fontSize: "13px",
      fontWeight: "600",
    },

    adminNote: {
      position: "fixed",
      bottom: "70px",
      left: "20px",
      background: "rgba(248,113,113,0.12)",
      color: "#fca5a5",
      padding: "5px 12px",
      borderRadius: "16px",
      fontSize: "10px",
      zIndex: 2002,
      backdropFilter: "blur(8px)",
    },

    loadingState: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      color: "#67e8f9",
    },

    errorState: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      color: "#fca5a5",
      textAlign: "center",
    },
  };

  if (loading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.backgroundLayer} />
        <div style={styles.holographicGrid} />
        <div style={styles.loadingState}>
          <div style={{ fontSize: "40px", marginBottom: "16px", animation: "spin 1s linear infinite" }}>⏳</div>
          <p>Loading secure encrypted document...</p>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes holoScan {
            0% { background-position: 0 0; }
            100% { background-position: 80px 80px; }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.overlay}>
        <div style={styles.backgroundLayer} />
        <div style={styles.holographicGrid} />
        <div style={styles.errorState}>
          <FaShieldAlt size={48} color="#fca5a5" style={{ marginBottom: "16px" }} />
          <p style={{ fontSize: "14px", marginBottom: "20px" }}>{error}</p>
          <button onClick={onClose} style={styles.closeBtn}>
            <FaTimes size={12} /> Close Viewer
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={styles.overlay} onContextMenu={handleContextMenu}>
        <div style={styles.backgroundLayer} />
        <div style={styles.holographicGrid} />

        <div style={styles.header}>
          <div style={styles.title}>
            <FaLock size={12} color="#67e8f9" /> {filename}
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <FaTimes size={12} /> Close
          </button>
        </div>

        <div style={styles.viewerArea} ref={containerRef}>
          <div style={styles.canvasContainer}>
            <canvas ref={canvasRef} />
          </div>
        </div>

        <div style={styles.controls}>
          <div style={styles.zoomGroup}>
            <button 
              onClick={zoomOut} 
              disabled={scale <= 0.5} 
              style={scale <= 0.5 ? styles.zoomBtnDisabled : styles.zoomBtn}
              title="Zoom Out (Ctrl -)"
            >
              <FaMinus size={12} />
            </button>
            <span style={styles.scaleInfo}>{scalePercent}</span>
            <button 
              onClick={zoomIn} 
              disabled={scale >= 2.5} 
              style={scale >= 2.5 ? styles.zoomBtnDisabled : styles.zoomBtn}
              title="Zoom In (Ctrl +)"
            >
              <FaPlus size={12} />
            </button>
            <button 
              onClick={resetZoom} 
              style={{ ...styles.zoomBtn, background: "#475569" }}
              title="Reset Zoom (Ctrl 0)"
            >
              <FaUndo size={12} />
            </button>
          </div>

          <div style={styles.pageGroup}>
            <button 
              onClick={goToPreviousPage} 
              disabled={currentPage <= 1} 
              style={currentPage <= 1 ? styles.pageBtnDisabled : styles.pageBtn}
              title="Previous Page"
            >
              <FaChevronLeft size={10} /> Prev
            </button>
            <span style={styles.pageInfo}>
              Page {currentPage} of {numPages}
            </span>
            <button 
              onClick={goToNextPage} 
              disabled={currentPage >= numPages} 
              style={currentPage >= numPages ? styles.pageBtnDisabled : styles.pageBtn}
              title="Next Page"
            >
              Next <FaChevronRight size={10} />
            </button>
          </div>
        </div>

        {!isAdmin && (
          <div style={styles.adminNote}>
            <FaLock size={8} /> Print, Save, and Right-click are disabled
          </div>
        )}

        <style jsx>{`
          @keyframes holoScan {
            0% { background-position: 0 0; }
            100% { background-position: 80px 80px; }
          }
        `}</style>
      </div>
    </>
  );
}

export default PDFViewer;