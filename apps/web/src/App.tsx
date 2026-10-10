
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ShieldCheck,
  LayoutDashboard,
  History,
  Settings,
  Link2,
  AlertTriangle,
  ShieldAlert,
  Search,
  RefreshCw,
  ExternalLink as ExternalLinkIcon,
  Activity,
  Radar,
  ScanSearch,
  Zap,
  Menu,
  X,
  Clock3,
  Globe,
  Shield,
} from "lucide-react";
import "./App.css";

type RiskLevel = "low" | "medium" | "high";

type Scan = {
  id: string | number;
  submitted_url: string;
  normalized_url: string;
  risk_status: string;
  risk_score: number | null;
  detection_reasons: string[] | null;
  created_at: string;
};

type Analysis = {
  risk_score: number;
  risk_status: RiskLevel;
  reasons: string[];
};

const API = "http://localhost:5000/api/v1";

const COLORS = {
  low: "#36efb0",
  medium: "#ffc857",
  high: "#ff5277",
};

export default function App() {
  const [url, setUrl] = useState("");
  const [scans, setScans] = useState<Scan[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [mobileMenu, setMobileMenu] = useState(false);

  async function loadHistory() {
    try {
      const response = await fetch(`${API}/url-history`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "History load failed");
      }

      setScans(data.scans ?? []);
    } catch {
      setMessage(
        "Cannot connect to backend. Make sure the API is running on port 5000."
      );
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  async function checkUrl(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setAnalysis(null);

    try {
      const response = await fetch(`${API}/url-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to analyze URL");
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
        setMessage("Analysis complete. Review the detected risk indicators.");
      } else {
        setMessage("URL saved, but analysis details were not returned.");
      }

      setUrl("");
      await loadHistory();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  const totalScans = scans.length;
  const lowCount = scans.filter((s) => s.risk_status === "low").length;
  const mediumCount = scans.filter((s) => s.risk_status === "medium").length;
  const highCount = scans.filter((s) => s.risk_status === "high").length;

  // Display names change; backend values remain low / medium / high.
  const pieData = [
    { name: "Safe", value: lowCount, color: COLORS.low },
    { name: "Suspicious", value: mediumCount, color: COLORS.medium },
    { name: "Malicious", value: highCount, color: COLORS.high },
  ];

  const trendData = useMemo(() => {
    const days: {
      date: string;
      low: number;
      medium: number;
      high: number;
    }[] = [];

    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);

      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

      days.push({ date: key, low: 0, medium: 0, high: 0 });
    }

    scans.forEach((scan) => {
      const date = new Date(scan.created_at);
      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const day = days.find((d) => d.date === key);

      if (day && ["low", "medium", "high"].includes(scan.risk_status)) {
        day[scan.risk_status as RiskLevel]++;
      }
    });

    return days.map((day) => {
      const parts = day.date.split("-").map(Number);

      return {
        Safe: day.low,
        Suspicious: day.medium,
        Malicious: day.high,
        label: new Date(parts[0], parts[1], parts[2]).toLocaleDateString(
          undefined,
          { month: "short", day: "numeric" }
        ),
      };
    });
  }, [scans]);

  const filteredScans = scans.filter((scan) => {
    const matchesSearch = scan.submitted_url
      .toLowerCase()
      .includes(historySearch.toLowerCase());

    const matchesRisk =
      riskFilter === "all" ||
      (riskFilter === "unknown"
        ? !["low", "medium", "high"].includes(scan.risk_status)
        : scan.risk_status === riskFilter);

    return matchesSearch && matchesRisk;
  });

  function riskLabel(level: string) {
    switch (level?.toLowerCase()) {
      case "low":
      case "safe":
        return "Safe";
      case "medium":
      case "suspicious":
        return "Suspicious";
      case "high":
      case "malicious":
        return "Malicious";
      default:
        return "Unknown";
    }
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  }

  return (
    <div className="app-shell" id="dashboard">
      {mobileMenu && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={27} />
          </div>
          <div>
            <h1>
              Link<span>Sentry</span>
            </h1>
            <p>THREAT INTELLIGENCE</p>
          </div>
          <button
            className="mobile-close"
            aria-label="Close menu"
            onClick={() => setMobileMenu(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="side-nav">
          <button
            className="nav-link active"
            onClick={() => scrollTo("dashboard")}
          >
            <LayoutDashboard size={19} /> Dashboard
          </button>
          <button className="nav-link" onClick={() => scrollTo("url-scanner")}>
            <ScanSearch size={19} /> URL Scanner
          </button>
          <button className="nav-link" onClick={() => scrollTo("scan-history")}>
            <History size={19} /> Scan History
          </button>
          <button className="nav-link" onClick={() => scrollTo("analytics")}>
            <Activity size={19} /> Analytics
          </button>
          <button className="nav-link" onClick={() => scrollTo("about")}>
            <Settings size={19} /> About
          </button>
        </nav>

        <div className="sidebar-status">
          <div className="status-orbit">
            <Radar size={29} />
          </div>
          <span className="live-indicator">
            <i /> SYSTEM ONLINE
          </span>
          <h3>Link protection</h3>
          <p>URL threat analysis engine</p>
          <div className="status-line">
            <span>API endpoint</span>
            <strong>localhost:5000</strong>
          </div>
        </div>

        <div className="sidebar-footer">
          <ShieldCheck size={22} />
          <div>
            <strong>Stay alert. Stay secure.</strong>
            <p>Security intelligence workspace</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={22} />
            </button>
            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-slash">/</span>
              <strong>Overview</strong>
            </div>
          </div>

          <div className="topbar-right">
            <span className="connection-status">
              <i /> API WORKSPACE
            </span>
            <div className="avatar">LS</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">
                <Zap size={14} /> CYBER DEFENSE CENTER
              </p>
              <h2>
                Threat <span>Intelligence.</span>
              </h2>
              <p className="welcome-description">
                Monitor suspicious links, analyze risk patterns, and explore
                your URL security activity.
              </p>
            </div>

            <button
              className="refresh-btn"
              onClick={() => void loadHistory()}
              disabled={loading}
            >
              <RefreshCw size={16} /> Refresh data
            </button>
          </section>

          {message && (
            <div
              className={`notice ${
                message.toLowerCase().includes("cannot connect")
                  ? "notice-error"
                  : ""
              }`}
              role="status"
            >
              <Activity size={17} />
              <span>{message}</span>
              <button
                aria-label="Dismiss message"
                onClick={() => setMessage("")}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <section className="stats-grid">
            <article className="stat-card stat-blue">
              <div className="stat-top">
                <span>Total scans</span>
                <div className="stat-icon">
                  <Link2 size={20} />
                </div>
              </div>
              <div className="stat-number">{totalScans}</div>
              <p>Saved scan records</p>
              <div className="stat-bottom">
                <span className="stat-indicator">DATABASE</span>
                <Activity size={45} />
              </div>
            </article>

            <article className="stat-card stat-green">
              <div className="stat-top">
                <span>Safe</span>
                <div className="stat-icon">
                  <ShieldCheck size={20} />
                </div>
              </div>
              <div className="stat-number">{lowCount}</div>
              <p>No configured risk indicators</p>
              <div className="stat-bottom">
                <span className="stat-indicator">SAFE</span>
                <ShieldCheck size={45} />
              </div>
            </article>

            <article className="stat-card stat-yellow">
              <div className="stat-top">
                <span>Suspicious</span>
                <div className="stat-icon">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <div className="stat-number">{mediumCount}</div>
              <p>Investigate these URLs</p>
              <div className="stat-bottom">
                <span className="stat-indicator">SUSPICIOUS</span>
                <AlertTriangle size={45} />
              </div>
            </article>

            <article className="stat-card stat-red">
              <div className="stat-top">
                <span>Malicious</span>
                <div className="stat-icon">
                  <ShieldAlert size={20} />
                </div>
              </div>
              <div className="stat-number">{highCount}</div>
              <p>High-risk URLs detected</p>
              <div className="stat-bottom">
                <span className="stat-indicator">MALICIOUS</span>
                <ShieldAlert size={45} />
              </div>
            </article>
          </section>

          <section className="scanner-layout" id="url-scanner">
            <article className="panel scanner-panel">
              <div className="panel-heading">
                <div className="heading-icon">
                  <ScanSearch size={21} />
                </div>
                <div>
                  <h3>Advanced URL Scanner</h3>
                  <p>Inspect a link using your LinkSentry analysis engine</p>
                </div>
                <span className="small-tag">RULE ENGINE</span>
              </div>

              <form onSubmit={checkUrl} className="quick-form">
                <label htmlFor="url-input">TARGET URL</label>
                <div className="scanner-input-wrap">
                  <Globe size={19} />
                  <input
                    id="url-input"
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com"
                    required
                    maxLength={2048}
                  />
                </div>
                <button type="submit" disabled={loading}>
                  {loading ? (
                    <RefreshCw className="spin" size={18} />
                  ) : (
                    <ScanSearch size={18} />
                  )}
                  {loading ? "Analyzing URL..." : "Initiate security scan"}
                </button>
              </form>

              <div className="scanner-footnote">
                <ShieldCheck size={15} />
                <span>HTTP/HTTPS URL analysis · Rule-based detection</span>
                <span className="scanner-ready">
                  <i /> READY
                </span>
              </div>

              {analysis && (
                <div className="analysis-result">
                  <div className="analysis-result-heading">
                    <div>
                      <p className="eyebrow">SCAN RESULT</p>
                      <h3>Analysis completed</h3>
                    </div>
                    <span className={`risk-pill ${analysis.risk_status}`}>
                      {riskLabel(analysis.risk_status)}
                    </span>
                  </div>

                  <div className="risk-score-row">
                    <div className="risk-score-number">
                      {analysis.risk_score}
                      <span>/100</span>
                    </div>
                    <div className="risk-score-meter">
                      <div
                        className={`risk-meter-fill ${analysis.risk_status}`}
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, analysis.risk_score)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <h4>Detection indicators</h4>
                  {analysis.reasons.length ? (
                    <ul className="reason-list">
                      {analysis.reasons.map((reason, index) => (
                        <li key={`${index}-${reason}`}>
                          <AlertTriangle size={15} /> {reason}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No configured warning rules were triggered.</p>
                  )}
                </div>
              )}
            </article>

            <article className="panel radar-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">THREAT MONITOR</p>
                  <h3>Security radar</h3>
                </div>
                <span className="radar-live">
                  <i /> LIVE
                </span>
              </div>

              <div className="radar-visual">
                <div className="radar-ring ring-one" />
                <div className="radar-ring ring-two" />
                <div className="radar-ring ring-three" />
                <div className="radar-cross cross-horizontal" />
                <div className="radar-cross cross-vertical" />
                <div className="radar-sweep" />
                <div className="radar-center">
                  <Shield size={33} />
                </div>
                <i className="radar-blip blip-one" />
                <i className="radar-blip blip-two" />
                <i className="radar-blip blip-three" />
              </div>

              <div className="radar-caption">
                <span>
                  <i /> SCAN ENGINE
                </span>
                <strong>Local analysis active</strong>
              </div>
              <p className="radar-note">
                Radar is a visual interface indicator, not a live network
                threat feed.
              </p>
            </article>
          </section>

          <section className="content-grid" id="analytics">
            <article className="panel trend-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">ACTIVITY OVERVIEW</p>
                  <h3>
                    <Activity size={19} /> Risk trend
                  </h3>
                  <p>Scans recorded per day · last 7 days</p>
                </div>
                <span className="small-tag">HISTORY DATA</span>
              </div>

              <div className="chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="#1b2b45"
                      strokeDasharray="4 4"
                    />
                    <XAxis
                      dataKey="label"
                      stroke="#8295b4"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="#8295b4"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0b1728",
                        border: "1px solid #28405e",
                        borderRadius: 10,
                        color: "#eef5ff",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Safe"
                      name="Safe"
                      stroke={COLORS.low}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Suspicious"
                      name="Suspicious"
                      stroke={COLORS.medium}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Malicious"
                      name="Malicious"
                      stroke={COLORS.high}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-legend">
                <span>
                  <i className="legend-low" /> Safe
                </span>
                <span>
                  <i className="legend-medium" /> Suspicious
                </span>
                <span>
                  <i className="legend-high" /> Malicious
                </span>
              </div>
            </article>

            <article className="panel distribution-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">SCAN CLASSIFICATION</p>
                  <h3>
                    <Radar size={19} /> Risk distribution
                  </h3>
                  <p>Classification of saved records</p>
                </div>
              </div>

              <div className="donut-area">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="62%"
                      outerRadius="86%"
                      paddingAngle={4}
                      stroke="none"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#0b1728",
                        border: "1px solid #28405e",
                        borderRadius: 10,
                        color: "#eef5ff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <strong>{totalScans}</strong>
                  <span>Total scans</span>
                </div>
              </div>

              <div className="distribution-list">
                {pieData.map((item) => (
                  <div className="distribution-row" key={item.name}>
                    <span>
                      <i style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="panel history-panel" id="scan-history">
            <div className="panel-heading history-heading">
              <div>
                <p className="eyebrow">DATABASE RECORDS</p>
                <h3>
                  <History size={19} /> Scan history
                </h3>
                <p>Search, filter and review previously analyzed URLs</p>
              </div>
              <span className="small-tag">
                {filteredScans.length} RECORDS
              </span>
            </div>

            <div className="table-controls">
              <div className="search-box">
                <Search size={17} />
                <input
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="Search URL..."
                  aria-label="Search scan history"
                />
              </div>

              <select
                value={riskFilter}
                onChange={(event) => setRiskFilter(event.target.value)}
                aria-label="Filter by risk level"
              >
                <option value="all">All classifications</option>
                <option value="low">Safe</option>
                <option value="medium">Suspicious</option>
                <option value="high">Malicious</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            {filteredScans.length === 0 ? (
              <div className="empty-state">
                <ShieldCheck size={36} />
                <p>No matching scans found.</p>
                <span>Scan a URL or change your search filters.</span>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Submitted URL</th>
                      <th>Risk status</th>
                      <th>Risk score</th>
                      <th>Detection reasons</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScans.map((scan) => (
                      <tr key={scan.id}>
                        <td className="id-cell">#{scan.id}</td>
                        <td className="url-cell">
                          <Link2 size={14} />
                          <span title={scan.submitted_url}>
                            {scan.submitted_url}
                          </span>
                          <a
                            href={scan.normalized_url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open URL in a new tab"
                          >
                            <ExternalLinkIcon size={13} />
                          </a>
                        </td>
                        <td>
                          <span className={`risk-pill ${scan.risk_status}`}>
                            {riskLabel(scan.risk_status)}
                          </span>
                        </td>
                        <td>
                          {scan.risk_score == null
                            ? "—"
                            : `${scan.risk_score}/100`}
                        </td>
                        <td className="reasons-cell">
                          {scan.detection_reasons == null
                            ? "No saved reasons"
                            : scan.detection_reasons.length > 0
                              ? scan.detection_reasons.join(", ")
                              : "No warnings"}
                        </td>
                        <td className="date-cell">
                          <Clock3 size={13} />
                          {new Date(scan.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer className="app-footer" id="about">
            <span>
              <ShieldCheck size={16} /> LinkSentry · URL Security Intelligence
            </span>
            <span>
              Rule-based analysis · Risk scores are estimates, not guarantees
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}