import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PageHeader from "../../components/common/PageHeader";
import { userAPI } from "../../services/api";
import { useAuth } from "../../store/authStore";

const Account = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Delete form
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Status messages
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [deleteMsg, setDeleteMsg] = useState({ type: "", text: "" });

  // Loading states
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });
    setProfileLoading(true);

    try {
      await userAPI.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
      });
      setProfileMsg({
        type: "success",
        text: "Profile updated successfully. Please log in again to see changes.",
      });
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({
        type: "error",
        text: "New passwords do not match",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({
        type: "error",
        text: "New password must be at least 6 characters",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      await userAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMsg({
        type: "success",
        text: "Password changed successfully",
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to change password",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteMsg({ type: "", text: "" });
    setDeleteLoading(true);

    try {
      await userAPI.deleteAccount({ password: deletePassword });

      // Clear everything and redirect to register
      localStorage.clear();
      navigate("/register");
    } catch (err) {
      setDeleteMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to delete account",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Account Settings"
        subtitle="Manage your profile, password and account"
      />

      <div className="max-w-2xl space-y-6">

        {/* Profile info card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar placeholder */}
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                {user?.role}
              </span>
            </div>
          </div>

          {/* Update profile form */}
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Update Profile
          </h3>

          {profileMsg.text && (
            <div
              className={`text-sm px-4 py-3 rounded mb-4 ${
                profileMsg.type === "success"
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, email: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {profileLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change password card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Change Password
          </h3>

          {passwordMsg.text && (
            <div
              className={`text-sm px-4 py-3 rounded mb-4 ${
                passwordMsg.type === "success"
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                placeholder="Min 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                placeholder="Repeat new password"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {passwordLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* Sign out card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Sign Out
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Sign out of your account on this device.
          </p>
          <button
            onClick={handleLogout}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-200"
          >
            → Sign Out
          </button>
        </div>

        {/* Delete account card */}
        <div className="bg-white rounded-lg shadow-sm border border-red-100 p-6">
          <h3 className="text-sm font-semibold text-red-600 mb-2">
            Delete Account
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Permanently delete your account and all data including APIs,
            keys, logs and billing history. This cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-50 text-red-500 px-4 py-2 rounded-md text-sm hover:bg-red-100"
            >
              Delete My Account
            </button>
          ) : (
            <div>
              {deleteMsg.text && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded mb-4">
                  {deleteMsg.text}
                </div>
              )}

              <div className="bg-red-50 border border-red-100 rounded p-3 mb-4">
                <p className="text-xs text-red-600 font-medium">
                  ⚠️ This will permanently delete:
                </p>
                <ul className="text-xs text-red-500 mt-1 space-y-0.5 list-disc list-inside">
                  <li>Your account and profile</li>
                  <li>All your APIs</li>
                  <li>All API keys</li>
                  <li>All request logs</li>
                  <li>All billing history</li>
                </ul>
              </div>

              <form onSubmit={handleDeleteAccount} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full border border-red-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword("");
                      setDeleteMsg({ type: "", text: "" });
                    }}
                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-md text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading || !deletePassword}
                    className="flex-1 bg-red-600 text-white py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteLoading
                      ? "Deleting..."
                      : "Permanently Delete Account"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Account;