import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import { apisAPI, apiKeyAPI } from "../../services/api";

// Show API key with copy button
const KeyDisplay = ({ apiKey, onCopy, copied }) => (
  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-2 mt-2 w-full">
    <code className="text-xs text-gray-600 font-mono flex-1 truncate">
      {apiKey}
    </code>
    <button
      onClick={() => onCopy(apiKey)}
      className={`text-xs px-2 py-0.5 rounded transition ${
        copied === apiKey
          ? "bg-green-100 text-green-600"
          : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
      }`}
    >
      {copied === apiKey ? "✅ Copied" : "Copy"}
    </button>
  </div>
);

// Modal for generating a new key
const GenerateKeyModal = ({ onClose, onGenerated, apiName }) => {
  const [name, setName] = useState("");
  const [rateLimit, setRateLimit] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      onGenerated({ name, rateLimit });
      onClose();
    } catch (err) {
      setError("Failed to generate key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold text-gray-800">
            Generate Key for {apiName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production, Testing, Client A"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate Limit (requests/minute)
            </label>
            <input
              type="number"
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
              min="1"
              max="1000"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Max requests per minute for this key
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-md text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Key"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ApiKeys = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [api, setApi] = useState(null);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apisAPI
      .getOne(id)
      .then((res) => {
        setApi(res.data.api);
        setKeys(res.data.keys);
      })
      .catch(() => navigate("/apis"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleCopy = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const handleGenerate = async ({ name, rateLimit }) => {
    try {
      const res = await apisAPI.generateKey(id, { name, rateLimit });
      setKeys([res.data.apiKey, ...keys]);
    } catch (err) {
      setError("Failed to generate key");
    }
  };

  const handleRevoke = async (keyId) => {
    if (!window.confirm("Revoke this key? It stops working immediately."))
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

  const activeKeys = keys.filter((k) => k.status === "active").length;
  const totalRequests = keys.reduce((sum, k) => sum + k.totalRequests, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-gray-400 text-sm">Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Back button */}
      <button
        onClick={() => navigate("/apis")}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
      >
        ← Back to APIs
      </button>

      <PageHeader
        title={api?.name}
        subtitle={api?.description || api?.baseUrl}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
          >
            + Generate Key
          </button>
        }
      />

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* API Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Keys"
          value={keys.length}
          color="text-indigo-600"
          icon="🔑"
        />
        <StatCard
          label="Active Keys"
          value={activeKeys}
          color="text-green-600"
          icon="✅"
        />
        <StatCard
          label="Revoked Keys"
          value={keys.length - activeKeys}
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

      {/* API Info card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          API Details
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Base URL</p>
            <p className="text-gray-700 font-mono text-xs truncate">
              {api?.baseUrl}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Plan</p>
            <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-xs">
              {api?.plan}
            </span>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Status</p>
            <span
              className={`px-2 py-0.5 rounded text-xs ${
                api?.status === "active"
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {api?.status}
            </span>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Free Limit</p>
            <p className="text-gray-700 text-xs">{api?.freeLimit} requests</p>
          </div>
        </div>
      </div>

      {/* Gateway test hint */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <p className="text-xs text-gray-400 mb-1 font-medium">
          🧪 Test via Gateway
        </p>
        <code className="text-xs text-green-400 block">
          GET http://localhost:5000/gateway/{id}/your-endpoint
        </code>
        <code className="text-xs text-yellow-400 block mt-1">
          Header: x-api-key: YOUR_KEY_HERE
        </code>
      </div>

      {/* Keys list */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700">
            API Keys ({keys.length})
          </h3>
        </div>

        {keys.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-gray-400 text-sm mb-3">No keys yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
            >
              Generate First Key
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {keys.map((k) => (
              <div key={k._id} className="px-5 py-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Key name and status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-700">
                        {k.name}
                      </p>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          k.status === "active"
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-400"
                        }`}
                      >
                        {k.status}
                      </span>
                      <span className="text-xs text-gray-400">
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
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>📡 {k.totalRequests} requests</span>
                      <span>
                        🕐{" "}
                        {k.lastUsedAt
                          ? `Last used ${new Date(
                              k.lastUsedAt
                            ).toLocaleDateString()}`
                          : "Never used"}
                      </span>
                      <span>
                        📅 Created{" "}
                        {new Date(k.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
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
      </div>

      {/* Generate Key Modal */}
      {showModal && (
        <GenerateKeyModal
          onClose={() => setShowModal(false)}
          onGenerated={handleGenerate}
          apiName={api?.name}
        />
      )}
    </DashboardLayout>
  );
};

export default ApiKeys;