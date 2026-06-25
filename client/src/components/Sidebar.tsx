import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Brain,
  BookOpen,
  Search,
  LogOut,
  Clock,
  User,
  Activity,
  BarChart3,
  Settings
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const role = user.role;

  // Define menu items based on role
  const menuItems = {
    ADMIN: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
      { id: "users", label: "Users", icon: <Users size={20} /> },
      { id: "attendance", label: "Attendance", icon: <Calendar size={20} /> },
      { id: "ai-assistant", label: "AI Assistant", icon: <Brain size={20} /> },
      { id: "knowledge-base", label: "Knowledge Base", icon: <BookOpen size={20} /> },
      { id: "reports", label: "Reports", icon: <BarChart3 size={20} /> },
      { id: "settings", label: "Settings", icon: <Settings size={20} /> },
    ],
    MANAGER: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
      { id: "staff", label: "Staff", icon: <Users size={20} /> },
      { id: "attendance", label: "Attendance", icon: <Calendar size={20} /> },
      { id: "ai-reports", label: "AI Reports", icon: <Brain size={20} /> },
      { id: "ai-search", label: "AI Search", icon: <Search size={20} /> },
    ],
    STAFF: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
      { id: "check-in-out", label: "Clock In/Out", icon: <Clock size={20} /> },
      { id: "attendance-history", label: "My History", icon: <Calendar size={20} /> },
      { id: "ai-policy-assistant", label: "AI Policy Chat", icon: <Brain size={20} /> },
      { id: "profile", label: "My Profile", icon: <User size={20} /> },
    ],
  };

  const items = menuItems[role] || [];

  return (
    <div style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brand}>
        <Activity size={24} color="#6366f1" />
        <span style={styles.brandText}>AttendenceAI</span>
      </div>

      {/* Nav Menu */}
      <nav style={styles.nav}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              ...styles.navButton,
              ...(activeTab === item.id ? styles.activeButton : {}),
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div style={styles.footer}>
        <div style={styles.userProfile}>
          <div style={styles.userAvatar}>
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div style={styles.userDetails}>
            <div style={styles.userName}>
              {user.firstName} {user.lastName}
            </div>
            <div style={styles.userRole}>{user.role}</div>
          </div>
        </div>
        <button onClick={logout} style={styles.logoutButton}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "260px",
    background: "var(--bg-sidebar)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "24px",
    borderBottom: "1px solid var(--border)",
  },
  brandText: {
    fontSize: "20px",
    fontWeight: 700,
    background: "linear-gradient(90deg, #6366f1, #06b6d4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  nav: {
    flex: 1,
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  navButton: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "transparent",
    border: "none",
    color: "var(--text-secondary)",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    transition: "var(--transition)",
  },
  activeButton: {
    background: "rgba(99, 102, 241, 0.08)",
    color: "var(--primary)",
    fontWeight: 600,
  },
  footer: {
    padding: "20px 16px",
    borderTop: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  userProfile: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "var(--primary-glow)",
    border: "1px solid rgba(99,102,241,0.2)",
    color: "var(--primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: "14px",
  },
  userDetails: {
    display: "flex",
    flexDirection: "column",
  },
  userName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  userRole: {
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    color: "var(--danger)",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "var(--transition)",
  },
};
export default Sidebar;
