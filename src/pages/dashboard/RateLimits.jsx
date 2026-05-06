import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PageHeader from "../../components/common/PageHeader";
import { apiKeyAPI } from "../../services/api";

const RateLimitBar = ({ used, limit }) => {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  const barColor =
    percentage >= 90
      ? "bg-red-500"
      : percentage >= 70
      ? "bg-yellow-400"
      : "bg-green-400";

  const textColor =
    percentage >= 90
      ? "text-red-500"
      : percentage >= 70
      ? "text-yellow-500"
      : "text-green-500";

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className={`font-medium ${textColor}`}>
          {used} / {limit} requests this minute
        </span>
        <span className="text-gray-400">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const RateLimits = () => {
  const [keys, setKeys] = useState([]);
  const [usageData, setUsageData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [error, setError] = useState("");

  // Fetch all active keys
  const fetchKeys = useCallback(async () => {
    try {
      const res = await apiKeyAPI.getAll();
      const activeKeys = res.data.keys.filter(
        (k) => k.status === "active"
      );
      setKeys(activeKeys);
      return activeKeys;
    } catch (err) {
      console.error("Failed to fetch keys:", err);
      setError("Failed to load API keys");
      return [];
    }
  }, []);

  // Fetch real time usage for all active keys from Redis
  const fetchUsage = useCallback(async (keyList) => {
    if (!keyList || keyList.length === 0) return;

    try {
      const usagePromises = keyList.map((key) =>
        apiKeyAPI
          .getUsage(key._id)
          .then((res) => ({ keyId: key._id, data: res.data }))
          .catch(() => ({
            keyId: key._id,
            data: {
              currentUsage: 0,
              remaining: key.rateLimit,
              rateLimit: key.rateLimit,
              totalRequests: key.totalRequests,
            },
          }))
      );

      const results = await Promise.all(usagePromises);
      const usageMap = {};
      results.forEach(({ keyId, data }) => {
        usageMap[keyId] = data;
      });

      setUsageData(usageMap);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to fetch usage:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const activeKeys = await fetchKeys();
      await fetchUsage(activeKeys);
      setLoading(false);
    };
    init();
  }, [fetchKeys, fetchUsage]);

  // Auto refresh every 10 seconds
  useEffect(() => {
    if (keys.length === 0) return;
    const interval = setInterval(() => {
      fetchUsage(keys);
    }, 10000);
    return () => clearInterval(interval);
  }, [keys, fetchUsage]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    const activeKeys = await fetchKeys();
    await fetchUsage(activeKeys);
    setRefreshing(false);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Rate Limits"
        subtitle="Real-time request usage per API key"
        action={
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs text-gray-400">
                Updated {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white border border-gray-200 text-gray-600 text-sm px-3 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "🔄 Refresh"}
            </button>
          </div>
        }
      />

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
        <p className="text-sm font-medium text-blue-700 mb-1">
          ℹ️ How Rate Limiting Works
        </p>
        <p className="text-xs text-blue-600">
          Each API key has a request limit per minute. When a key hits
          its limit the gateway returns a 429 Too Many Requests error.
          The counter resets every minute automatically.
          Auto-refreshes every 10 seconds.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading keys...</p>
      ) : keys.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 text-sm mb-2">
            No active API keys found.
          </p>
          <p className="text-xs text-gray-400">
            Go to My APIs → select an API → generate a key first.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((key) => {
            const usage = usageData[key._id];

            return (
              <div
                key={key._id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-5"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      {key.name}
                    </h3>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">
                      {key.key.substring(0, 24)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">
                      active
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      Limit: {key.rateLimit} req/min
                    </p>
                  </div>
                </div>

                {/* Rate limit bar */}
                {usage ? (
                  <>
                    <RateLimitBar
                      used={usage.currentUsage || 0}
                      limit={usage.rateLimit || key.rateLimit}
                    />

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-50">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-800">
                          {usage.currentUsage || 0}
                        </p>
                        <p className="text-xs text-gray-400">
                          Used this min
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">
                          {usage.remaining ?? key.rateLimit}
                        </p>
                        <p className="text-xs text-gray-400">Remaining</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-indigo-600">
                          {usage.totalRequests || key.totalRequests || 0}
                        </p>
                        <p className="text-xs text-gray-400">All time</p>
                      </div>
                    </div>

                    {/* Warning if close to limit */}
                    {(usage.currentUsage || 0) >=
                      (usage.rateLimit || key.rateLimit) * 0.9 &&
                      (usage.currentUsage || 0) > 0 && (
                        <div className="mt-3 bg-red-50 border border-red-100 rounded px-3 py-2 text-xs text-red-600">
                          ⚠️ This key is close to its rate limit. Next
                          requests will be blocked until the minute resets.
                        </div>
                      )}
                  </>
                ) : (
                  <div className="text-xs text-gray-400 py-2 text-center">
                    Loading usage data...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default RateLimits;