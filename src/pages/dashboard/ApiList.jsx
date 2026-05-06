import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { apisAPI } from "../../services/api";
import { Link } from "react-router-dom";

// Modal for creating a new API
const CreateApiModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    baseUrl: "",
    plan: "free",
    freeLimit: 1000,
    pricePerHundred: 0.5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apisAPI.create(formData);
      onCreated(res.data.api); // pass new api back to parent
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create API");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Modal overlay
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Create New API</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
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
              API Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Pokemon API"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What does this API do?"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base URL
            </label>
            <input
              type="url"
              name="baseUrl"
              value={formData.baseUrl}
              onChange={handleChange}
              required
              placeholder="https://pokeapi.co/api/v2"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan
              </label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Free Limit
              </label>
              <input
                type="number"
                name="freeLimit"
                value={formData.freeLimit}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
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
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create API"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ApiList = () => {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const fetchApis = () => {
    apisAPI
      .getAll()
      .then((res) => setApis(res.data.apis))
      .catch(() => setError("Failed to load APIs"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApis();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this API and all its keys?")) return;
    try {
      await apisAPI.delete(id);
      setApis(apis.filter((api) => api._id !== id));
    } catch (err) {
      alert("Failed to delete API");
    }
  };

  const handleCreated = (newApi) => {
    setApis([newApi, ...apis]); // add to top of list
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">My APIs</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your APIs and generate keys
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
        >
          + Create API
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading APIs...</p>
      ) : apis.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 text-sm">No APIs yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
          >
            Create your first API
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Base URL</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requests</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apis.map((api) => (
                <tr
                  key={api._id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {api.name}
                    {api.description && (
                      <p className="text-xs text-gray-400 font-normal">
                        {api.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {api.baseUrl}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-xs">
                      {api.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        api.status === "active"
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {api.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {api.totalRequests}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        to={`/apis/${api._id}`}
                        className="text-indigo-600 hover:underline text-xs"
                      >
                        Keys
                      </Link>
                      <button
                        onClick={() => handleDelete(api._id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create API Modal */}
      {showModal && (
        <CreateApiModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </DashboardLayout>
  );
};

export default ApiList;