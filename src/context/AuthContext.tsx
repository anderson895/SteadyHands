import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'patient' | 'caregiver';

export interface AppUser {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  daily_goal: number;
}

interface AuthContextType {
  user: AppUser | null;
  login: (user: AppUser) => void;
  logout: () => void;
  updateUser: (data: Partial<AppUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const login = (u: AppUser) => setUser(u);
  const logout = () => setUser(null);
  const updateUser = (data: Partial<AppUser>) => setUser(prev => prev ? { ...prev, ...data } : prev);
  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
