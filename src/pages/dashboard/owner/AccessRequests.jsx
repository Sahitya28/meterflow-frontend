import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import PageHeader from "../../../components/common/PageHeader";
import { accessAPI } from "../../../services/api";

const AccessRequests = () => {
  const [requests, setRequests] = useState([]);
  const [consumerUsage, setConsumerUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState("");
  const [activeTab, setActiveTab] = useState("requests");
  const [rateLimits, setRateLimits] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      const [reqRes, usageRes] = await Promise.all([
        accessAPI.getIncomingRequests(),
        accessAPI.getConsumerUsage(),
      ]);
      setRequests(reqRes.data.requests);
      setConsumerUsage(usageRes.data.usage);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (requestId) => {
    setProcessing(requestId);
    setError("");
    setSuccess("");
    try {
      await accessAPI.approve(requestId, {
        rateLimit: rateLimits[requestId] || 60,
      });
      setSuccess(`Access approved successfully`);

      // Update request status locally
      setRequests((prev) =>
        prev.map((r) =>
          r._id === requestId ? { ...r, status: "approved" } : r
        )
      );

      // Refresh to get updated consumer usage
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve request");
    } finally {
      setProcessing("");
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm("Reject this request?")) return;
    setProcessing(requestId);
    setError("");
    try {
      await accessAPI.reject(requestId);

      // Update locally
      setRequests((prev) =>
        prev.map((r) =>
          r._id === requestId ? { ...r, status: "rejected" } : r
        )
      );
    } catch (err) {
      setError("Failed to reject request");
    } finally {
      setProcessing("");
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <DashboardLayout>
      <PageHeader
        title="Consumer Management"
        subtitle="Approve access requests and monitor consumer usage"
        action={
          <button
            onClick={fetchData}
            className="text-sm bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-50"
          >
            🔄 Refresh
          </button>
        }
      />

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === "requests"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Access Requests
          {pendingRequests.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("usage")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === "usage"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Consumer Usage
          <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
            {consumerUsage.length}
          </span>
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : activeTab === "requests" ? (
        <>
          {/* Pending requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                ⏳ Pending Requests ({pendingRequests.length})
              </h3>
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req._id}
                    className="bg-white rounded-lg shadow-sm border border-yellow-100 p-5"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {req.consumerId?.name}
                          <span className="text-gray-400 font-normal ml-2 text-xs">
                            {req.consumerId?.email}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Wants access to:{" "}
                          <strong>{req.apiId?.name}</strong>
                        </p>
                        {req.reason && (
                          <p className="text-xs text-gray-400 mt-1 italic">
                            "{req.reason}"
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Requested:{" "}
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Rate limit input + buttons */}
                      <div className="flex gap-2 items-center flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            placeholder="60"
                            value={rateLimits[req._id] || ""}
                            onChange={(e) =>
                              setRateLimits({
                                ...rateLimits,
                                [req._id]: Number(e.target.value),
                              })
                            }
                            className="w-20 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                          <span className="text-xs text-gray-400">
                            req/min
                          </span>
                        </div>
                        <button
                          onClick={() => handleApprove(req._id)}
                          disabled={processing === req._id}
                          className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {processing === req._id ? "..." : "✅ Approve"}
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          disabled={processing === req._id}
                          className="bg-red-50 text-red-500 text-xs px-3 py-1.5 rounded hover:bg-red-100 disabled:opacity-50"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No pending */}
          {pendingRequests.length === 0 && (
            <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 mb-6">
              <p className="text-sm text-green-700">
                ✅ No pending requests right now
              </p>
            </div>
          )}

          {/* Processed requests */}
          {processedRequests.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Processed Requests ({processedRequests.length})
              </h3>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-left text-gray-500 text-xs uppercase">
                      <th className="px-4 py-3">Consumer</th>
                      <th className="px-4 py-3">API</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedRequests.map((req) => (
                      <tr
                        key={req._id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-700 text-sm">
                            {req.consumerId?.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {req.consumerId?.email}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {req.apiId?.name}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              req.status === "approved"
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-500"
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
            </div>
          )}

          {/* Empty state */}
          {requests.length === 0 && (
            <div className="bg-white rounded-lg border border-dashed border-gray-200 p-12 text-center">
              <p className="text-gray-400 text-sm">
                No access requests yet. Share your API ID with consumers.
              </p>
            </div>
          )}
        </>
      ) : (
        /* Consumer Usage Tab */
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Active Consumers ({consumerUsage.length})
          </h3>

          {consumerUsage.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-200 p-12 text-center">
              <p className="text-gray-400 text-sm">
                No consumers approved yet. Approve access requests first.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-gray-500 text-xs uppercase">
                    <th className="px-4 py-3">Consumer</th>
                    <th className="px-4 py-3">API</th>
                    <th className="px-4 py-3">Total Requests</th>
                    <th className="px-4 py-3">Rate Limit</th>
                    <th className="px-4 py-3">Last Used</th>
                    <th className="px-4 py-3">Key Status</th>
                  </tr>
                </thead>
                <tbody>
                  {consumerUsage.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-700">
                          {item.consumer?.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.consumer?.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {item.api?.name}
                      </td>
                      <td className="px-4 py-3 font-semibold text-indigo-600">
                        {item.key?.totalRequests || 0}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {item.key?.rateLimit} req/min
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {item.key?.lastUsedAt
                          ? new Date(
                              item.key.lastUsedAt
                            ).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            item.key?.status === "active"
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {item.key?.status || "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AccessRequests;