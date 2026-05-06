import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./store/authStore";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import ApiList from "./pages/dashboard/ApiList";
import ApiKeys from "./pages/dashboard/ApiKeys";
import Logs from "./pages/dashboard/Logs";
import Billing from "./pages/dashboard/Billing";
import Analytics from "./pages/dashboard/Analytics";
import Subscription from "./pages/dashboard/Subscription";
import AllKeys from "./pages/dashboard/AllKeys";
import BrowseApis from "./pages/dashboard/consumer/BrowseApis";
import MyAccess from "./pages/dashboard/consumer/MyAccess";
import AccessRequests from "./pages/dashboard/owner/AccessRequests";
import Account from "./pages/dashboard/Account";
import Landing from "./pages/Landing";
import Playground from "./pages/dashboard/Playground";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  return user ? <Navigate to="/dashboard" /> : children;
};

// AppRoutes is separate so it can use useAuth inside AuthProvider
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/apis" element={<PrivateRoute><ApiList /></PrivateRoute>} />
      <Route path="/apis/:id" element={<PrivateRoute><ApiKeys /></PrivateRoute>} />

      <Route path="/keys" element={<PrivateRoute><AllKeys /></PrivateRoute>} />
      <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
      <Route path="/logs" element={<PrivateRoute><Logs /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
      <Route path="/subscription" element={<PrivateRoute><Subscription /></PrivateRoute>} />

      {/* Consumer routes */}
      <Route path="/browse-apis" element={<PrivateRoute><BrowseApis /></PrivateRoute>} />
      <Route path="/my-access" element={<PrivateRoute><MyAccess /></PrivateRoute>} />

      {/* Owner routes */}
      <Route path="/access-requests" element={<PrivateRoute><AccessRequests /></PrivateRoute>} />
      <Route
        path="/account"
        element={
          <PrivateRoute>
            <Account />
          </PrivateRoute>
        }
      />
      <Route
        path="/playground"
        element={
          <PrivateRoute>
            <Playground />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;