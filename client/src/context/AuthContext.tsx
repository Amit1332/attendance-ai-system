import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  phone?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: String) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    // Listen to global logout event (from API client on token failure)
    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener("auth-logout", handleLogoutEvent);
    return () => {
      window.removeEventListener("auth-logout", handleLogoutEvent);
    };
  }, []);

  const login = async (email: string, password: String) => {
    const response = await api.post("/auth/login", { email, password });
    const { user: loggedInUser, tokens } = response.data.data;

    localStorage.setItem("accessToken", tokens.access.token);
    localStorage.setItem("refreshToken", tokens.refresh.token);
    localStorage.setItem("user", JSON.stringify(loggedInUser));

    setUser(loggedInUser);
    // Reload page to re-initialize socket with new token
    window.location.reload();
  };

  const register = async (userData: any) => {
    const response = await api.post("/auth/register", {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      role: userData.role,
    });
    const { user: registeredUser, tokens } = response.data.data;

    localStorage.setItem("accessToken", tokens.access.token);
    localStorage.setItem("refreshToken", tokens.refresh.token);
    localStorage.setItem("user", JSON.stringify(registeredUser));

    setUser(registeredUser);
    window.location.reload();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.warn("Logout request failed on server, cleaning up local storage anyway.");
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
      // Reload to clear socket connections
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
export type { User };
