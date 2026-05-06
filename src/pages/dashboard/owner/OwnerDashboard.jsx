import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import StatCard from "../../../components/common/StatCard";
import PageHeader from "../../../components/common/PageHeader";
import {
  apisAPI,
  usageAPI,
  billingAPI,
  accessAPI,
} from "../../../services/api";
import { useAuth } from "../../../store/authStore";

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [apis, setApis] = useState([]);
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [consumerUsage, setConsumerUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);

    try {
      // Fetch everything in parallel
      const [
        apisRes,
        statsRes,
        summaryRes,
        logsRes,
        requestsRes,
        usageRes,
      ] = await Promise.all([
        apisAPI.getAll(),
        usageAPI.getStats(),
        billingAPI.getSummary(), // this now auto-calculates billing
        usageAPI.getLogs(),
        accessAPI.getIncomingRequests(),
        accessAPI.getConsumerUsage(),
      ]);

      setApis(apisRes.data.apis);
      setStats(statsRes.data);
      setSummary(summaryRes.data);
      setLogs(logsRes.data.logs || []);
      setPendingRequests(
        requestsRes.data.requests.filter((r) => r.status === "pending")
      );
      setConsumerUsage(usageRes.data.usage);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Owner dashboard error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAll();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const activeApis = apis.filter((a) => a.status === "active").length;
  const totalConsumers = consumerUsage.length;
  const successRate =
    stats?.totalRequests > 0
      ? Math.round((stats.successRequests / stats.totalRequests) * 100)
      : 0;

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome back, ${user?.name} 👋`}
        subtitle="Here's what's happening across your APIs"
        action={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 text-sm px-3 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "🔄 Refresh"}
            </button>
            <span className="text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-medium">
              API Owner
            </span>
          </div>
        }
      />

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Loading dashboard...
        </div>
      ) : (
        <>
          {/* Pending requests alert */}
          {pendingRequests.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-6 flex justify-between items-center">
              <p className="text-sm text-yellow-700">
                ⏳ You have{" "}
                <strong>{pendingRequests.length} pending</strong> access
                request{pendingRequests.length > 1 ? "s" : ""} from
                consumers
              </p>
              <Link
                to="/access-requests"
                className="text-sm text-yellow-700 font-medium hover:underline"
              >
                Review →
              </Link>
            </div>
          )}

          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total APIs"
              value={apis.length}
              sub={`${activeApis} active`}
              color="text-indigo-600"
              icon="🔌"
            />
            <StatCard
              label="Total Consumers"
              value={totalConsumers}
              sub="approved access"
              color="text-purple-600"
              icon="👥"
            />
            <StatCard
              label="Total Requests"
              value={stats?.totalRequests || 0}
              sub="all time"
              color="text-blue-600"
              icon="📡"
            />
            <StatCard
              label="Requests Today"
              value={stats?.requestsToday || 0}
              sub="since midnight"
              color="text-green-600"
              icon="📈"
            />
          </div>

          {/* Second stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Successful"
              value={stats?.successRequests || 0}
              sub={`${successRate}% success rate`}
              color="text-green-600"
              icon="✅"
            />
            <StatCard
              label="Failed"
              value={stats?.failedRequests || 0}
              sub={`${100 - successRate}% error rate`}
              color="text-red-500"
              icon="❌"
            />
            <StatCard
              label="Avg Latency"
              value={`${stats?.avgLatency || 0}ms`}
              sub={
                (stats?.avgLatency || 0) < 300
                  ? "Good"
                  : (stats?.avgLatency || 0) < 600
                  ? "Moderate"
                  : "Slow"
              }
              color="text-yellow-600"
              icon="⚡"
            />
            <StatCard
              label="Amount Due"
              value={`₹${
                summary?.summary?.totalAmount?.toFixed(2) || "0.00"
              }`}
              sub="this month"
              color={
                (summary?.summary?.totalAmount || 0) > 0
                  ? "text-red-500"
                  : "text-green-600"
              }
              icon="💳"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
            {/* Billing summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Billing — {summary?.billingMonth}
                </h3>
                <Link
                  to="/billing"
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Full billing →
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total requests</span>
                  <span className="font-medium text-gray-700">
                    {summary?.summary?.totalRequests || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Free tier</span>
                  <span className="font-medium text-green-600">
                    {summary?.summary?.totalFreeRequests || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Billable</span>
                  <span className="font-medium text-orange-500">
                    {summary?.summary?.totalBillableRequests || 0}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="font-semibold text-sm text-gray-700">
                    Amount due
                  </span>
                  <span
                    className={`font-bold ${
                      (summary?.summary?.totalAmount || 0) > 0
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >
                    ₹
                    {summary?.summary?.totalAmount?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
              <div className="mt-4 bg-indigo-50 rounded p-3 text-xs text-indigo-600">
                First 1,000 requests free · ₹0.50 per 100 after
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* My APIs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  My APIs
                </h3>
                <Link
                  to="/apis"
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Manage →
                </Link>
              </div>

              {apis.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400 mb-2">No APIs yet</p>
                  <Link
                    to="/apis"
                    className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700"
                  >
                    Create your first API
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {apis.slice(0, 5).map((api) => (
                    <div
                      key={api._id}
                      className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {api.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {api.totalRequests} total requests
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            api.status === "active"
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {api.status}
                        </span>
                        <Link
                          to={`/apis/${api._id}`}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          Keys →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Consumer usage */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Consumer Usage
                </h3>
                <Link
                  to="/access-requests"
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Manage →
                </Link>
              </div>

              {consumerUsage.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400">
                    No consumers yet. Approve access requests to see usage here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {consumerUsage.slice(0, 5).map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {item.consumer?.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.api?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-indigo-600">
                          {item.key?.totalRequests || 0}
                        </p>
                        <p className="text-xs text-gray-400">requests</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent logs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Recent Gateway Requests
              </h3>
              <Link
                to="/logs"
                className="text-xs text-indigo-600 hover:underline"
              >
                View all →
              </Link>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No requests yet. Test the gateway using Postman.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                      <th className="pb-2 font-medium">Endpoint</th>
                      <th className="pb-2 font-medium">API</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Latency</th>
                      <th className="pb-2 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 8).map((log) => (
                      <tr
                        key={log._id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="py-2.5 font-mono text-xs text-gray-700 truncate max-w-xs">
                          {log.endpoint}
                        </td>
                        <td className="py-2.5 text-xs text-gray-500">
                          {log.apiId?.name || "—"}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs ${
                              log.success
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-500"
                            }`}
                          >
                            {log.statusCode}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-gray-500">
                          {log.latency}ms
                        </td>
                        <td className="py-2.5 text-xs text-gray-400">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default OwnerDashboard;