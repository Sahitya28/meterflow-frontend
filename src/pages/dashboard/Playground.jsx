import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PageHeader from "../../components/common/PageHeader";
import { apisAPI, accessAPI, apiKeyAPI } from "../../services/api";
import { useAuth } from "../../store/authStore";
import axios from "axios";

const GATEWAY_URL = "http://localhost:5000/gateway";

const Playground = () => {
  const { user } = useAuth();
  const isOwner =
    user?.role === "api_owner" || user?.role === "admin";

  const [apis, setApis] = useState([]);
  const [selectedApi, setSelectedApi] = useState(null);
  const [keys, setKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [method, setMethod] = useState("GET");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responseTime, setResponseTime] = useState(null);
  const [statusCode, setStatusCode] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchApis = async () => {
      try {
        if (isOwner) {
          const res = await apisAPI.getAll();
          setApis(res.data.apis || []);
        } else {
          // Consumer - get approved access
          const res = await accessAPI.getMyAccess();
          const accessList = res.data.access || [];
          // Extract API objects from access list
          const apiList = accessList
            .filter((a) => a.apiId)
            .map((a) => ({
              _id: a.apiId._id,
              name: a.apiId.name,
              baseUrl: a.apiId.baseUrl,
              description: a.apiId.description,
              // Store keys directly on the api object
              consumerKeys: a.allKeys || [],
            }));
          setApis(apiList);
        }
      } catch (err) {
        console.error("Fetch APIs error:", err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchApis();
  }, [isOwner]);

  const handleSelectApi = async (api) => {
    setSelectedApi(api);
    setSelectedKey("");
    setResponse(null);
    setError("");
    setStatusCode(null);
    setResponseTime(null);

    try {
      if (isOwner) {
        // Owner gets keys from API detail
        const res = await apisAPI.getOne(api._id);
        const activeKeys = (res.data.keys || []).filter(
          (k) => k.status === "active"
        );
        setKeys(activeKeys);
      } else {
        // Consumer uses pre-loaded keys
        const activeKeys = (api.consumerKeys || []).filter(
          (k) => k.status === "active"
        );
        setKeys(activeKeys);
      }
    } catch (err) {
      console.error("Fetch keys error:", err);
      setKeys([]);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedApi) {
      setError("Please select an API first");
      return;
    }
    if (!selectedKey) {
      setError("Please select an API key first");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);
    setStatusCode(null);

    const startTime = Date.now();
    const cleanEndpoint = endpoint.startsWith("/")
      ? endpoint.slice(1)
      : endpoint;

    try {
      const gatewayUrl = `${GATEWAY_URL}/${selectedApi._id}/${cleanEndpoint}`;

      console.log("Sending to:", gatewayUrl);

      const res = await axios({
        method: method.toLowerCase(),
        url: gatewayUrl,
        headers: {
          "x-api-key": selectedKey,
          "Content-Type": "application/json",
        },
        timeout: 15000,
        validateStatus: () => true,
      });

      const elapsed = Date.now() - startTime;
      setResponseTime(elapsed);
      setStatusCode(res.status);
      setResponse(res.data);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      setResponseTime(elapsed);
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (code) => {
    if (!code) return "text-gray-500";
    if (code >= 200 && code < 300) return "text-green-600";
    if (code >= 400 && code < 500) return "text-yellow-600";
    return "text-red-500";
  };

  const getStatusBg = (code) => {
    if (!code) return "bg-gray-100 text-gray-600";
    if (code >= 200 && code < 300) return "bg-green-50 text-green-600";
    if (code >= 400 && code < 500)
      return "bg-yellow-50 text-yellow-600";
    return "bg-red-50 text-red-500";
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="API Playground"
        subtitle="Test your APIs directly from the dashboard — no Postman needed"
      />

      {pageLoading ? (
        <p className="text-gray-400 text-sm">Loading APIs...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left panel */}
          <div className="lg:col-span-1 space-y-4">

            {/* Step 1 - Select API */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3">
                Step 1 — Select API
              </p>
              {apis.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400">
                    {isOwner
                      ? "No APIs created yet. Go to My APIs to create one."
                      : "No approved access yet. Go to Browse APIs to request access."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {apis.map((api) => (
                    <button
                      key={api._id}
                      onClick={() => handleSelectApi(api)}
                      className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition ${
                        selectedApi?._id === api._id
                          ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent"
                      }`}
                    >
                      <p className="font-medium">{api.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {api.baseUrl}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2 - Select Key */}
            {selectedApi && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">
                  Step 2 — Select Key
                </p>
                {keys.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">
                    No active keys for this API.
                    {isOwner
                      ? " Go to API Keys to generate one."
                      : " Contact the API owner."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {keys.map((key) => (
                      <button
                        key={key._id}
                        onClick={() => setSelectedKey(key.key)}
                        className={`w-full text-left px-3 py-2.5 rounded-md transition ${
                          selectedKey === key.key
                            ? "bg-indigo-50 border border-indigo-200"
                            : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                        }`}
                      >
                        <p className="text-xs font-medium text-gray-700">
                          {key.name}
                        </p>
                        <p className="font-mono text-xs text-gray-400 mt-0.5 truncate">
                          {key.key.substring(0, 22)}...
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          🚦 {key.rateLimit} req/min ·{" "}
                          {key.totalRequests} used
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick endpoints */}
            {selectedApi && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">
                  Quick Endpoints
                </p>
                <div className="space-y-1">
                  {[
                    "pokemon/pikachu",
                    "pokemon/charizard",
                    "pokemon/bulbasaur",
                    "posts/1",
                    "users/1",
                    "products/1",
                    "todos/1",
                  ].map((ep) => (
                    <button
                      key={ep}
                      onClick={() => setEndpoint(ep)}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded font-mono transition ${
                        endpoint === ep
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      /{ep}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="lg:col-span-2 space-y-4">

            {/* Request builder */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-4">
                Step 3 — Build & Send Request
              </p>

              {/* Method + endpoint row */}
              <div className="flex gap-2 mb-4">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24 bg-white"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                </select>

                <div className="flex-1 flex items-center border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                  <span className="text-gray-400 px-2 text-xs whitespace-nowrap border-r border-gray-200 bg-gray-100 py-2">
                    /gateway/
                    {selectedApi?._id?.substring(0, 6) || "..."}
                    /
                  </span>
                  <input
                    type="text"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="pokemon/pikachu"
                    className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none text-gray-700"
                  />
                </div>
              </div>

              {/* Key being used */}
              {selectedKey ? (
                <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-4">
                  <p className="text-xs text-gray-400 mb-0.5">
                    Header: x-api-key
                  </p>
                  <p className="font-mono text-xs text-indigo-600 truncate">
                    {selectedKey}
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-100 rounded px-3 py-2 mb-4">
                  <p className="text-xs text-yellow-600">
                    ⚠️ No key selected. Select an API and key from the
                    left panel.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded mb-4">
                  ❌ {error}
                </div>
              )}

              <button
                onClick={handleSendRequest}
                disabled={loading || !selectedApi || !selectedKey}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? "⏳ Sending..." : "▶ Send Request"}
              </button>
            </div>

            {/* Response viewer */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">
                  Response
                </p>
                <div className="flex items-center gap-2">
                  {statusCode && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusBg(
                        statusCode
                      )}`}
                    >
                      {statusCode}
                    </span>
                  )}
                  {responseTime && (
                    <span className="text-xs text-gray-400">
                      ⚡ {responseTime}ms
                    </span>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="bg-gray-900 rounded-lg p-6 text-center">
                  <p className="text-green-400 text-sm animate-pulse">
                    Waiting for response...
                  </p>
                </div>
              ) : response ? (
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                  <pre className="text-xs text-green-400 whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-10 text-center border border-dashed border-gray-200">
                  <p className="text-2xl mb-2">🧪</p>
                  <p className="text-gray-400 text-sm">
                    Response will appear here
                  </p>
                  <p className="text-gray-300 text-xs mt-1">
                    Select an API → Pick a key → Enter endpoint →
                    Send
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Playground;