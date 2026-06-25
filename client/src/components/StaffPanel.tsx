import React, { useEffect, useState, useRef } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  Clock,
  Play,
  Square,
  Calendar,
  Bot,
  Send,
  Loader,
  TrendingUp
} from "lucide-react";

interface StaffPanelProps {
  activeTab: string;
}

const formatHours = (hours: number | null | undefined): string => {
  if (hours === null || hours === undefined) return "-";
  if (hours === 0) return "0 min";
  const totalMinutes = Math.round(hours * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs > 0) {
    return mins > 0 ? `${hrs}hr ${mins} min` : `${hrs}hr`;
  }
  return `${mins} min`;
};

export const StaffPanel: React.FC<StaffPanelProps> = ({ activeTab }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [activeCheckIn, setActiveCheckIn] = useState<any>(null);
  const [timerString, setTimerString] = useState("00:00:00");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const intervalRef = useRef<any>(null);

  // Chat States - Policy AI Chat
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: "assistant", content: "Hello! Ask me any questions about company policies, leave allowances, or code of conduct." },
  ]);

  // Fetches
  const fetchHistory = async () => {
    try {
      const response = await api.get("/attendance/my-history");
      const records = response.data.data;
      setHistory(records);

      // Check if there is an active check-in (where checkOut is null)
      const active = records.find((r: any) => r.checkOut === null);
      if (active) {
        setActiveCheckIn(active);
      } else {
        setActiveCheckIn(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === "attendance-history" || activeTab === "dashboard" || activeTab === "check-in-out") {
      fetchHistory();
    }
  }, [activeTab]);

  // Handle active check-in timer
  useEffect(() => {
    if (activeCheckIn) {
      const startTime = new Date(activeCheckIn.checkIn).getTime();

      const updateTimer = () => {
        const diff = Date.now() - startTime;
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);

        setTimerString(
          `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
        );
      };

      updateTimer();
      intervalRef.current = setInterval(updateTimer, 1000);
    } else {
      setTimerString("00:00:00");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeCheckIn]);

  // Check In Trigger
  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      const response = await api.post("/attendance/check-in");
      const newRecord = response.data.data;
      setActiveCheckIn(newRecord);
      setHistory((prev) => [newRecord, ...prev]);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to check in");
    } finally {
      setActionLoading(false);
    }
  };

  // Check Out Trigger
  const handleClockOut = async () => {
    if (!confirm("Are you sure you want to Check Out?")) return;
    setActionLoading(true);
    try {
      const response = await api.post("/attendance/check-out");
      const updatedRecord = response.data.data;
      setActiveCheckIn(null);
      setHistory((prev) =>
        prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to check out");
    } finally {
      setActionLoading(false);
    }
  };

  // Chat submit - policy RAG
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setLoading(true);

    try {
      const response = await api.post("/ai/ask-policy", { question: userMessage.content });
      setChatMessages((prev) => [...prev, { role: "assistant", content: response.data.data.answer }]);
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Error: " + (err.response?.data?.message || "Failed to query policies") }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Tab: Dashboard */}
      {activeTab === "dashboard" && (
        <div style={styles.content}>
          {/* Quick Metrics */}
          <div className="grid grid-3">
            <div className="card glow-card" style={styles.statsCard}>
              <div style={styles.statsIconWrapper}><Clock color="var(--primary)" /></div>
              <div>
                <div style={styles.statsLabel}>Total Hours Logged</div>
                <div style={styles.statsValue}>
                  {formatHours(history.reduce((acc, curr) => acc + (curr.workingHours || 0), 0))}
                </div>
              </div>
            </div>
            <div className="card" style={styles.statsCard}>
              <div style={{ ...styles.statsIconWrapper, background: "var(--success-glow)" }}><TrendingUp color="var(--success)" /></div>
              <div>
                <div style={styles.statsLabel}>Total Overtime Logged</div>
                <div style={styles.statsValue}>
                  {formatHours(history.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0))}
                </div>
              </div>
            </div>
            <div className="card" style={styles.statsCard}>
              <div style={{ ...styles.statsIconWrapper, background: "var(--warning-glow)" }}><Calendar color="var(--warning)" /></div>
              <div>
                <div style={styles.statsLabel}>Total Shifts Completed</div>
                <div style={styles.statsValue}>
                  {history.filter(r => r.checkOut !== null).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Check In/Out */}
      {activeTab === "check-in-out" && (
        <div style={styles.content}>
          {/* Clock In Panel */}
          <div className="card glow-card" style={styles.clockCard}>
            <div style={styles.clockSection}>
              <div style={styles.clockTime}>{timerString}</div>
              <div style={styles.clockLabel}>
                {activeCheckIn ? `Currently Shift Active (Checked In at ${new Date(activeCheckIn.checkIn).toLocaleTimeString()})` : "Shift Offline"}
              </div>

              <div style={styles.clockButtons}>
                {!activeCheckIn ? (
                  <button
                    className="btn btn-primary"
                    onClick={handleClockIn}
                    disabled={actionLoading}
                    style={{ ...styles.clockBtn, background: "var(--success)", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}
                  >
                    <Play size={18} />
                    <span>Check In / Start Shift</span>
                  </button>
                ) : (
                  <button
                    className="btn btn-danger"
                    onClick={handleClockOut}
                    disabled={actionLoading}
                    style={styles.clockBtn}
                  >
                    <Square size={18} />
                    <span>Check Out / End Shift</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Attendance History */}
      {activeTab === "attendance-history" && (
        <div style={styles.content}>
          <h3 style={styles.sectionTitle}>Your Check-In Logs</h3>
          <div className="card" style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Check-In</th>
                  <th style={styles.th}>Check-Out</th>
                  <th style={styles.th}>Hours Worked</th>
                  <th style={styles.th}>Overtime</th>
                </tr>
              </thead>
              <tbody>
                {history.map((a) => (
                  <tr key={a.id} style={styles.tr}>
                    <td style={styles.td}><strong>{new Date(a.checkIn).toLocaleDateString()}</strong></td>
                    <td style={styles.td}>{new Date(a.checkIn).toLocaleTimeString()}</td>
                    <td style={styles.td}>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : <span className="status-badge active">Online</span>}</td>
                    <td style={styles.td}>{formatHours(a.workingHours)}</td>
                    <td style={styles.td}>
                      {a.overtimeHours > 0 ? (
                        <span className="status-badge warning">{formatHours(a.overtimeHours)} Overtime</span>
                      ) : (
                        "0 min"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: AI Policy Chatbot */}
      {activeTab === "ai-policy-assistant" && (
        <div style={styles.content}>
          <h3 style={styles.sectionTitle}>AI Policy Assistant</h3>
          
          <div className="card" style={styles.chatCard}>
            <div style={styles.chatHeader}>
              <Bot size={22} color="var(--primary)" />
              <div style={{ textAlign: "left" }}>
                <div style={styles.chatTitle}>Company Knowledge Base Bot</div>
                <div style={styles.chatStatus}>Answers questions using employee handbook and policy docs</div>
              </div>
            </div>
            
            <div style={styles.chatBody}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{
                  ...styles.chatMessage,
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  background: msg.role === "user" ? "var(--primary)" : "rgba(255,255,255,0.03)",
                  border: msg.role === "user" ? "none" : "1px solid var(--border)",
                }}>
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div style={{ ...styles.chatMessage, alignSelf: "flex-start", background: "transparent", display: "flex", gap: "8px" }}>
                  <Loader className="pulse-glow" size={16} /> Thinking...
                </div>
              )}
            </div>
            
            <form onSubmit={handleSendChatMessage} style={styles.chatFooter}>
              <input type="text" className="input" placeholder="e.g. How many days of paid leaves do we get?" value={chatInput} onChange={e => setChatInput(e.target.value)} />
              <button type="submit" className="btn btn-primary" style={styles.sendBtn}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: My Profile */}
      {activeTab === "profile" && user && (
        <div style={styles.content}>
          <h3 style={styles.sectionTitle}>Employee Profile</h3>
          
          <div className="card" style={styles.profileCard}>
            <div style={styles.profileHeader}>
              <div style={styles.avatarLarge}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div style={{ textAlign: "left" }}>
                <h4 style={styles.profileName}>{user.firstName} {user.lastName}</h4>
                <div style={styles.profileRoleBadge}>{user.role}</div>
              </div>
            </div>

            <div style={styles.profileDetailsGrid} className="grid grid-2">
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>Email Address</div>
                <div style={styles.detailValue}>{user.email}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>Phone Number</div>
                <div style={styles.detailValue}>{user.phone || "Not Configured"}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>Employment Status</div>
                <div style={styles.detailValue}>
                  <span className={`status-badge ${user.isActive ? "active" : "inactive"}`}>
                    {user.isActive ? "online" : "offline"}
                  </span>
                </div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>Employee ID</div>
                <div style={styles.detailValue}><code>{user.id}</code></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "32px",
    width: "100%",
    height: "100%",
    overflowY: "auto",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  sectionTitle: {
    fontSize: "22px",
    fontWeight: 600,
    color: "var(--text-primary)",
    textAlign: "left",
  },
  statsCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    textAlign: "left",
  },
  statsIconWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    background: "var(--primary-glow)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statsLabel: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  statsValue: {
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  clockCard: {
    padding: "48px 32px",
    background: "rgba(18, 19, 26, 0.4)",
    backdropFilter: "blur(20px)",
  },
  clockSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  clockTime: {
    fontSize: "64px",
    fontWeight: 800,
    letterSpacing: "2px",
    background: "linear-gradient(90deg, #6366f1, #06b6d4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  clockLabel: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  clockButtons: {
    marginTop: "16px",
  },
  clockBtn: {
    padding: "16px 36px",
    fontSize: "16px",
    borderRadius: "30px",
  },
  tableCard: {
    padding: 0,
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "14px",
  },
  th: {
    padding: "16px 24px",
    background: "rgba(255, 255, 255, 0.01)",
    borderBottom: "1px solid var(--border)",
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  tr: {
    borderBottom: "1px solid var(--border)",
  },
  td: {
    padding: "16px 24px",
    color: "var(--text-primary)",
  },
  chatCard: {
    display: "flex",
    flexDirection: "column",
    height: "500px",
    padding: 0,
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "20px 24px",
    borderBottom: "1px solid var(--border)",
  },
  chatTitle: {
    fontSize: "15px",
    fontWeight: 600,
  },
  chatStatus: {
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  chatBody: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  chatMessage: {
    maxWidth: "75%",
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    textAlign: "left",
    lineHeight: "1.4",
  },
  chatFooter: {
    display: "flex",
    gap: "12px",
    padding: "20px 24px",
    borderTop: "1px solid var(--border)",
  },
  sendBtn: {
    padding: "12px",
  },
  profileCard: {
    padding: "40px",
    textAlign: "left",
  },
  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "32px",
    marginBottom: "32px",
  },
  avatarLarge: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "var(--primary-glow)",
    border: "2px solid rgba(99,102,241,0.3)",
    color: "var(--primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "28px",
  },
  profileName: {
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "8px",
  },
  profileRoleBadge: {
    display: "inline-block",
    background: "rgba(99,102,241,0.12)",
    color: "var(--primary)",
    padding: "4px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  profileDetailsGrid: {
    gap: "24px 40px",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  detailLabel: {
    fontSize: "13px",
    color: "var(--text-secondary)",
  },
  detailValue: {
    fontSize: "16px",
    fontWeight: 500,
    color: "var(--text-primary)",
  },
};
export default StaffPanel;
