import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import StatCard from "../../../components/common/StatCard";
import PageHeader from "../../../components/common/PageHeader";
import { usageAPI, billingAPI, accessAPI } from "../../../services/api";
import { useAuth } from "../../../store/authStore";

const ConsumerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [myAccess, setMyAccess] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculate free tier usage percentage
const freeTierUsed = summary?.summary?.totalRequests || 0;
const freeTierLimit = 1000;
const freeTierPercentage = Math.min(
  (freeTierUsed / freeTierLimit) * 100,
  100
);
const isOverFreeLimit = freeTierUsed >= freeTierLimit;
const isNearFreeLimit =
  freeTierUsed >= freeTierLimit * 0.8 && !isOverFreeLimit;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, summaryRes, logsRes, accessRes, requestsRes] =
          await Promise.all([
            usageAPI.getStats(),
            billingAPI.getSummary(),
            usageAPI.getLogs(),
            accessAPI.getMyAccess(),
            accessAPI.getMyRequests(),
          ]);

        setStats(statsRes.data);
        setSummary(summaryRes.data);
        setLogs(logsRes.data.logs || []);
        setMyAccess(accessRes.data.access);
        setMyRequests(requestsRes.data.requests);
      } catch (error) {
        console.error("Consumer dashboard error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Pending requests consumer sent
  const pendingRequests = myRequests.filter((r) => r.status === "pending");
  const approvedAccess = myAccess.length;

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome, ${user?.name} 👋`}
        subtitle="Track your API usage and manage your access"
        action={
          <span className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-medium">
            Consumer
          </span>
        }
      />

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Loading dashboard...
        </div>
      ) : (
        <>
          {/* Pending requests notice */}
          {pendingRequests.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-6 flex justify-between items-center">
              <p className="text-sm text-yellow-700">
                ⏳ You have{" "}
                <strong>{pendingRequests.length} pending</strong> access
                request{pendingRequests.length > 1 ? "s" : ""} waiting for
                approval
              </p>
              <Link
                to="/my-access"
                className="text-sm text-yellow-700 font-medium hover:underline"
              >
                View →
              </Link>
            </div>
          )}

          {/* No access yet - prompt to browse */}
          {approvedAccess === 0 && pendingRequests.length === 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-4 mb-6">
              <p className="text-sm text-indigo-700 font-medium mb-1">
                🚀 Get started
              </p>
              <p className="text-xs text-indigo-600 mb-3">
                Browse available APIs and request access to start making
                requests through the gateway.
              </p>
              <Link
                to="/browse-apis"
                className="inline-block bg-indigo-600 text-white text-sm px-4 py-2 rounded hover:bg-indigo-700"
              >
                Browse APIs →
              </Link>
            </div>
          )}

          {/* Free tier warning banner */}
          {isOverFreeLimit && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-1">
                    🚨 Free Tier Exhausted
                  </p>
                  <p className="text-xs text-red-600">
                    You have used all {freeTierLimit.toLocaleString()} free
                    requests this month. Your requests are still going through
                    but charges are now applying at ₹0.50 per 100 requests.
                  </p>
                </div>
                <Link
                  to="/billing"
                  className="shrink-0 ml-4 bg-red-600 text-white text-xs px-3 py-1.5 rounded hover:bg-red-700"
                >
                  View Bill
                </Link>
              </div>
              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-red-100 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>
                <p className="text-xs text-red-500 mt-1">
                  {freeTierUsed.toLocaleString()} /{" "}
                  {freeTierLimit.toLocaleString()} requests used
                </p>
              </div>
            </div>
          )}

          {isNearFreeLimit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-yellow-700 mb-1">
                    ⚠️ Approaching Free Tier Limit
                  </p>
                  <p className="text-xs text-yellow-600">
                    You have used{" "}
                    <strong>{freeTierUsed.toLocaleString()}</strong> of your{" "}
                    {freeTierLimit.toLocaleString()} free requests this month.
                    Consider upgrading your plan.
                  </p>
                </div>
                <Link
                  to="/subscription"
                  className="shrink-0 ml-4 bg-yellow-600 text-white text-xs px-3 py-1.5 rounded hover:bg-yellow-700"
                >
                  Upgrade
                </Link>
              </div>
              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-yellow-100 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${freeTierPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  {freeTierUsed.toLocaleString()} /{" "}
                  {freeTierLimit.toLocaleString()} requests used (
                  {Math.round(freeTierPercentage)}%)
                </p>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="APIs I Use"
              value={approvedAccess}
              sub="approved access"
              color="text-indigo-600"
              icon="🔌"
            />
            <StatCard
              label="Total Requests"
              value={stats?.totalRequests || 0}
              sub="all time"
              color="text-blue-600"
              icon="📡"
            />
            <StatCard
              label="Today"
              value={stats?.requestsToday || 0}
              sub="last 24 hours"
              color="text-green-600"
              icon="📈"
            />
            <StatCard
              label="Amount Due"
              value={`₹${
                summary?.summary?.totalAmount?.toFixed(2) || "0.00"
              }`}
              sub="this month"
              color="text-red-500"
              icon="💳"
            />
          </div>

          {/* Second stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Successful"
              value={stats?.successRequests || 0}
              color="text-green-600"
              icon="✅"
            />
            <StatCard
              label="Failed"
              value={stats?.failedRequests || 0}
              color="text-red-500"
              icon="❌"
            />
            <StatCard
              label="Avg Latency"
              value={`${stats?.avgLatency || 0}ms`}
              color="text-yellow-600"
              icon="⚡"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
            {/* Billing summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  This Month's Bill
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
                  <span className="text-gray-500">Free tier used</span>
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
                  <span className="font-bold text-red-500">
                    ₹{summary?.summary?.totalAmount?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* My approved APIs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  My APIs
                </h3>
                <Link
                  to="/my-access"
                  className="text-xs text-indigo-600 hover:underline"
                >
                  View all →
                </Link>
              </div>

              {myAccess.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400 mb-2">
                    No API access yet
                  </p>
                  <Link
                    to="/browse-apis"
                    className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700"
                  >
                    Browse APIs
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myAccess.slice(0, 4).map((item) => (
                    <div
                      key={item._id}
                      className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {item.apiId?.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.apiKeyId?.totalRequests || 0} requests made
                        </p>
                      </div>
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">
                        active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent requests log */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Recent Requests
                </h3>
                <Link
                  to="/logs"
                  className="text-xs text-indigo-600 hover:underline"
                >
                  View all →
                </Link>
              </div>

              {logs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No requests yet. Start using your API keys!
                </p>
              ) : (
                <div className="space-y-2">
                  {logs.slice(0, 5).map((log) => (
                    <div
                      key={log._id}
                      className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                            log.success
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {log.statusCode}
                        </span>
                        <span className="font-mono text-xs text-gray-600 truncate">
                          {log.endpoint}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {log.latency}ms
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default ConsumerDashboard;