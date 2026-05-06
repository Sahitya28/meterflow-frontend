/* eslint-disable */
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import PageHeader from "../../components/common/PageHeader";
import { usageAPI, billingAPI } from "../../services/api";

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      Promise.all([
        usageAPI.getStats(),
        billingAPI.getSummary(),
        usageAPI.getLogs(),
      ])
        .then(([statsRes, summaryRes, logsRes]) => {
          setStats(statsRes.data);
          setSummary(summaryRes.data);
          setLogs(logsRes.data.logs || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    };

    // Fetch immediately
    fetchData();

    // Auto refresh every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Calculate success rate percentage
  const successRate =
    stats?.totalRequests > 0
      ? Math.round((stats.successRequests / stats.totalRequests) * 100)
      : 0;

  // Group logs by endpoint to find most used
  const endpointCounts = logs.reduce((acc, log) => {
    acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
    return acc;
  }, {});

  const topEndpoints = Object.entries(endpointCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <DashboardLayout>
      <PageHeader
        title="Analytics"
        subtitle="Detailed usage breakdown and performance metrics"
      />

      {loading ? (
        <p className="text-gray-400 text-sm">Loading analytics...</p>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Requests"
              value={stats?.totalRequests || 0}
              color="text-indigo-600"
              icon="📡"
            />
            <StatCard
              label="Success Rate"
              value={`${successRate}%`}
              sub={`${stats?.successRequests || 0} successful`}
              color={successRate >= 90 ? "text-green-600" : "text-yellow-600"}
              icon="✅"
            />
            <StatCard
              label="Error Rate"
              value={`${100 - successRate}%`}
              sub={`${stats?.failedRequests || 0} failed`}
              color="text-red-500"
              icon="❌"
            />
            <StatCard
              label="Avg Latency"
              value={`${stats?.avgLatency || 0}ms`}
              sub={
                stats?.avgLatency < 200
                  ? "Good"
                  : stats?.avgLatency < 500
                  ? "Moderate"
                  : "Slow"
              }
              color={
                stats?.avgLatency < 200
                  ? "text-green-600"
                  : stats?.avgLatency < 500
                  ? "text-yellow-600"
                  : "text-red-500"
              }
              icon="⚡"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Success vs Failed donut using divs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Request Breakdown
              </h3>

              {stats?.totalRequests === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  No requests yet
                </p>
              ) : (
                <>
                  {/* Visual bar breakdown */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">✅ Successful</span>
                        <span className="font-medium text-green-600">
                          {stats?.successRequests || 0} ({successRate}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className="bg-green-400 h-3 rounded-full"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">❌ Failed</span>
                        <span className="font-medium text-red-500">
                          {stats?.failedRequests || 0} ({100 - successRate}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className="bg-red-400 h-3 rounded-full"
                          style={{ width: `${100 - successRate}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">📅 Today</span>
                        <span className="font-medium text-indigo-600">
                          {stats?.requestsToday || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className="bg-indigo-400 h-3 rounded-full"
                          style={{
                            width: `${
                              stats?.totalRequests > 0
                                ? (stats.requestsToday /
                                    stats.totalRequests) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between text-sm">
                    <span className="text-gray-500">Total all time</span>
                    <span className="font-bold text-gray-800">
                      {stats?.totalRequests || 0}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Top endpoints */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Top Endpoints
            </h3>

            {topEndpoints.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                No data yet
              </p>
            ) : (
              <div className="space-y-3">
                {topEndpoints.map(([endpoint, count], index) => {
                  const percentage =
                    logs.length > 0
                      ? Math.round((count / logs.length) * 100)
                      : 0;

                  return (
                    <div key={endpoint}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-mono text-xs text-gray-700 truncate max-w-xs">
                          {index + 1}. {endpoint}
                        </span>
                        <span className="text-gray-500 text-xs ml-2 shrink-0">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-indigo-400 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Analytics;