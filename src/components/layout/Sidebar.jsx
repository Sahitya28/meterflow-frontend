import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/authStore";;

const NavItem = ({ to, label, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
        isActive
          ? "bg-indigo-50 text-indigo-600"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <h1 className="text-xl font-bold text-indigo-600">MeterFlow</h1>
        <p className="text-xs text-gray-400 mt-0.5">API Billing Platform</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
      <NavItem to="/dashboard" label="Dashboard" icon="📊" />

      {/* Owner only links */}
      {(user?.role === "api_owner" || user?.role === "admin") && (
        <>
          <NavItem to="/apis" label="My APIs" icon="🔌" />
          <NavItem to="/access-requests" label="Consumers" icon="👥" />
          <NavItem to="/logs" label="Request Logs" icon="📋" />
          <NavItem to="/analytics" label="Analytics" icon="📈" />
          <NavItem to="/playground" label="API Playground" icon="🧪" />
        </>
      )}

      {/* Consumer only links */}
      {user?.role === "consumer" && (
        <>
          <NavItem to="/browse-apis" label="Browse APIs" icon="🔍" />
          <NavItem to="/my-access" label="My Access" icon="🔑" />
          <NavItem to="/logs" label="My Requests" icon="📋" />
          <NavItem to="/analytics" label="Analytics" icon="📈" />
          <NavItem to="/playground" label="API Playground" icon="🧪" />
        </>
      )}

      {/* Everyone sees billing and subscription */}
      <NavItem to="/billing" label="Billing" icon="💳" />
      <NavItem to="/subscription" label="Subscription" icon="⭐" />
      <NavItem to="/account" label="Account" icon="👤" />
    </nav>
      {/* User info */}
      {/* User info */}
<div className="px-4 py-4 border-t border-gray-200">
  <Link to="/account" className="flex items-center gap-3 mb-3 hover:opacity-80">
    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
      {user?.name?.charAt(0).toUpperCase()}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-700 truncate">
        {user?.name}
      </p>
      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
    </div>
  </Link>
  <button
    onClick={handleLogout}
    className="w-full text-left text-sm text-red-500 hover:text-red-600"
  >
    → Sign out
  </button>
</div>
    </div>
  );
};

export default Sidebar;