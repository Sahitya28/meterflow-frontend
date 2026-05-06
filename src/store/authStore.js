import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          setLoading(false);
          return;
        }

        const res = await authAPI.getMe();
        setUser(res.data.user);
      } catch (err) {
        console.error("Auth init error:", err);

        // Only remove auth-related keys (not everything)
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // LOGIN
  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });

      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);

      setUser(res.data.user);

      return res.data;
    } catch (err) {
      console.error("Login error:", err);
      throw err.response?.data?.message || "Login failed";
    }
  };

  // REGISTER
  const register = async (name, email, password, role) => {
    try {
      const res = await authAPI.register({ name, email, password, role });

      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);

      setUser(res.data.user);

      return res.data;
    } catch (err) {
      console.error("Register error:", err);
      throw err.response?.data?.message || "Registration failed";
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.warn("Logout API failed, clearing locally");
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
    }
  };

  // Prevent UI flicker before auth is ready
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user, // useful shortcut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Safe hook
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};