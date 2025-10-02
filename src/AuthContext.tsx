// contexts/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type Admin = {
  id: any;
  token: any;
};

type AuthContextType = {
  admin: Admin | null;
  loading: boolean; // 👈 new
  login: (id: number, token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(false);

  // Load admin from storage at startup
  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const storedAdmin = await AsyncStorage.getItem("admin");
        if (storedAdmin) {
          setAdmin(JSON.parse(storedAdmin)); 
          
        }
      } catch (e) {
      console.log("Error loading storage", e);
      setAdmin({ token: null, id: null});
      } finally {
        setLoading(false); // ✅ done checking
      }
    };
    loadAdmin();
  }, []);

  const login = async (id: number, token: string) => {
    const adminData = { id, token };
    setAdmin(adminData);
    await AsyncStorage.setItem("admin", JSON.stringify(adminData));
  };

  const logout = async () => {
    setAdmin(null);
    await AsyncStorage.removeItem("admin");
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
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
