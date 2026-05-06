import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import PageHeader from "../../../components/common/PageHeader";
import { accessAPI } from "../../../services/api";

const MyAccess = () => {
  const [access, setAccess] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState("");

  useEffect(() => {
    Promise.all([accessAPI.getMyAccess(), accessAPI.getMyRequests()])
      .then(([accessRes, requestsRes]) => {
        setAccess(accessRes.data.access);
        setRequests(requestsRes.data.requests);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="My Access"
        subtitle="APIs you have been approved to use"
      />

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <>
          {/* Approved access with keys */}
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Active API Access ({access.length})
          </h3>

          {access.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-200 p-8 text-center mb-6">
              <p className="text-gray-400 text-sm">
                No approved access yet. Browse APIs and request access.
              </p>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {access.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 p-5"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">
                        {item.apiId?.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.apiId?.description}
                      </p>
                    </div>
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">
                      approved
                    </span>
                  </div>

                  {/* How to use */}
                  <div className="bg-gray-800 rounded p-3 mb-3">
                    <p className="text-xs text-gray-400 mb-1">
                      Gateway URL:
                    </p>
                    <code className="text-xs text-green-400">
                      http://localhost:5000/gateway/{item.apiId?._id}/your-endpoint
                    </code>
                  </div>

                  {/* API Key */}
                  {item.apiKeyId && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-medium">
                        Your API Key:
                      </p>
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                        <code className="text-xs text-gray-600 font-mono flex-1 truncate">
                          {item.apiKeyId.key}
                        </code>
                        <button
                          onClick={() => handleCopy(item.apiKeyId.key)}
                          className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                            copiedKey === item.apiKeyId.key
                              ? "bg-green-100 text-green-600"
                              : "bg-indigo-100 text-indigo-600"
                          }`}
                        >
                          {copiedKey === item.apiKeyId.key
                            ? "✅ Copied"
                            : "Copy"}
                        </button>
                      </div>

                      {/* Usage stats */}
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>
                          📡 {item.apiKeyId.totalRequests} requests made
                        </span>
                        <span>
                          🚦 {item.allKeys?.[0]?.rateLimit || item.apiKeyId?.rateLimit || 60} req/min limit
                        </span>
                        <span>
                          🆓 {item.apiId?.freeLimit} free requests
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* All requests history */}
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            All My Requests ({requests.length})
          </h3>

          {requests.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">No requests made yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-gray-500 text-xs uppercase">
                    <th className="px-4 py-3">API</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req._id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {req.apiId?.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {req.ownerId?.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            req.status === "approved"
                              ? "bg-green-50 text-green-600"
                              : req.status === "rejected"
                              ? "bg-red-50 text-red-500"
                              : "bg-yellow-50 text-yellow-600"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default MyAccess;