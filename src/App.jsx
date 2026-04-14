import { useState, useEffect } from "react";

const STAGES = ["Applied", "Assessment", "Multiple Rounds", "Offer"];
const STATUSES = ["Active", "Paused", "Rejected", "Withdrawn", "Accepted"];
const EVENT_TYPES = [
  { value: "applied",      label: "Applied",           icon: "📤", color: "#6ea8fe" },
  { value: "assessment",   label: "Assessment",        icon: "📝", color: "#b18cfe" },
  { value: "phone_screen", label: "Phone Screen",      icon: "📞", color: "#67e8f9" },
  { value: "interview",    label: "Interview",         icon: "🎤", color: "#6edcb6" },
  { value: "technical",    label: "Technical Round",   icon: "💻", color: "#f0abfc" },
  { value: "panel",        label: "Panel Interview",   icon: "👥", color: "#fda4af" },
  { value: "take_home",    label: "Take-Home Project", icon: "🏠", color: "#fdba74" },
  { value: "offer",        label: "Offer Received",    icon: "🏆", color: "#ffd666" },
  { value: "rejected",     label: "Rejected",          icon: "❌", color: "#f87171" },
  { value: "follow_up",    label: "Follow-up Sent",    icon: "📧", color: "#94a3b8" },
  { value: "other",        label: "Other",             icon: "📌", color: "#a1a1aa" },
];

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const STORAGE_KEY = "jobtracker:applications";

// ─── Sample data shown on first load ───
const SAMPLE_APPS = [
  {
    id: "sample1",
    company: "Stripe",
    role: "Product Designer",
    dateApplied: "2026-03-18",
    status: "Active",
    stage: "Multiple Rounds",
    salary: "145000",
    notes: "Great culture fit. Met with design lead on second round. Panel interview coming up.",
    followUp: "2026-04-18",
    events: [
      { id: "e1",  type: "applied",      date: "2026-03-18", note: "Applied via company website", completed: true },
      { id: "e2",  type: "phone_screen", date: "2026-03-24", note: "30min with recruiter, went well", completed: true },
      { id: "e3",  type: "interview",    date: "2026-04-02", note: "Design challenge + portfolio review", completed: true },
      { id: "e4",  type: "panel",        date: "2026-04-20", note: "Team panel — prep case study", completed: false },
    ],
  },
  {
    id: "sample2",
    company: "Linear",
    role: "UX Designer",
    dateApplied: "2026-03-28",
    status: "Active",
    stage: "Assessment",
    salary: "130000",
    notes: "Take-home project due April 15. Focus on redesigning the issue triage flow.",
    followUp: "2026-04-15",
    events: [
      { id: "e5", type: "applied",    date: "2026-03-28", note: "", completed: true },
      { id: "e6", type: "assessment", date: "2026-04-08", note: "Take-home design project", completed: false },
    ],
  },
  {
    id: "sample3",
    company: "Figma",
    role: "Senior Product Designer",
    dateApplied: "2026-02-20",
    status: "Rejected",
    stage: "Multiple Rounds",
    salary: "160000",
    notes: "Made it to final round. Rejected after exec presentation — feedback was too junior for senior level.",
    followUp: "",
    events: [
      { id: "e7",  type: "applied",      date: "2026-02-20", note: "", completed: true },
      { id: "e8",  type: "phone_screen", date: "2026-02-27", note: "", completed: true },
      { id: "e9",  type: "interview",    date: "2026-03-06", note: "Portfolio review", completed: true },
      { id: "e10", type: "panel",        date: "2026-03-13", note: "Exec presentation", completed: true },
      { id: "e11", type: "rejected",     date: "2026-03-16", note: "Not moving forward", completed: true },
    ],
  },
  {
    id: "sample4",
    company: "Vercel",
    role: "Product Designer",
    dateApplied: "2026-04-08",
    status: "Active",
    stage: "Applied",
    salary: "140000",
    notes: "Referred by a friend on the design team.",
    followUp: "",
    events: [
      { id: "e12", type: "applied", date: "2026-04-08", note: "Referred internally", completed: true },
    ],
  },
  {
    id: "sample5",
    company: "Notion",
    role: "Product Designer II",
    dateApplied: "2026-03-10",
    status: "Paused",
    stage: "Assessment",
    salary: "135000",
    notes: "On hold — headcount freeze until Q3. Recruiter said to check back in June.",
    followUp: "2026-06-01",
    events: [
      { id: "e13", type: "applied",    date: "2026-03-10", note: "", completed: true },
      { id: "e14", type: "assessment", date: "2026-03-17", note: "Completed design exercise", completed: true },
    ],
  },
  {
    id: "sample6",
    company: "Anthropic",
    role: "Product Designer",
    dateApplied: "2026-04-01",
    status: "Active",
    stage: "Assessment",
    salary: "155000",
    notes: "Very excited about this one. Focus on AI safety + product.",
    followUp: "2026-04-14",
    events: [
      { id: "e15", type: "applied",      date: "2026-04-01", note: "", completed: true },
      { id: "e16", type: "phone_screen", date: "2026-04-09", note: "Great conversation with recruiter", completed: true },
      { id: "e17", type: "technical",    date: "2026-04-16", note: "Design systems challenge", completed: false },
    ],
  },
];

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function daysAgo(d) {
  if (!d) return null;
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 0) return "Upcoming";
  return `${diff}d ago`;
}

// ─── Modal ───
function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#1a1a2e", border: "1px solid #2a2a4a",
          borderRadius: 16, width: "min(520px, 92vw)", maxHeight: "85vh",
          overflow: "auto", padding: "28px 32px", boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontFamily: "'DM Sans', sans-serif", color: "#e0e0ff", fontWeight: 600 }}>
            {title}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Field ───
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: 12, color: "#8888aa", marginBottom: 6,
        fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 1,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 14px", background: "#12122a",
  border: "1px solid #2a2a4a", borderRadius: 8, color: "#e0e0ff",
  fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
};
const selectStyle = { ...inputStyle, appearance: "none", cursor: "pointer" };

// ─── Stat Card ───
function StatCard({ label, value, accent, icon, sub }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #1a1a2e 0%, #16162a 100%)",
      border: "1px solid #2a2a4a", borderRadius: 14, padding: "20px 22px",
      flex: "1 1 160px", minWidth: 140, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -20, right: -20, width: 80, height: 80,
        borderRadius: "50%", background: accent || "#6c63ff", opacity: 0.07,
      }} />
      <div style={{ fontSize: 13, color: "#7777aa", fontFamily: "'DM Sans', sans-serif", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 16 }}>{icon}</span> {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#e0e0ff", fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "#6c63ff", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ─── Stage Pill ───
function StagePill({ stage }) {
  const colors = {
    "Applied":         { bg: "#1e2a4a", fg: "#6ea8fe" },
    "Assessment":      { bg: "#2a1e4a", fg: "#b18cfe" },
    "Multiple Rounds": { bg: "#1e3a3a", fg: "#6edcb6" },
    "Offer":           { bg: "#3a2e1e", fg: "#ffd666" },
  };
  const c = colors[stage] || { bg: "#2a2a3a", fg: "#aaa" };
  return (
    <span style={{
      background: c.bg, color: c.fg, padding: "4px 12px", borderRadius: 20,
      fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
    }}>
      {stage}
    </span>
  );
}

// ─── Status Badge ───
function StatusBadge({ status }) {
  const colors = {
    "Active":    { bg: "#0d2818", fg: "#4ade80" },
    "Paused":    { bg: "#2a2a1e", fg: "#fbbf24" },
    "Rejected":  { bg: "#2a1e1e", fg: "#f87171" },
    "Withdrawn": { bg: "#1e1e2a", fg: "#94a3b8" },
    "Accepted":  { bg: "#0d2830", fg: "#22d3ee" },
  };
  const c = colors[status] || { bg: "#2a2a3a", fg: "#aaa" };
  return (
    <span style={{
      background: c.bg, color: c.fg, padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
    }}>
      {status}
    </span>
  );
}

// ─── Main App ───
export default function JobTracker() {
  const [apps, setApps] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [form, setForm] = useState({
    company: "", role: "", dateApplied: "", status: "Active",
    stage: "Applied", salary: "", notes: "", followUp: "", events: [],
  });

  // ─── Load from localStorage (show sample data on first visit) ───
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setApps(JSON.parse(saved));
      } else {
        setApps(SAMPLE_APPS);
      }
    } catch {
      setApps(SAMPLE_APPS);
    }
    setLoaded(true);
  }, []);

  // ─── Save to localStorage ───
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    } catch (e) {
      console.error("Save error:", e);
    }
  }, [apps, loaded]);

  const resetForm = () =>
    setForm({ company: "", role: "", dateApplied: "", status: "Active", stage: "Applied", salary: "", notes: "", followUp: "", events: [] });

  const openNew = () => { resetForm(); setEditingId(null); setModalOpen(true); };
  const openEdit = (app) => { setForm({ ...app, events: app.events || [] }); setEditingId(app.id); setModalOpen(true); };

  const saveApp = () => {
    if (!form.company.trim()) return;
    if (editingId) {
      setApps(prev => prev.map(a => a.id === editingId ? { ...form, id: editingId } : a));
    } else {
      setApps(prev => [...prev, { ...form, id: generateId(), dateApplied: form.dateApplied || new Date().toISOString().split("T")[0] }]);
    }
    setModalOpen(false);
    resetForm();
    setEditingId(null);
  };

  const deleteApp = (id) => setApps(prev => prev.filter(a => a.id !== id));

  const clearDemoData = () => {
    if (window.confirm("Clear the sample data and start fresh?")) {
      setApps([]);
    }
  };

  // ─── Stats ───
  const active       = apps.filter(a => a.status === "Active").length;
  const total        = apps.length;
  const offers       = apps.filter(a => a.stage === "Offer").length;
  const interviews   = apps.filter(a => a.stage === "Multiple Rounds").length;
  const rejected     = apps.filter(a => a.status === "Rejected").length;
  const responseRate = total > 0
    ? Math.round(((total - apps.filter(a => a.stage === "Applied").length) / total) * 100)
    : 0;

  // ─── Filtering & Sorting ───
  let filtered = [...apps];
  if (filter !== "All")      filtered = filtered.filter(a => a.status === filter);
  if (stageFilter !== "All") filtered = filtered.filter(a => a.stage === stageFilter);
  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    filtered = filtered.filter(a => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q));
  }
  if (sortBy === "date_desc") filtered.sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied));
  if (sortBy === "date_asc")  filtered.sort((a, b) => new Date(a.dateApplied) - new Date(b.dateApplied));
  if (sortBy === "company")   filtered.sort((a, b) => a.company.localeCompare(b.company));

  // ─── Pipeline ───
  const pipeline = STAGES.map(s => ({ stage: s, count: apps.filter(a => a.stage === s && a.status === "Active").length }));

  if (!loaded) {
    return (
      <div style={{ background: "#0f0f1e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6c63ff", fontFamily: "'Space Mono', monospace" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ background: "#0f0f1e", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#e0e0ff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* ─── Header ─── */}
      <div style={{
        background: "linear-gradient(135deg, #12122a 0%, #1a1a35 100%)",
        borderBottom: "1px solid #2a2a4a", padding: "24px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: "'Space Mono', monospace", letterSpacing: -1 }}>
            <span style={{ color: "#6c63ff" }}>⬡</span> Job Tracker
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6666aa" }}>
            {total} application{total !== 1 ? "s" : ""} · {active} active
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {apps.some(a => a.id.startsWith("sample")) && (
            <button
              onClick={clearDemoData}
              style={{
                background: "transparent", border: "1px solid #3a2a2a", color: "#7a5a5a",
                borderRadius: 10, padding: "10px 16px", fontSize: 12, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Clear demo data
            </button>
          )}
          <button
            onClick={openNew}
            style={{
              background: "linear-gradient(135deg, #6c63ff, #5a4fff)", border: "none",
              color: "#fff", borderRadius: 10, padding: "10px 22px", fontSize: 13,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              boxShadow: "0 4px 20px rgba(108,99,255,0.3)",
            }}
          >
            + Add Application
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>

        {/* ─── Stats Row ─── */}
        <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard label="Total"         value={total}           icon="📊" accent="#6c63ff" />
          <StatCard label="Active"        value={active}          icon="🟢" accent="#4ade80" />
          <StatCard label="Interviews"    value={interviews}      icon="🎯" accent="#22d3ee" />
          <StatCard label="Offers"        value={offers}          icon="🏆" accent="#ffd666" />
          <StatCard label="Response Rate" value={`${responseRate}%`} icon="📈" accent="#b18cfe" sub={rejected > 0 ? `${rejected} rejected` : undefined} />
        </div>

        {/* ─── Pipeline Bar ─── */}
        <div style={{
          background: "#12122a", border: "1px solid #2a2a4a", borderRadius: 14,
          padding: "18px 22px", marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, color: "#6666aa", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1.5 }}>
            Active Pipeline
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "end", height: 48 }}>
            {pipeline.map((p, i) => (
              <div key={p.stage} style={{ flex: 1, textAlign: "center" }}>
                <div style={{
                  background: `linear-gradient(135deg, ${["#6ea8fe","#b18cfe","#6edcb6","#ffd666"][i]}, ${["#4a8aee","#9060ee","#40c090","#eeb840"][i]})`,
                  height: Math.max(6, p.count * 16), borderRadius: 6,
                  transition: "height 0.4s ease", margin: "0 auto", maxWidth: 80, minWidth: 30,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: p.count > 0 ? "#0f0f1e" : "transparent",
                }}>
                  {p.count}
                </div>
                <div style={{ fontSize: 10, color: "#6666aa", marginTop: 6 }}>{p.stage}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Filters ─── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="Search company or role..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, maxWidth: 240, background: "#12122a" }}
          />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...selectStyle, maxWidth: 150, background: "#12122a" }}>
            <option value="All">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{ ...selectStyle, maxWidth: 170, background: "#12122a" }}>
            <option value="All">All Stages</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...selectStyle, maxWidth: 160, background: "#12122a" }}>
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="company">Company A–Z</option>
          </select>
        </div>

        {/* ─── Application List ─── */}
        {filtered.length === 0 ? (
          <div style={{
            background: "#12122a", border: "1px dashed #2a2a4a", borderRadius: 14,
            padding: "60px 20px", textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ color: "#6666aa", fontSize: 15 }}>
              {total === 0 ? "No applications yet — add your first one!" : "No applications match your filters."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(app => (
              <div
                key={app.id}
                onClick={() => openEdit(app)}
                style={{
                  background: "linear-gradient(135deg, #14142a, #18182e)", border: "1px solid #2a2a4a",
                  borderRadius: 12, padding: "16px 20px", cursor: "pointer",
                  display: "grid", gridTemplateColumns: "1fr auto auto auto auto auto",
                  alignItems: "center", gap: 16, transition: "border-color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#6c63ff44"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a4a"}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#e0e0ff", display: "flex", alignItems: "center", gap: 8 }}>
                    {app.company}
                    {app.events && app.events.length > 0 && (
                      <span style={{
                        fontSize: 10, background: "#6c63ff22", color: "#6c63ff", padding: "2px 7px",
                        borderRadius: 10, fontWeight: 600, fontFamily: "'Space Mono', monospace",
                      }}>
                        {app.events.filter(e => e.completed).length}/{app.events.length}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "#6666aa", marginTop: 2 }}>{app.role || "—"}</div>
                </div>
                <div style={{ fontSize: 12, color: "#6666aa", minWidth: 80, textAlign: "center" }}>
                  {formatDate(app.dateApplied)}
                  <div style={{ fontSize: 10, color: "#4444aa", marginTop: 2 }}>{daysAgo(app.dateApplied)}</div>
                </div>
                <StagePill stage={app.stage} />
                <StatusBadge status={app.status} />
                <div style={{ fontSize: 13, color: "#6666aa", minWidth: 70, textAlign: "right", fontFamily: "'Space Mono', monospace" }}>
                  {app.salary ? `$${Number(app.salary).toLocaleString()}` : "—"}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteApp(app.id); }}
                  style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 16, padding: "4px 8px", borderRadius: 6 }}
                  onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                  onMouseLeave={e => e.currentTarget.style.color = "#444"}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Add / Edit Modal ─── */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null); }}
        title={editingId ? "Edit Application" : "New Application"}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Field label="Company">
            <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} style={inputStyle} placeholder="e.g. Anthropic" />
          </Field>
          <Field label="Role">
            <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inputStyle} placeholder="e.g. Product Designer" />
          </Field>
          <Field label="Date Applied">
            <input type="date" value={form.dateApplied} onChange={e => setForm(f => ({ ...f, dateApplied: e.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Salary">
            <input value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} style={inputStyle} placeholder="e.g. 120000" type="number" />
          </Field>
          <Field label="Stage">
            <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))} style={selectStyle}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Follow-up Date">
            <input type="date" value={form.followUp} onChange={e => setForm(f => ({ ...f, followUp: e.target.value }))} style={inputStyle} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
            placeholder="Interview prep, contacts, links..."
          />
        </Field>

        {/* ─── Interview Timeline ─── */}
        <div style={{ marginTop: 8, borderTop: "1px solid #2a2a4a", paddingTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#8888aa", textTransform: "uppercase", letterSpacing: 1, fontFamily: "'DM Sans', sans-serif" }}>
              Interview Timeline
            </label>
            <button
              onClick={() => {
                const newEvent = { id: generateId(), type: "other", date: new Date().toISOString().split("T")[0], note: "", completed: false };
                setForm(f => ({ ...f, events: [...(f.events || []), newEvent] }));
              }}
              style={{
                background: "transparent", border: "1px solid #3a3a5a", color: "#6c63ff",
                borderRadius: 8, padding: "5px 12px", fontSize: 11, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              }}
            >
              + Add Event
            </button>
          </div>

          {(!form.events || form.events.length === 0) ? (
            <div style={{ border: "1px dashed #2a2a4a", borderRadius: 10, padding: "20px", textAlign: "center", color: "#4a4a6a", fontSize: 13 }}>
              No events yet — add one to start tracking your interview journey
            </div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 24 }}>
              <div style={{
                position: "absolute", left: 8, top: 8, bottom: 8, width: 2,
                background: "linear-gradient(to bottom, #6c63ff33, #6c63ff11)", borderRadius: 1,
              }} />
              {[...(form.events || [])].sort((a, b) => new Date(a.date) - new Date(b.date)).map(evt => {
                const evtType = EVENT_TYPES.find(t => t.value === evt.type) || EVENT_TYPES[EVENT_TYPES.length - 1];
                return (
                  <div key={evt.id} style={{ position: "relative", marginBottom: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{
                      position: "absolute", left: -20, top: 10, width: 12, height: 12,
                      borderRadius: "50%", border: `2px solid ${evt.completed ? evtType.color : "#3a3a5a"}`,
                      background: evt.completed ? evtType.color : "#0f0f1e", zIndex: 1, transition: "all 0.2s",
                    }} />
                    <div style={{
                      flex: 1, background: evt.completed ? "#12122e" : "#10101e",
                      border: `1px solid ${evt.completed ? evtType.color + "33" : "#2a2a4a"}`,
                      borderRadius: 10, padding: "10px 14px", opacity: evt.completed ? 0.85 : 1, transition: "all 0.2s",
                    }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                        <select
                          value={evt.type}
                          onChange={e => setForm(f => ({ ...f, events: f.events.map(ev => ev.id === evt.id ? { ...ev, type: e.target.value } : ev) }))}
                          style={{ ...selectStyle, padding: "4px 8px", fontSize: 12, maxWidth: 160, background: "#0a0a1e", borderColor: evtType.color + "44" }}
                        >
                          {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                        </select>
                        <input
                          type="date" value={evt.date}
                          onChange={e => setForm(f => ({ ...f, events: f.events.map(ev => ev.id === evt.id ? { ...ev, date: e.target.value } : ev) }))}
                          style={{ ...inputStyle, padding: "4px 8px", fontSize: 12, maxWidth: 140, background: "#0a0a1e" }}
                        />
                        <button
                          onClick={() => setForm(f => ({ ...f, events: f.events.map(ev => ev.id === evt.id ? { ...ev, completed: !ev.completed } : ev) }))}
                          style={{
                            background: evt.completed ? evtType.color + "22" : "transparent",
                            border: `1px solid ${evt.completed ? evtType.color : "#3a3a5a"}`,
                            color: evt.completed ? evtType.color : "#5a5a7a",
                            borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, whiteSpace: "nowrap",
                          }}
                        >
                          {evt.completed ? "✓ Done" : "Mark Done"}
                        </button>
                        <button
                          onClick={() => setForm(f => ({ ...f, events: f.events.filter(ev => ev.id !== evt.id) }))}
                          style={{ background: "none", border: "none", color: "#3a3a5a", cursor: "pointer", fontSize: 14, padding: "2px 4px", marginLeft: "auto" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                          onMouseLeave={e => e.currentTarget.style.color = "#3a3a5a"}
                        >✕</button>
                      </div>
                      <input
                        value={evt.note || ""} placeholder="Add a note..."
                        onChange={e => setForm(f => ({ ...f, events: f.events.map(ev => ev.id === evt.id ? { ...ev, note: e.target.value } : ev) }))}
                        style={{
                          ...inputStyle, padding: "6px 10px", fontSize: 12, background: "#0a0a1e", borderColor: "#1a1a3a",
                          textDecoration: evt.completed ? "line-through" : "none",
                          color: evt.completed ? "#5a5a7a" : "#c0c0dd",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick-add buttons */}
          {editingId && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {[
                { type: "assessment",   label: "Assessment" },
                { type: "phone_screen", label: "Phone Screen" },
                { type: "interview",    label: "Interview" },
                { type: "technical",    label: "Technical" },
                { type: "offer",        label: "Offer" },
                { type: "follow_up",    label: "Follow-up" },
              ].map(q => {
                const evtType = EVENT_TYPES.find(t => t.value === q.type);
                return (
                  <button
                    key={q.type}
                    onClick={() => {
                      const newEvent = { id: generateId(), type: q.type, date: new Date().toISOString().split("T")[0], note: "", completed: false };
                      setForm(f => ({ ...f, events: [...(f.events || []), newEvent] }));
                    }}
                    style={{
                      background: "transparent", border: `1px solid ${evtType.color}33`,
                      color: evtType.color, borderRadius: 6, padding: "4px 10px",
                      fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      opacity: 0.7, transition: "opacity 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}
                  >
                    {evtType.icon} {q.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button
            onClick={() => { setModalOpen(false); setEditingId(null); }}
            style={{ background: "transparent", border: "1px solid #2a2a4a", color: "#8888aa", borderRadius: 10, padding: "10px 20px", fontSize: 13, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={saveApp}
            style={{
              background: "linear-gradient(135deg, #6c63ff, #5a4fff)", border: "none",
              color: "#fff", borderRadius: 10, padding: "10px 24px", fontSize: 13,
              cursor: "pointer", fontWeight: 600, boxShadow: "0 4px 20px rgba(108,99,255,0.3)",
            }}
          >
            {editingId ? "Save Changes" : "Add Application"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
