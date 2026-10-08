import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api, setToken, getToken } from "../api/client.js";

const AuthContext = createContext(null);

/**
 * Хранит сведения о текущем пользователе и токене доступа.
 * Токен сохраняется в localStorage, поэтому сессия переживает перезагрузку.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const profile = await api.me();
        if (!cancelled) setUser(profile);
      } catch {
        setToken(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setError(null);
    const result = await api.login(credentials);
    setToken(result.access_token);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (payload) => {
    setError(null);
    const result = await api.register(payload);
    setToken(result.access_token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const profile = await api.updateProfile(payload);
    setUser(profile);
    return profile;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      setError,
      isAuthenticated: Boolean(user),
      isStaff: user?.role?.name === "manager" || user?.role?.name === "admin",
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, loading, error, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth должен использоваться внутри AuthProvider");
  }
  return context;
}
