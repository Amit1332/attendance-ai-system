import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import AdminPanel from "../components/AdminPanel";
import ManagerPanel from "../components/ManagerPanel";
import StaffPanel from "../components/StaffPanel";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { Sparkles } from "lucide-react";

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const { stats } = useSocket();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!user) return null;

  return (
    <div style={styles.container}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Panel Content */}
      <div style={styles.mainWrapper}>
        {/* Top Header */}
        <header style={styles.header}>
          <div style={styles.headerWelcome}>
            <h1 style={styles.heading}>
              Good day, {user.firstName}! <Sparkles size={16} color="var(--warning)" style={{ display: "inline-block" }} />
            </h1>
          </div>

          <div style={styles.headerActions}>
            {/* Live Indicator Banner */}
            <div style={styles.statsBadge}>
              <div style={styles.liveDot} className="pulse-glow" />
              <span style={styles.statsText}>
                <strong>{stats.onlineCount}</strong> online • <strong>{stats.offlineCount}</strong> offline
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Panel Render based on User Role */}
        <main style={styles.main}>
          {user.role === "ADMIN" && <AdminPanel activeTab={activeTab} />}
          {user.role === "MANAGER" && <ManagerPanel activeTab={activeTab} />}
          {user.role === "STAFF" && <StaffPanel activeTab={activeTab} />}
        </main>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    width: "100%",
    height: "100vh",
    overflow: "hidden",
    background: "#0a0b10",
  },
  mainWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  header: {
    height: "80px",
    background: "var(--bg-header)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid var(--border)",
    padding: "0 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  headerWelcome: {
    textAlign: "left",
  },
  heading: {
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  subtitle: {
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  statsBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid var(--border)",
    padding: "8px 16px",
    borderRadius: "20px",
  },
  liveDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "var(--success)",
    boxShadow: "0 0 8px var(--success)",
  },
  statsText: {
    fontSize: "12px",
    color: "var(--text-secondary)",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "var(--transition)",
  },
  main: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
};
export default DashboardView;
