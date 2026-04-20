import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "@/lib/api";

type AppRole = "admin" | "kontributor" | "pembaca";

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
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, token: string) => Promise<{ error: any }>;
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

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      await api.post("/auth/register", { email, password, display_name: displayName });
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data?.error || "Registration failed" };
    }
  };

  const signIn = async (email: string, password: string, token: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password, token });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      setRole(data.user.role);
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data?.error || "Login failed" };
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

  return (
    <AuthContext.Provider value={{ user, role, loading, signUp, signIn, signInWithWhatsApp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
