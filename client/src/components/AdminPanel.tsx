import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useSocket } from "../context/SocketContext";
import {
  Users,
  Calendar,
  Upload,
  Bot,
  Plus,
  Trash2,
  Edit2,
  FileText,
  UserCheck,
  Send,
  Loader
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

interface AdminPanelProps {
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

export const AdminPanel: React.FC<AdminPanelProps> = ({ activeTab }) => {
  const { stats, liveEvents } = useSocket();

  // General States
  const [users, setUsers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States - User CRUD
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("STAFF");
  const [managerId, setManagerId] = useState("");

  // Form States - Document Upload
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("HR_POLICY");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  // Chat States - AI Assistant
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: "assistant", content: "Hello Admin! Ask me any questions about employee attendance, absences, or overtime rates." },
  ]);

  // AI Settings states
  const [aiProvider, setAiProvider] = useState("OPENAI");
  const [openaiKey, setOpenaiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");

  const fetchAISettings = async () => {
    try {
      const response = await api.get("/ai/settings");
      const { provider, openaiApiKey, groqApiKey } = response.data.data;
      setAiProvider(provider);
      setOpenaiKey(openaiApiKey || "");
      setGroqKey(groqApiKey || "");
    } catch (e) {
      console.error("Failed to fetch AI settings", e);
    }
  };

  const handleSaveAISettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post("/ai/settings", {
        provider: aiProvider,
        openaiApiKey: openaiKey,
        groqApiKey: groqKey,
      });
      alert("AI Provider settings saved successfully!");
      fetchAISettings();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save AI settings");
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch functions
  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await api.get("/users/managers");
      setManagers(response.data.data);
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

  const fetchDocuments = async () => {
    try {
      const response = await api.get("/ai/documents");
      setDocuments(response.data.data);
    } catch (e) {
      console.error("Failed to fetch documents", e);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document? All parsed chunks and embeddings will be removed.")) return;
    setActionLoading(true);
    try {
      await api.delete(`/ai/documents/${id}`);
      alert("Document deleted successfully!");
      fetchDocuments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete document");
    } finally {
      setActionLoading(false);
    }
  };

  // Run fetches on mount or tab change
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
      fetchManagers();
    } else if (activeTab === "attendance") {
      fetchAttendance();
    } else if (activeTab === "dashboard") {
      fetchAttendance();
      fetchUsers();
    } else if (activeTab === "settings") {
      fetchAISettings();
    } else if (activeTab === "knowledge-base") {
      fetchDocuments();
    }
  }, [activeTab]);

  // User Create/Update Handler
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload: any = {
        firstName,
        lastName,
        email,
        phone,
        role,
        managerId: managerId || null,
      };
      if (password) {
        payload.password = password;
      }

      if (editingUserId) {
        await api.patch(`/users/${editingUserId}`, payload);
      } else {
        await api.post("/users", payload);
      }

      setUserModalOpen(false);
      resetUserForm();
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save user");
    } finally {
      setActionLoading(false);
    }
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setRole("STAFF");
    setManagerId("");
  };

  const handleEditClick = (u: any) => {
    setEditingUserId(u.id);
    setFirstName(u.firstName);
    setLastName(u.lastName);
    setEmail(u.email);
    setPhone(u.phone || "");
    setRole(u.role);
    setManagerId(u.managerId || "");
    setPassword("");
    setUserModalOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? All check-in records will be permanently removed.")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (e) {
      alert("Failed to delete user");
    }
  };

  // PDF Document Upload Handler
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setActionLoading(true);

    const formData = new FormData();
    formData.append("title", uploadTitle);
    formData.append("file", selectedFile);
    formData.append("documentType", uploadType);

    try {
      await api.post("/ai/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Document uploaded and indexed successfully!");
      setUploadTitle("");
      setSelectedFile(null);
      fetchDocuments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to index document");
    } finally {
      setActionLoading(false);
    }
  };

  // AI Assistant Chat Handler
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

  // Build Recharts data based on attendance logs
  const getChartData = () => {
    // If there are no logs, provide mock data for preview/aesthetic purposes
    if (!attendance || attendance.length === 0) {
      return [
        { name: "Mon", checkins: 4 },
        { name: "Tue", checkins: 6 },
        { name: "Wed", checkins: 8 },
        { name: "Thu", checkins: 5 },
        { name: "Fri", checkins: 7 },
        { name: "Sat", checkins: 2 },
        { name: "Sun", checkins: 1 }
      ];
    }

    // Group attendance by date for the last 7 days
    const groups: Record<string, number> = {};
    attendance.slice(0, 50).forEach((att) => {
      const dateStr = new Date(att.checkIn).toLocaleDateString(undefined, { weekday: "short" });
      groups[dateStr] = (groups[dateStr] || 0) + 1;
    });

    return Object.keys(groups).map((key) => ({
      name: key,
      checkins: groups[key],
    })).reverse();
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Tab: Dashboard */}
      {activeTab === "dashboard" && (
        <div style={styles.content}>
          {/* Quick Stats Grid */}
          <div className="grid grid-3">
            <div className="card glow-card" style={styles.statsCard}>
              <div style={styles.statsIconWrapper}><UserCheck color="#10b981" /></div>
              <div>
                <div style={styles.statsLabel}>Active Staff Online</div>
                <div style={styles.statsValue}>{stats.onlineCount}</div>
              </div>
            </div>
            <div className="card" style={styles.statsCard}>
              <div style={{ ...styles.statsIconWrapper, background: "var(--danger-glow)" }}><Users color="#ef4444" /></div>
              <div>
                <div style={styles.statsLabel}>Offline Staff</div>
                <div style={styles.statsValue}>{stats.offlineCount}</div>
              </div>
            </div>
            <div className="card" style={styles.statsCard}>
              <div style={{ ...styles.statsIconWrapper, background: "var(--secondary-glow)" }}><Calendar color="#06b6d4" /></div>
              <div>
                <div style={styles.statsLabel}>Check-Ins Today</div>
                <div style={styles.statsValue}>
                  {attendance.filter(a => new Date(a.checkIn).toDateString() === new Date().toDateString()).length}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.dashboardGrid}>
            {/* Chart Area */}
            <div className="card" style={styles.chartSection}>
              <h3 style={styles.sectionTitle}>Attendance Frequency (Last 7 Days)</h3>
              <div style={{ height: "250px", width: "100%", marginTop: "16px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#12131a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                    <Bar dataKey="checkins" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Feed */}
            <div className="card" style={styles.feedSection}>
              <h3 style={styles.sectionTitle}>Live Activity Feed</h3>
              <div style={styles.feedList}>
                {liveEvents.length === 0 ? (
                  <div style={styles.emptyFeed}>Waiting for live check-ins...</div>
                ) : (
                  liveEvents.map((ev, i) => (
                    <div key={ev.id + i} style={styles.feedItem}>
                      <div style={{
                        ...styles.feedDot,
                        background: ev.type === "checkin" ? "var(--success)" : "var(--danger)",
                      }} />
                      <div style={styles.feedContent}>
                        <span style={styles.feedText}>
                          <strong>{ev.employeeName}</strong> ({ev.role}) checked {ev.type === "checkin" ? "in" : "out"}
                        </span>
                        <span style={styles.feedTime}>{ev.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users Management */}
      {activeTab === "users" && (
        <div style={styles.content}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Employees & Staff Management</h3>
            <button className="btn btn-primary" onClick={() => { resetUserForm(); setUserModalOpen(true); }}>
              <Plus size={16} /> Add Employee
            </button>
          </div>

          <div className="card" style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Manager</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={styles.tr}>
                    <td style={styles.td}><strong>{u.firstName} {u.lastName}</strong></td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.roleBadge,
                        background: u.role === "ADMIN" ? "rgba(168,85,247,0.15)" : u.role === "MANAGER" ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.05)",
                        color: u.role === "ADMIN" ? "#c084fc" : u.role === "MANAGER" ? "#22d3ee" : "var(--text-primary)",
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={styles.td}>{u.phone || "-"}</td>
                    <td style={styles.td}>{u.manager ? `${u.manager.firstName} ${u.manager.lastName}` : "-"}</td>
                    <td style={styles.td}>
                      <span className={`status-badge ${u.isActive ? "active" : "inactive"}`}>
                        {u.isActive ? "online" : "offline"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button style={styles.actionBtn} onClick={() => handleEditClick(u)}><Edit2 size={16} /></button>
                        <button style={{ ...styles.actionBtn, color: "var(--danger)" }} onClick={() => handleDeleteUser(u.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Modal */}
          {userModalOpen && (
            <div style={styles.modalBackdrop}>
              <div className="card glow-card" style={styles.modal}>
                <h4 style={styles.modalTitle}>{editingUserId ? "Edit Employee Profile" : "Register New Employee"}</h4>
                <form onSubmit={handleSaveUser}>
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
                    <label className="form-label">Password {editingUserId && "(Leave blank to keep current)"}</label>
                    <input type="password" required={!editingUserId} className="input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input type="text" className="input" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div style={styles.row}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">System Role</label>
                      <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                        <option value="STAFF">Staff</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    {role === "STAFF" && (
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Assign Manager</label>
                        <select className="input" value={managerId} onChange={e => setManagerId(e.target.value)}>
                          <option value="">No Manager Assigned</option>
                          {managers.map(m => (
                            <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div style={styles.modalActions}>
                    <button type="button" className="btn btn-secondary" onClick={() => setUserModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                      {actionLoading ? "Saving..." : "Save Profile"}
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
          <h3 style={styles.sectionTitle}>Global Attendance Logs</h3>
          <div className="card" style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Check-In</th>
                  <th style={styles.th}>Check-Out</th>
                  <th style={styles.th}>Hours Worked</th>
                  <th style={styles.th}>Overtime Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.id} style={styles.tr}>
                    <td style={styles.td}><strong>{a.user.firstName} {a.user.lastName}</strong></td>
                    <td style={styles.td}>{a.user.role}</td>
                    <td style={styles.td}>{new Date(a.checkIn).toLocaleString()}</td>
                    <td style={styles.td}>{a.checkOut ? new Date(a.checkOut).toLocaleString() : <span className="status-badge active">Checked In</span>}</td>
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

      {/* Tab: Knowledge Base (RAG) */}
      {activeTab === "knowledge-base" && (
        <div style={styles.content}>
          <h3 style={styles.sectionTitle}>Company Document Knowledge Base</h3>
          
          <div style={styles.ragGrid}>
            {/* Upload form */}
            <div className="card" style={styles.uploadCard}>
              <h4 style={styles.cardHeaderTitle}><Upload size={18} /> Upload Company Policy PDF</h4>
              <form onSubmit={handleFileUpload} style={{ marginTop: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Document Title</label>
                  <input type="text" required className="input" placeholder="e.g. Employee Handbook 2026" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Policy Type</label>
                  <select className="input" value={uploadType} onChange={e => setUploadType(e.target.value)}>
                    <option value="EMPLOYEE_HANDBOOK">Employee Handbook</option>
                    <option value="HR_POLICY">HR Policy</option>
                    <option value="LEAVE_POLICY">Leave Policy</option>
                    <option value="ATTENDANCE_POLICY">Attendance Policy</option>
                    <option value="COMPANY_POLICY">Company Policy</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Select PDF File</label>
                  <input type="file" required accept="application/pdf" onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} style={styles.fileInput} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={actionLoading}>
                  {actionLoading ? "Uploading & Chunking..." : "Process & Embed Document"}
                </button>
              </form>
            </div>

            {/* Explainer / Doc list */}
            <div className="card" style={{ ...styles.explainCard, display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <h4 style={styles.cardHeaderTitle}><FileText size={18} /> Uploaded Policy Documents ({documents.length})</h4>
                {documents.length === 0 ? (
                  <p style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>
                    No documents uploaded yet. Use the form on the left to upload company policies.
                  </p>
                ) : (
                  <div style={{ marginTop: "16px", overflowY: "auto", maxHeight: "250px" }}>
                    <table className="table" style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Type</th>
                          <th>File Name</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => (
                          <tr key={doc.id}>
                            <td><strong>{doc.title}</strong></td>
                            <td>
                              <span className="badge badge-secondary" style={{ fontSize: "11px" }}>
                                {doc.documentType.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{doc.fileName}</td>
                            <td style={{ textAlign: "right" }}>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: "4px 8px", minWidth: "auto" }}
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={actionLoading}
                                title="Delete Document"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: AI Assistant */}
      {activeTab === "ai-assistant" && (
        <div style={styles.content}>
          <h3 style={styles.sectionTitle}>AI Assistant</h3>
          
          <div className="card" style={styles.chatCard}>
            <div style={styles.chatHeader}>
              <Bot size={22} color="var(--primary)" />
              <div style={{ textAlign: "left" }}>
                <div style={styles.chatTitle}>Ask Anything About Organization</div>
                <div style={styles.chatStatus}>Can search and answer employee statistics</div>
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
              <input type="text" className="input" placeholder="e.g. Who worked overtime last week?" value={chatInput} onChange={e => setChatInput(e.target.value)} />
              <button type="submit" className="btn btn-primary" style={styles.sendBtn}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Reports */}
      {activeTab === "reports" && (
        <div style={styles.content}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Organizational Performance Reports</h3>
          </div>

          <div className="grid grid-3">
            <div className="card">
              <div style={styles.statsLabel}>Average Team Working Hours</div>
              <div style={{ ...styles.statsValue, marginTop: "8px" }}>
                {attendance.length > 0
                  ? (attendance.reduce((acc, curr) => acc + (curr.workingHours || 0), 0) / attendance.filter(a => a.workingHours !== null).length || 0).toFixed(1)
                  : "0.0"}{" "}
                hrs
              </div>
            </div>
            <div className="card">
              <div style={styles.statsLabel}>Aggregate Overtime Logged</div>
              <div style={{ ...styles.statsValue, marginTop: "8px" }}>
                {attendance.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0).toFixed(1)} hrs
              </div>
            </div>
            <div className="card">
              <div style={styles.statsLabel}>Total Completed Shifts</div>
              <div style={{ ...styles.statsValue, marginTop: "8px" }}>
                {attendance.filter((a) => a.checkOut !== null).length}
              </div>
            </div>
          </div>

          <div className="card" style={styles.tableCard}>
            <div style={{ padding: "20px 24px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: 600, textAlign: "left" }}>Employee Summary Breakdown</h4>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Employee Name</th>
                  <th style={styles.th}>System Role</th>
                  <th style={styles.th}>Total Shifts</th>
                  <th style={styles.th}>Total Logged Hours</th>
                  <th style={styles.th}>Accumulated Overtime</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const userAttendance = attendance.filter((a) => a.userId === u.id);
                  const totalHrs = userAttendance.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);
                  const totalOvertime = userAttendance.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
                  
                  return (
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}><strong>{u.firstName} {u.lastName}</strong></td>
                      <td style={styles.td}>{u.role}</td>
                      <td style={styles.td}>{userAttendance.length}</td>
                      <td style={styles.td}>{formatHours(totalHrs)}</td>
                      <td style={styles.td}>
                        {totalOvertime > 0 ? (
                          <span className="status-badge warning">{formatHours(totalOvertime)}</span>
                        ) : (
                          "0 min"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === "settings" && (
        <div style={styles.content}>
          <h3 style={styles.sectionTitle}>Global System Settings</h3>
          
          <div className="grid grid-2">
            {/* Shift Rules */}
            <div className="card" style={{ textAlign: "left" }}>
              <h4 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>Shift Configuration Rules</h4>
              <div className="form-group">
                <label className="form-label">Shift Cut-off Start Time</label>
                <input type="time" className="input" defaultValue="09:00" />
              </div>
              <div className="form-group">
                <label className="form-label">Standard Shifts Requirement (hours / day)</label>
                <input type="number" className="input" defaultValue="8" />
              </div>
              <div className="form-group">
                <label className="form-label">Minimum Hours for Overtime (hours)</label>
                <input type="number" className="input" defaultValue="8" />
              </div>
              <button className="btn btn-primary" onClick={() => alert("Shift settings saved locally!")}>
                Save Shift Rules
              </button>
            </div>

            {/* AI Provider Config */}
            <div className="card" style={{ textAlign: "left" }}>
              <h4 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>AI Provider Configurations</h4>
              <form onSubmit={handleSaveAISettings}>
                <div className="form-group">
                  <label className="form-label">Active AI Engine</label>
                  <select
                    className="input"
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                  >
                    <option value="OPENAI">OpenAI (GPT Models)</option>
                    <option value="GROQ">Groq (Llama Models)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">OpenAI API Key</label>
                  <input
                    type="password"
                    className="input"
                    placeholder={openaiKey ? "••••••••••••" : "Enter OpenAI API Key"}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Required for RAG embeddings and OpenAI completions.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Groq API Key</label>
                  <input
                    type="password"
                    className="input"
                    placeholder={groqKey ? "••••••••••••" : "Enter Groq API Key"}
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Required when Groq is set as the active engine.
                  </span>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={actionLoading}>
                  {actionLoading ? "Saving..." : "Save AI Configurations"}
                </button>
              </form>
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
    background: "var(--success-glow)",
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
  dashboardGrid: {
    display: "flex",
    gap: "24px",
  },
  chartSection: {
    flex: 2,
  },
  feedSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  feedList: {
    marginTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "260px",
    overflowY: "auto",
  },
  feedItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    padding: "8px 0",
    borderBottom: "1px solid var(--border)",
  },
  feedDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  feedContent: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
  },
  feedText: {
    color: "var(--text-primary)",
  },
  feedTime: {
    fontSize: "11px",
    color: "var(--text-muted)",
  },
  emptyFeed: {
    fontSize: "13px",
    color: "var(--text-muted)",
    padding: "20px",
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
  roleBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 600,
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  actionBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    transition: "var(--transition)",
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
  ragGrid: {
    display: "flex",
    gap: "24px",
  },
  uploadCard: {
    flex: 1,
  },
  explainCard: {
    flex: 1,
    textAlign: "left",
  },
  cardHeaderTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "16px",
    fontWeight: 600,
  },
  fileInput: {
    border: "1px dashed var(--border)",
    padding: "16px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.01)",
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  explainList: {
    marginLeft: "20px",
    marginTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  vectorStatusBanner: {
    marginTop: "24px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "var(--success-glow)",
    padding: "8px 16px",
    borderRadius: "8px",
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
};
export default AdminPanel;
