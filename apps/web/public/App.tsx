
/// <reference types="vite/client" />
declare module "*.css";

import { useState } from "react";
import "./App.css";

type Scan = {
  id: string;
  submitted_url: string;
  normalized_url: string;
  risk_status: string;
  created_at: string;
};

function App() {
  const [url, setUrl] = useState("");
  const [scans, setScans] = useState<Scan[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API = "http://localhost:5000/api/v1";

  async function checkUrl(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/url-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save URL");
      }

      setMessage("URL saved successfully. Phishing analysis is pending.");
      setUrl("");
      await loadHistory();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Cannot connect to API. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const response = await fetch(`${API}/url-history`);

      if (!response.ok) {
        throw new Error("History request failed");
      }

      const data = await response.json();
      setScans(data.scans ?? []);
    } catch {
      setMessage(
        "Could not load history. Make sure the backend is running."
      );
    }
  }

  return (
    <main className="container">
      <header className="header">
        <div className="logo">LS</div>
        <div>
          <h1>LinkSentry</h1>
          <p>Explainable Phishing Risk Intelligence</p>
        </div>
        <span className="status">API project</span>
      </header>

      <section className="hero">
        <p className="eyebrow">URL SECURITY WORKSPACE</p>
        <h2>Check a suspicious link.</h2>
        <p className="subtitle">
          Submit a URL to validate it and save it for future risk analysis.
        </p>

        <form onSubmit={checkUrl} className="url-form">
          <input
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            required
            maxLength={2048}
            aria-label="URL to check"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Check URL"}
          </button>
        </form>

        {message && <p className="message" role="status">{message}</p>}

        <p className="disclaimer">
          This version saves URLs only. It does not yet determine whether a
          website is phishing. Do not open suspicious links to test them.
        </p>
      </section>

      <section className="history">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR ACTIVITY</p>
            <h2>Scan history</h2>
          </div>
          <button className="secondary" onClick={loadHistory} type="button">
            Refresh
          </button>
        </div>

        {scans.length === 0 ? (
          <p className="empty">No history loaded yet. Select Refresh to load saved URLs.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Submitted URL</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => (
                  <tr key={scan.id}>
                    <td>{scan.id}</td>
                    <td className="url-cell">{scan.submitted_url}</td>
                    <td>
                      <span className="pending">{scan.risk_status}</span>
                    </td>
                    <td>{new Date(scan.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer>LinkSentry · URL submission and history prototype</footer>
    </main>
  );
}

export default App;
