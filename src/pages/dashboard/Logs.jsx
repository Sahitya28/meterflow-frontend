import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PageHeader from "../../components/common/PageHeader";
import { usageAPI } from "../../services/api";

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

const StatusBadge = ({ code }) => {
  let color = "bg-gray-100 text-gray-600";
  if (code >= 200 && code < 300) color = "bg-green-50 text-green-600";
  else if (code >= 400 && code < 500) color = "bg-yellow-50 text-yellow-600";
  else if (code >= 500) color = "bg-red-50 text-red-500";

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {code}
    </span>
  );
};

const MethodBadge = ({ method }) => {
  const colors = {
    GET: "bg-blue-50 text-blue-600",
    POST: "bg-green-50 text-green-600",
    PUT: "bg-yellow-50 text-yellow-600",
    DELETE: "bg-red-50 text-red-500",
    PATCH: "bg-purple-50 text-purple-600",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${
        colors[method] || "bg-gray-100 text-gray-600"
      }`}
    >
      {method}
    </span>
  );
};

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        usageAPI.getLogs(),
        usageAPI.getStats(),
      ]);
      setLogs(logsRes.data.logs || []);
      setStats(statsRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Logs fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredLogs = logs.filter((log) => {
    if (filter === "success") return log.success === true;
    if (filter === "failed") return log.success === false;
    return true;
  });

  return (
    <DashboardLayout>
      <PageHeader
        title="Request Logs"
        subtitle="Every request going through your gateway"
        action={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchData}
              className="text-sm bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-50"
            >
              🔄 Refresh
            </button>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400">Total Requests</p>
          <p className="text-xl font-bold text-gray-800 mt-1">
            {stats?.totalRequests || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400">Successful</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {stats?.successRequests || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400">Failed</p>
          <p className="text-xl font-bold text-red-500 mt-1">
            {stats?.failedRequests || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400">Avg Latency</p>
          <p className="text-xl font-bold text-yellow-600 mt-1">
            {stats?.avgLatency || 0}ms
          </p>
        </div>
      </div>

      {/* Today stat */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 mb-6 flex justify-between items-center">
        <p className="text-sm text-indigo-700">
          📅 Requests today:{" "}
          <strong>{stats?.requestsToday || 0}</strong>
        </p>
        <p className="text-xs text-indigo-500">
          Auto-refreshes every 10 seconds
        </p>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-4">
        {["all", "success", "failed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm capitalize transition ${
              filter === f
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">
          Showing {filteredLogs.length} logs
        </span>
      </div>

      {/* Logs table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Loading logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No logs found. Make some requests through the gateway.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Endpoint</th>
                  <th className="px-4 py-3">API</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Key</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log._id}
                    className={`border-b border-gray-50 hover:bg-gray-50 ${
                      !log.success ? "bg-red-50/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <MethodBadge method={log.method} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 max-w-xs truncate">
                      {log.endpoint}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {log.apiId?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge code={log.statusCode} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {log.latency}ms
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {log.apiKey?.substring(0, 16)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {logs.length >= 100 && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Showing last 100 requests only.
        </p>
      )}
    </DashboardLayout>
  );
};

export default Logs;