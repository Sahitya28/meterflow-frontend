import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import { apiKeyAPI } from "../../services/api";

// Show truncated key with copy button
const KeyDisplay = ({ apiKey, onCopy, copied }) => (
  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-2 mt-2 w-full">
    <code className="text-xs text-gray-600 font-mono flex-1 truncate">
      {apiKey}
    </code>
    <button
      onClick={() => onCopy(apiKey)}
      className={`text-xs px-2 py-0.5 rounded transition shrink-0 ${
        copied === apiKey
          ? "bg-green-100 text-green-600"
          : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
      }`}
    >
      {copied === apiKey ? "✅ Copied" : "Copy"}
    </button>
  </div>
);

const AllKeys = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, revoked

  useEffect(() => {
    apiKeyAPI
      .getAll()
      .then((res) => setKeys(res.data.keys))
      .catch(() => setError("Failed to load API keys"))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const handleRevoke = async (keyId) => {
    if (!window.confirm("Revoke this key? It will stop working immediately."))
      return;
    try {
      await apiKeyAPI.revoke(keyId);
      setKeys(
        keys.map((k) => (k._id === keyId ? { ...k, status: "revoked" } : k))
      );
    } catch (err) {
      setError("Failed to revoke key");
    }
  };

  const handleRotate = async (keyId) => {
    if (!window.confirm("Rotate this key? The old key stops working.")) return;
    try {
      const res = await apiKeyAPI.rotate(keyId);
      setKeys(keys.map((k) => (k._id === keyId ? res.data.apiKey : k)));
    } catch (err) {
      setError("Failed to rotate key");
    }
  };

  // Filter keys based on selected filter
  const filteredKeys = keys.filter((k) => {
    if (filter === "active") return k.status === "active";
    if (filter === "revoked") return k.status === "revoked";
    return true;
  });

  // Stats
  const activeKeys = keys.filter((k) => k.status === "active").length;
  const revokedKeys = keys.filter((k) => k.status === "revoked").length;
  const totalRequests = keys.reduce((sum, k) => sum + k.totalRequests, 0);

  return (
    <DashboardLayout>
      <PageHeader
        title="API Keys"
        subtitle="All your API keys across every API"
      />

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Keys"
          value={keys.length}
          color="text-indigo-600"
          icon="🔑"
        />
        <StatCard
          label="Active"
          value={activeKeys}
          color="text-green-600"
          icon="✅"
        />
        <StatCard
          label="Revoked"
          value={revokedKeys}
          color="text-red-500"
          icon="🚫"
        />
        <StatCard
          label="Total Requests"
          value={totalRequests}
          color="text-blue-600"
          icon="📡"
        />
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-700">
        <p className="font-medium mb-1">ℹ️ How to use your API key</p>
        <p className="text-xs text-blue-600">
          Send your key in the request header as{" "}
          <code className="bg-blue-100 px-1 rounded">x-api-key: YOUR_KEY</code>{" "}
          to{" "}
          <code className="bg-blue-100 px-1 rounded">
            http://localhost:5000/gateway/API_ID/endpoint
          </code>
        </p>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-4">
        {["all", "active", "revoked"].map((f) => (
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
          {filteredKeys.length} key{filteredKeys.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Keys list */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading keys...</p>
      ) : filteredKeys.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 text-sm mb-2">No keys found.</p>
          <p className="text-xs text-gray-400">
            Go to My APIs → select an API → generate a key there.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredKeys.map((k) => (
            <div
              key={k._id}
              className={`bg-white rounded-lg shadow-sm border p-5 ${
                k.status === "revoked"
                  ? "border-red-100 opacity-70"
                  : "border-gray-100"
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* Key name + badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">
                      {k.name}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        k.status === "active"
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-400"
                      }`}
                    >
                      {k.status}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                      {k.rateLimit} req/min
                    </span>
                  </div>

                  {/* Key value */}
                  <KeyDisplay
                    apiKey={k.key}
                    onCopy={handleCopy}
                    copied={copiedKey}
                  />

                  {/* Key stats */}
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                    <span>📡 {k.totalRequests} total requests</span>
                    <span>
                      🕐{" "}
                      {k.lastUsedAt
                        ? `Last used ${new Date(
                            k.lastUsedAt
                          ).toLocaleDateString()}`
                        : "Never used"}
                    </span>
                    <span>
                      📅 Created {new Date(k.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions - only for active keys */}
                {k.status === "active" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleRotate(k._id)}
                      className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2 py-1 rounded"
                    >
                      🔄 Rotate
                    </button>
                    <button
                      onClick={() => handleRevoke(k._id)}
                      className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-2 py-1 rounded"
                    >
                      🚫 Revoke
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AllKeys;