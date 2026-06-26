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
  TrendingUp,
  ChevronDown,
  ChevronUp
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

const renderFormattedContent = (content: string) => {
  if (!content) return null;

  const formatInlineText = (text: string) => {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    const html = escaped
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
      .replace(/`(.*?)`/g, "<code style='background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px; font-family: monospace;'>$1</code>");

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  
  let currentTable: { headers: string[]; rows: string[][] } | null = null;
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const pushCurrentCollections = (key: string) => {
    if (currentTable) {
      elements.push(
        <div key={`table-${key}`} style={{ overflowX: "auto", margin: "12px 0", maxWidth: "100%" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid var(--border)", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                {currentTable.headers.map((h, i) => (
                  <th key={i} style={{ padding: "8px 12px", border: "1px solid var(--border)", fontWeight: "600" }}>
                    {formatInlineText(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTable.rows.map((row, rowIndex) => (
                <tr key={rowIndex} style={{ borderBottom: "1px solid var(--border)" }}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} style={{ padding: "8px 12px", border: "1px solid var(--border)" }}>
                      {formatInlineText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
    
    if (currentList) {
      const Tag = currentList.type;
      elements.push(
        <Tag key={`list-${key}`} style={{ margin: "8px 0 8px 24px", paddingLeft: "0", textAlign: "left" }}>
          {currentList.items.map((item, itemIndex) => (
            <li key={itemIndex} style={{ margin: "4px 0", listStyleType: currentList?.type === "ol" ? "decimal" : "disc" }}>
              {formatInlineText(item)}
            </li>
          ))}
        </Tag>
      );
      currentList = null;
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim();

    if (line.startsWith("|") && line.endsWith("|")) {
      pushCurrentCollections(String(idx));
      
      const cells = line.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
      const isSeparator = cells.every(c => c.match(/^:-*-?:*$/) || c.startsWith("-"));
      
      if (isSeparator) {
        continue;
      }

      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    }

    if (currentTable && (!line.startsWith("|") || !line.endsWith("|"))) {
      pushCurrentCollections(String(idx));
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const itemText = line.substring(2);
      if (!currentList || currentList.type !== "ul") {
        pushCurrentCollections(String(idx));
        currentList = { type: "ul", items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      const itemText = olMatch[2];
      if (!currentList || currentList.type !== "ol") {
        pushCurrentCollections(String(idx));
        currentList = { type: "ol", items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    if (currentList) {
      pushCurrentCollections(String(idx));
    }

    if (line === "") {
      elements.push(<div key={`blank-${idx}`} style={{ height: "8px" }} />);
    } else {
      elements.push(
        <p key={`p-${idx}`} style={{ margin: "4px 0", lineHeight: "1.5", textAlign: "left" }}>
          {formatInlineText(line)}
        </p>
      );
    }
  }

  pushCurrentCollections("end");

  return <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>{elements}</div>;
};

export const StaffPanel: React.FC<StaffPanelProps> = ({ activeTab }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [activeCheckIn, setActiveCheckIn] = useState<any>(null);

  // Group history by date
  const groupedHistory = React.useMemo(() => {
    const groups: { [key: string]: any } = {};
    history.forEach((record) => {
      const date = new Date(record.checkIn);
      const dateKey = date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateKey,
          earliestCheckIn: date,
          latestCheckOut: record.checkOut ? new Date(record.checkOut) : null,
          totalWorkingHours: record.workingHours || 0,
          totalOvertimeHours: record.overtimeHours || 0,
          sessions: [record],
          isOngoing: record.checkOut === null,
        };
      } else {
        const g = groups[dateKey];
        g.sessions.push(record);
        
        // Update earliest check-in
        if (date < g.earliestCheckIn) {
          g.earliestCheckIn = date;
        }
        
        // Update latest check-out
        if (record.checkOut === null) {
          g.isOngoing = true;
          g.latestCheckOut = null;
        } else if (!g.isOngoing) {
          const checkOutDate = new Date(record.checkOut);
          if (!g.latestCheckOut || checkOutDate > g.latestCheckOut) {
            g.latestCheckOut = checkOutDate;
          }
        }
        
        g.totalWorkingHours += record.workingHours || 0;
        g.totalOvertimeHours += record.overtimeHours || 0;
      }
    });
    
    // Sort descending by date
    return Object.values(groups).sort((a: any, b: any) => b.earliestCheckIn.getTime() - a.earliestCheckIn.getTime());
  }, [history]);
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
                {groupedHistory.map((item) => {
                  const isExpanded = expandedDate === item.dateKey;
                  return (
                    <React.Fragment key={item.dateKey}>
                      <tr 
                        style={{ ...styles.tr, cursor: "pointer" }} 
                        onClick={() => setExpandedDate(isExpanded ? null : item.dateKey)}
                      >
                        <td style={styles.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {isExpanded ? <ChevronUp size={16} color="var(--primary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                            <strong>{item.dateKey}</strong>
                            {item.sessions.length > 1 && (
                              <span style={{ fontSize: "11px", background: "rgba(99,102,241,0.15)", color: "var(--primary)", padding: "2px 6px", borderRadius: "10px", marginLeft: "4px" }}>
                                {item.sessions.length} sessions
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={styles.td}>{item.earliestCheckIn.toLocaleTimeString()}</td>
                        <td style={styles.td}>
                          {item.isOngoing ? (
                            <span className="status-badge active">Online (Active)</span>
                          ) : (
                            item.latestCheckOut ? item.latestCheckOut.toLocaleTimeString() : "-"
                          )}
                        </td>
                        <td style={styles.td}>{formatHours(item.totalWorkingHours)}</td>
                        <td style={styles.td}>
                          {item.totalOvertimeHours > 0 ? (
                            <span className="status-badge warning">{formatHours(item.totalOvertimeHours)} Overtime</span>
                          ) : (
                            "0 min"
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} style={{ padding: "0 24px 20px 24px", background: "rgba(255,255,255,0.01)" }}>
                            <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px" }}>
                              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                                Detailed Sessions for {item.dateKey}
                              </div>
                              {item.sessions.map((s: any, idx: number) => (
                                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1.5fr 1fr 1fr", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.01)", borderBottom: idx !== item.sessions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", fontSize: "13px" }}>
                                  <span><strong>Session {item.sessions.length - idx}</strong></span>
                                  <span>In: {new Date(s.checkIn).toLocaleTimeString()}</span>
                                  <span>Out: {s.checkOut ? new Date(s.checkOut).toLocaleTimeString() : <span className="status-badge active" style={{ scale: "0.85", display: "inline-block" }}>Online</span>}</span>
                                  <span>Dur: {formatHours(s.workingHours)}</span>
                                  <span>
                                    {s.overtimeHours > 0 ? (
                                      <span className="status-badge warning" style={{ scale: "0.85", display: "inline-block" }}>{formatHours(s.overtimeHours)}</span>
                                    ) : (
                                      "0 min"
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: AI Policy Chatbot */}
      {activeTab === "ai-policy-assistant" && (
        <div style={styles.content}>
          
          <div className="card" style={styles.chatCard}>
            <div style={styles.chatHeader}>
              <Bot size={22} color="var(--primary)" />
              <div style={{ textAlign: "left" }}>
                <div style={styles.chatTitle}>Company Knowledge Base Bot</div>
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
                  {msg.role === "user" ? msg.content : renderFormattedContent(msg.content)}
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
    height: "580px",
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
