import { useEffect, useState } from "react";
import "./LostFoundPanel.css";

const API_URL = "http://127.0.0.1:8000";

function getCsrfToken() {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="));
  return cookie ? cookie.split("=")[1] : "";
}

export default function AdminDashboard({ onLogout }) {
  const [reports, setReports] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState("MATCHES"); // MATCHES | REPORTS | EXPIRED
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const fetchData = async () => {
    try {
      const [repRes, matchRes] = await Promise.all([
        fetch(`${API_URL}/api/reports/`, { credentials: "include" }),
        fetch(`${API_URL}/api/matches/`, { credentials: "include" }),
      ]);
      if (repRes.ok) setReports(await repRes.json());
      if (matchRes.ok) setMatches(await matchRes.json());
    } catch {
      notify("Could not fetch live data — verify Django server is running.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // FR-07: Approve or Reject Proposed Handover
  const handleHandoverDecision = async (matchId, decision) => {
    try {
      const res = await fetch(`${API_URL}/api/matches/${matchId}/decide/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken(),
        },
        body: JSON.stringify({ action: decision }), // "approve" or "reject"
      });

      if (res.ok) {
        notify(
          decision === "approve"
            ? "Handover APPROVED — Items marked RETURNED."
            : "Match REJECTED — Items kept in AVAILABLE storage."
        );
        fetchData();
      } else {
        notify("Action failed — check backend match endpoint.");
      }
    } catch {
      notify("Server connection error.");
    }
  };

  // FR-06 & FR-08: Update Item Status (AVAILABLE, MATCHED, RETURNED, EXPIRED)
  const handleStatusChange = async (reportId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/reports/${reportId}/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken(),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        notify(`Report #${reportId} updated to ${newStatus}.`);
        fetchData();
      }
    } catch {
      notify("Error updating report status.");
    }
  };

  const pendingMatches = matches.filter(
    (m) => !m.status || m.status === "PENDING" || m.status === "MATCHED"
  );

  const expiredReports = reports.filter(
    (r) => r.status === "EXPIRED" || r.is_expired || (r.days_elapsed ?? 0) > 30
  );

  const filteredReports = reports.filter((r) => {
    if (activeTab === "EXPIRED") {
      return r.status === "EXPIRED" || r.is_expired || (r.days_elapsed ?? 0) > 30;
    }
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    const q = search.toLowerCase();
    return (
      (r.item_name || r.title || "").toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      (r.route_or_bus || r.bus_route || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="lf-container">
      {/* Top Admin Header */}
      <div
        className="lf-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2>Supervisor Admin Dashboard (Mr. Alam)</h2>
          <p className="lf-subtitle">
            Match Notifications, Manual Handover Approval &amp; 30-Day Expiry Control
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <a
            href={`${API_URL}/admin/`}
            target="_blank"
            rel="noreferrer"
            className="lf-btn-secondary"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            Django DB Admin
          </a>
          <button className="lf-btn-danger" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {toast && <div className="lf-toast">{toast}</div>}

      {/* FR-08 Status Overview Cards */}
      <div className="lf-stats">
        <div className="lf-card">
          <span>Match Notifications (FR-05)</span>
          <strong className="lf-blue">{pendingMatches.length}</strong>
        </div>
        <div className="lf-card">
          <span>Available in Room (FR-08)</span>
          <strong>{reports.filter((r) => r.status === "AVAILABLE").length}</strong>
        </div>
        <div className="lf-card">
          <span>Returned Handovers (FR-07)</span>
          <strong style={{ color: "#15803d" }}>
            {reports.filter((r) => r.status === "RETURNED").length}
          </strong>
        </div>
        <div className="lf-card">
          <span>Expired (&gt;30 Days, FR-06)</span>
          <strong className="lf-red">{expiredReports.length}</strong>
        </div>
      </div>

      {/* Dashboard Navigation Tabs */}
      <div className="lf-toolbar">
        <div className="lf-tabs">
          <button
            className={activeTab === "MATCHES" ? "lf-tab active" : "lf-tab"}
            onClick={() => setActiveTab("MATCHES")}
          >
            Match Notifications ({pendingMatches.length})
          </button>
          <button
            className={activeTab === "REPORTS" ? "lf-tab active" : "lf-tab"}
            onClick={() => setActiveTab("REPORTS")}
          >
            All Reports ({reports.length})
          </button>
          <button
            className={activeTab === "EXPIRED" ? "lf-tab active" : "lf-tab"}
            onClick={() => setActiveTab("EXPIRED")}
          >
            30-Day Expired ({expiredReports.length})
          </button>
        </div>

        {activeTab !== "MATCHES" && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {activeTab === "REPORTS" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="MATCHED">MATCHED</option>
                <option value="RETURNED">RETURNED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            )}
            <input
              type="text"
              className="lf-search"
              placeholder="Search item, route, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* TAB 1: FR-05 Match Notifications & FR-07 Approve / Reject Handover */}
      {activeTab === "MATCHES" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {pendingMatches.length === 0 ? (
            <div className="lf-card" style={{ textAlign: "center", padding: "32px" }}>
              No pending smart matches right now.
            </div>
          ) : (
            pendingMatches.map((m) => (
              <div key={m.id} className="lf-card" style={{ borderLeft: "4px solid #2563eb" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <span className="lf-pill found">
                    Match #{m.id} • Confidence: {Math.round((m.score || m.confidence || 0.85) * 100)}%
                  </span>
                  <span className="lf-sub">{m.reason || "Matched by description & route"}</span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ background: "#f0f9ff", padding: "10px", borderRadius: "6px" }}>
                    <strong>FOUND #{m.found_item?.id}: {m.found_item?.item_name || m.found_item?.title}</strong>
                    <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>{m.found_item?.description}</p>
                    <div className="lf-sub">
                      Route: {m.found_item?.route_or_bus || m.found_item?.bus_route || "—"} | Date:{" "}
                      {m.found_item?.incident_date || "—"}
                    </div>
                  </div>

                  <div style={{ background: "#fffbeb", padding: "10px", borderRadius: "6px" }}>
                    <strong>LOST #{m.lost_item?.id}: {m.lost_item?.item_name || m.lost_item?.title}</strong>
                    <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>{m.lost_item?.description}</p>
                    <div className="lf-sub">
                      Route: {m.lost_item?.route_or_bus || m.lost_item?.bus_route || "—"} | Passenger:{" "}
                      {m.lost_item?.reporter_info || m.lost_item?.passenger_info || "—"}
                    </div>
                  </div>
                </div>

                <div className="lf-actions">
                  <button
                    className="lf-btn-primary"
                    style={{ background: "#16a34a" }}
                    onClick={() => handleHandoverDecision(m.id, "approve")}
                  >
                    Approve Handover (FR-07)
                  </button>
                  <button
                    className="lf-btn-danger"
                    onClick={() => handleHandoverDecision(m.id, "reject")}
                  >
                    Reject Match (FR-07)
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2 & 3: FR-03 Report Management, FR-06 Expiry & FR-08 Status Control */}
      {activeTab !== "MATCHES" && (
        <table className="lf-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Item &amp; Reporter</th>
              <th>Route &amp; Date</th>
              <th>Description</th>
              <th>Age (30d Limit)</th>
              <th>Status (FR-08)</th>
              <th>Admin Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className={`lf-pill ${(r.report_type || "found").toLowerCase()}`}>
                    {r.report_type || "ITEM"}
                  </span>
                </td>
                <td>
                  <strong>{r.item_name || r.title}</strong>
                  <div className="lf-sub">{r.reporter_info || r.driver_id || "—"}</div>
                </td>
                <td>
                  {r.route_or_bus || r.bus_route || "—"}
                  <div className="lf-sub">{r.incident_date || "—"}</div>
                </td>
                <td>{r.description}</td>
                <td>
                  {r.days_elapsed ?? 0} days
                  {(r.is_expired || (r.days_elapsed ?? 0) > 30) && (
                    <div className="lf-expired-tag">EXPIRED (&gt;30d)</div>
                  )}
                </td>
                <td>
                  <span className={`lf-status ${(r.status || "available").toLowerCase()}`}>
                    {r.status || "AVAILABLE"}
                  </span>
                </td>
                <td>
                  <select
                    value={r.status || "AVAILABLE"}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    style={{ padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="MATCHED">MATCHED</option>
                    <option value="RETURNED">RETURNED</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}