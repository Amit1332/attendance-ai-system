import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogIn, UserPlus, Eye, EyeOff, ShieldAlert } from "lucide-react";

export const AuthView: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("STAFF");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ firstName, lastName, email, password, role });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.cardWrapper} className="animate-fade-in">
        <div style={styles.glowingBackground}></div>
        <div className="card glow-card" style={styles.card}>
          <div style={styles.header}>
            <h2 style={styles.title}>Attendance AI</h2>
            <p style={styles.subtitle}>Smart HR & Policy Knowledge Engine</p>
          </div>

          {/* Tab Selection */}
          <div style={styles.tabContainer}>
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              style={{
                ...styles.tab,
                ...(isLogin ? styles.activeTab : {}),
              }}
            >
              <LogIn size={16} /> Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              style={{
                ...styles.tab,
                ...(!isLogin ? styles.activeTab : {}),
              }}
            >
              <UserPlus size={16} /> Register
            </button>
          </div>

          {error && (
            <div style={styles.errorBanner}>
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {!isLogin && (
              <div style={styles.row}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.passwordInput}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Organizational Role</label>
                <select
                  className="input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={styles.select}
                >
                  <option value="STAFF">Staff (Employee)</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={styles.submitBtn}
            >
              {loading ? "Authenticating..." : isLogin ? "Access Dashboard" : "Register Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    width: "100vw",
    padding: "20px",
    background: "radial-gradient(circle at top, #141521, #08090e)",
  },
  cardWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "460px",
  },
  glowingBackground: {
    position: "absolute",
    top: "-15px",
    left: "-15px",
    right: "-15px",
    bottom: "-15px",
    background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(20px)",
    zIndex: -1,
  },
  card: {
    padding: "40px 32px",
    textAlign: "center",
    background: "rgba(18, 19, 26, 0.75)",
    backdropFilter: "blur(20px)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  header: {
    marginBottom: "28px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    background: "linear-gradient(90deg, #6366f1, #06b6d4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#6b7280",
  },
  tabContainer: {
    display: "flex",
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    borderRadius: "8px",
    padding: "4px",
    marginBottom: "24px",
  },
  tab: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "transparent",
    border: "none",
    color: "#9ca3af",
    padding: "10px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  activeTab: {
    background: "rgba(99, 102, 241, 0.1)",
    color: "#6366f1",
    border: "1px solid rgba(99, 102, 241, 0.15)",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    color: "#ef4444",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "13px",
    textAlign: "left",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  row: {
    display: "flex",
    gap: "16px",
  },
  passwordWrapper: {
    position: "relative",
    width: "100%",
  },
  passwordInput: {
    paddingRight: "44px",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  select: {
    cursor: "pointer",
  },
  submitBtn: {
    marginTop: "12px",
    width: "100%",
    padding: "12px",
  },
};
