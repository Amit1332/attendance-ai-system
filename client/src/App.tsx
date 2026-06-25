import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { AuthView } from "./views/AuthView";
import { DashboardView } from "./views/DashboardView";
import { Loader } from "lucide-react";

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader className="pulse-glow" size={36} color="var(--primary)" />
        <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Initializing security session...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <SocketProvider>
      <DashboardView />
    </SocketProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const styles = {
  loadingContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    width: "100vw",
    height: "100vh",
    background: "#0a0b10",
  },
};

export default App;
