import React, { useEffect, useState } from "react";
import api from "../utils/api";
import {
  Users,
  Calendar,
  Plus,
  Bot,
  Brain,
  Sparkles,
  Send,
  Loader,
  Database
} from "lucide-react";

interface ManagerPanelProps {
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

export const ManagerPanel: React.FC<ManagerPanelProps> = ({ activeTab }) => {

  // General States
  const [staffList, setStaffList] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States - Add Staff (Manager can only create STAFF)
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Form States - Embed/Index Profile
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [department, setDepartment] = useState("");

  // Semantic Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // AI Assistant States
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: "assistant", content: "Hello Manager! Ask me questions about your team's attendance or absences." },
  ]);

  // Fetches
  const fetchStaff = async () => {
    try {
      const response = await api.get("/users");
      setStaffList(response.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await api.get("/attendance/history");
      setAttendance(response.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === "staff") {
      fetchStaff();
    } else if (activeTab === "attendance") {
      fetchAttendance();
    } else if (activeTab === "dashboard") {
      fetchStaff();
      fetchAttendance();
    }
  }, [activeTab]);

  // Add Staff Submit Handler
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post("/users", {
        firstName,
        lastName,
        email,
        password,
        phone,
        role: "STAFF",
      });
      setStaffModalOpen(false);
      resetStaffForm();
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add staff member");
    } finally {
      setActionLoading(false);
    }
  };

  const resetStaffForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setPhone("");
  };

  // Profile Index Handler
  const handleIndexProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);
      await api.post("/ai/employee-profile", {
        userId: selectedStaffId,
        skills: skillsArray,
        experience,
        department,
      });
      alert("Employee skills and profile indexed successfully in Vector Database!");
      setEmbedModalOpen(false);
      setSkills("");
      setExperience("");
      setDepartment("");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to index employee profile");
    } finally {
      setActionLoading(false);
    }
  };

  const openEmbedModal = (staff: any) => {
    setSelectedStaffId(staff.id);
    setDepartment(staff.department?.name || "");
    setEmbedModalOpen(true);
  };

  // Semantic search query trigger
  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await api.get(`/ai/search-employees?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.data);
    } catch (e) {
      alert("Semantic search query failed");
    } finally {
      setLoading(false);
    }
  };

  // AI Assistant Chat Send
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setLoading(true);

    try {
      const response = await api.post("/ai/ask-attendance", { question: userMessage.content });
      setChatMessages((prev) => [...prev, { role: "assistant", content: response.data.data.answer }]);
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Error: " + (err.response?.data?.message || "Failed to query database") }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Tab: Dashboard */}
      {activeTab === "dashboard" && (
        <div style={styles.content}>
          <div className="grid grid-3">
            <div className="card glow-card" style={styles.statsCard}>
              <div style={styles.statsIconWrapper}><Users color="var(--primary)" /></div>
              <div>
                <div style={styles.statsLabel}>Total Managed Staff</div>
                <div style={styles.statsValue}>{staffList.length}</div>
              </div>
            </div>
            <div className="card" style={styles.statsCard}>
              <div style={{ ...styles.statsIconWrapper, background: "var(--success-glow)" }}><Plus color="var(--success)" /></div>
              <div>
                <div style={styles.statsLabel}>Online Team Members</div>
                <div style={styles.statsValue}>
                  {staffList.filter(s => s.isActive).length}
                </div>
              </div>
            </div>
            <div className="card" style={styles.statsCard}>
              <div style={{ ...styles.statsIconWrapper, background: "var(--warning-glow)" }}><Calendar color="var(--warning)" /></div>
              <div>
                <div style={styles.statsLabel}>Check Ins Today</div>
                <div style={styles.statsValue}>
                  {attendance.filter(a => new Date(a.checkIn).toDateString() === new Date().toDateString()).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Staff Management */}
      {activeTab === "staff" && (
        <div style={styles.content}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Your Team Members</h3>
            <button className="btn btn-primary" onClick={() => setStaffModalOpen(true)}>
              <Plus size={16} /> Add Staff Member
            </button>
          </div>

          <div className="card" style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Semantic Embedding</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((s) => (
                  <tr key={s.id} style={styles.tr}>
                    <td style={styles.td}><strong>{s.firstName} {s.lastName}</strong></td>
                    <td style={styles.td}>{s.email}</td>
                    <td style={styles.td}>{s.phone || "-"}</td>
                    <td style={styles.td}>
                      <span className={`status-badge ${s.isActive ? "active" : "inactive"}`}>
                        {s.isActive ? "online" : "offline"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button className="btn btn-secondary" onClick={() => openEmbedModal(s)} style={{ fontSize: "12px", padding: "6px 12px" }}>
                        <Brain size={14} /> Index Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal to Add Staff */}
          {staffModalOpen && (
            <div style={styles.modalBackdrop}>
              <div className="card glow-card" style={styles.modal}>
                <h4 style={styles.modalTitle}>Add Staff Member</h4>
                <form onSubmit={handleAddStaffSubmit}>
                  <div style={styles.row}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">First Name</label>
                      <input type="text" required className="input" value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Last Name</label>
                      <input type="text" required className="input" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" required className="input" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input type="password" required className="input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input type="text" className="input" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div style={styles.modalActions}>
                    <button type="button" className="btn btn-secondary" onClick={() => setStaffModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                      {actionLoading ? "Saving..." : "Add Member"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal to Index semantic Profile */}
          {embedModalOpen && (
            <div style={styles.modalBackdrop}>
              <div className="card glow-card" style={styles.modal}>
                <h4 style={styles.modalTitle}><Database size={18} color="var(--primary)" /> Embed Semantic Profile</h4>
                <form onSubmit={handleIndexProfileSubmit}>
                  <div className="form-group">
                    <label className="form-label">Skills (Comma-separated)</label>
                    <input type="text" required className="input" placeholder="React, Node.js, PostgreSQL" value={skills} onChange={e => setSkills(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Experience (Years or Description)</label>
                    <input type="text" required className="input" placeholder="3 years" value={experience} onChange={e => setExperience(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input type="text" required className="input" placeholder="Engineering" value={department} onChange={e => setDepartment(e.target.value)} />
                  </div>
                  <div style={styles.modalActions}>
                    <button type="button" className="btn btn-secondary" onClick={() => setEmbedModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                      {actionLoading ? "Indexing..." : "Generate Embedding"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Attendance Records */}
      {activeTab === "attendance" && (
        <div style={styles.content}>
          <h3 style={styles.sectionTitle}>Team Attendance logs</h3>
          <div className="card" style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Check-In</th>
                  <th style={styles.th}>Check-Out</th>
                  <th style={styles.th}>Working Hours</th>
                  <th style={styles.th}>Overtime</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.id} style={styles.tr}>
                    <td style={styles.td}><strong>{a.user.firstName} {a.user.lastName}</strong></td>
                    <td style={styles.td}>{new Date(a.checkIn).toLocaleString()}</td>
                    <td style={styles.td}>{a.checkOut ? new Date(a.checkOut).toLocaleString() : <span className="status-badge active">Online</span>}</td>
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

      {/* Tab: AI Reports */}
      {activeTab === "ai-reports" && (
        <div style={styles.content}>
          <div className="card" style={styles.chatCard}>
            <div style={styles.chatHeader}>
              <Bot size={22} color="var(--primary)" />
              <div style={{ textAlign: "left" }}>
                <div style={styles.chatTitle}>AI Assistant</div>
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
              <input type="text" className="input" placeholder="e.g. Which team member worked overtime this week?" value={chatInput} onChange={e => setChatInput(e.target.value)} />
              <button type="submit" className="btn btn-primary" style={styles.sendBtn}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: AI Semantic Search */}
      {activeTab === "ai-search" && (
        <div style={styles.content}>
          <h3 style={styles.sectionTitle}>Semantic Profile Search (Vector DB)</h3>
          
          <div className="card">
            <form onSubmit={handleSemanticSearch} style={styles.searchForm}>
              <input type="text" className="input" placeholder="Search by skills, experience, or attributes (e.g. 'Frontend developer with React experience')" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <Loader size={16} className="pulse-glow" /> : <Sparkles size={16} />}
                <span>Semantic Search</span>
              </button>
            </form>
          </div>

          <div style={styles.searchResultsContainer}>
            {searchResults.length === 0 ? (
              <div style={styles.emptySearch}>No search results. Enter a descriptive query to search employee embeddings.</div>
            ) : (
              <div style={styles.resultsGrid}>
                {searchResults.map((res, i) => (
                  <div key={res.id + i} className="card glow-card" style={styles.resultCard}>
                    <div style={styles.resultHeader}>
                      <span style={styles.resultName}>{res.firstName} {res.lastName}</span>
                      <span style={styles.similarityScore}>Similarity: {Math.round(res.similarity * 100)}%</span>
                    </div>
                    <div style={styles.resultRole}>{res.role} • {res.email}</div>
                    <div style={styles.resultBody}>{res.content}</div>
                  </div>
                ))}
              </div>
            )}
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
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  modal: {
    width: "100%",
    maxWidth: "500px",
    background: "var(--bg-card)",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "20px",
    textAlign: "left",
  },
  row: {
    display: "flex",
    gap: "16px",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
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
  searchForm: {
    display: "flex",
    gap: "16px",
  },
  searchResultsContainer: {
    marginTop: "12px",
  },
  emptySearch: {
    padding: "40px",
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "14px",
  },
  resultsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  resultCard: {
    textAlign: "left",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultName: {
    fontSize: "16px",
    fontWeight: 600,
  },
  similarityScore: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--primary)",
  },
  resultRole: {
    fontSize: "12px",
    color: "var(--text-muted)",
    marginBottom: "12px",
  },
  resultBody: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    background: "rgba(255,255,255,0.01)",
    border: "1px solid var(--border)",
    padding: "12px",
    borderRadius: "6px",
  },
};
export default ManagerPanel;
