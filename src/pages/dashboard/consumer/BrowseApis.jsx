import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import PageHeader from "../../../components/common/PageHeader";
import { accessAPI } from "../../../services/api";

const BrowseApis = () => {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState("");
  const [reason, setReason] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    accessAPI
      .browseApis()
      .then((res) => setApis(res.data.apis))
      .catch(() => setError("Failed to load APIs"))
      .finally(() => setLoading(false));
  }, []);

  const handleRequest = async (apiId) => {
    setRequesting(apiId);
    setError("");
    setMessage("");
    try {
      await accessAPI.requestAccess({
        apiId,
        reason: reason[apiId] || "",
      });
      setMessage("Access request sent! Wait for owner approval.");
      // Update status in list
      setApis(
        apis.map((api) =>
          api._id === apiId
            ? { ...api, requestStatus: "pending" }
            : api
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send request");
    } finally {
      setRequesting("");
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    const styles = {
      pending: "bg-yellow-50 text-yellow-600",
      approved: "bg-green-50 text-green-600",
      rejected: "bg-red-50 text-red-500",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Browse APIs"
        subtitle="Request access to APIs you want to use"
      />

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading APIs...</p>
      ) : apis.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 text-sm">
            No APIs available yet. Check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {apis.map((api) => (
            <div
              key={api._id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-5"
            >
              {/* API header */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  {api.name}
                </h3>
                {getStatusBadge(api.requestStatus)}
              </div>

              <p className="text-xs text-gray-400 mb-1">
                By {api.userId?.name || "Unknown"}
              </p>

              {api.description && (
                <p className="text-sm text-gray-500 mb-3">
                  {api.description}
                </p>
              )}

              {/* Plan info */}
              <div className="flex gap-3 text-xs mb-4">
                <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded">
                  {api.plan}
                </span>
                <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded">
                  {api.freeLimit} free requests
                </span>
              </div>

              {/* Request access section */}
              {!api.requestStatus && (
                <div>
                  <input
                    type="text"
                    placeholder="Why do you need access? (optional)"
                    value={reason[api._id] || ""}
                    onChange={(e) =>
                      setReason({ ...reason, [api._id]: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded px-3 py-1.5 text-xs mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                  <button
                    onClick={() => handleRequest(api._id)}
                    disabled={requesting === api._id}
                    className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {requesting === api._id
                      ? "Sending..."
                      : "Request Access"}
                  </button>
                </div>
              )}

              {api.requestStatus === "pending" && (
                <p className="text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded">
                  ⏳ Waiting for owner approval
                </p>
              )}

              {api.requestStatus === "approved" && (
                <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded">
                  ✅ You have access — check My Access tab
                </p>
              )}

              {api.requestStatus === "rejected" && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded">
                  ❌ Request was rejected by the owner
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default BrowseApis;