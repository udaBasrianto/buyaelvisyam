import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from "react";
import api from "@/lib/api";
import { getOfflineBackendMessage } from "@/lib/runtime-config";

type AppRole = "superadmin" | "admin" | "kontributor" | "pembaca";

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: AppRole;
  avatar_url?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: AppRole | null;
  loading: boolean;
  signInWithGoogle: (idToken: string, adminToken: string) => Promise<{ error: any }>;
  signInWithWhatsApp: (token: string, user: UserProfile) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      setRole(data.role);
    } catch (err) {
      console.error("Fetch me failed", err);
      signOut();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async (idToken: string, adminToken: string) => {
    try {
      const { data } = await api.post("/auth/google", { id_token: idToken, token: adminToken });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      setRole(data.user.role);
      return { error: null };
    } catch (error: any) {
      if (!error?.response) {
        return { error: getOfflineBackendMessage() };
      }
      return { error: error.response?.data?.error || "Google login gagal" };
    }
  };

  const signInWithWhatsApp = (token: string, user: UserProfile) => {
    localStorage.setItem("token", token);
    setUser(user);
    setRole(user.role);
  };

  const signOut = async () => {
    localStorage.removeItem("token");
    setUser(null);
    setRole(null);
  };

  const value = useMemo(() => ({
    user, role, loading, signInWithGoogle, signInWithWhatsApp, signOut,
  }), [user, role, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
