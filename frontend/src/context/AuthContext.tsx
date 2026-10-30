import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthUser, UserRole } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  loginAsDemo: (role: string, warehouseCode?: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  role: UserRole;
  setRole: (role: UserRole) => void;
  managedNodeId: string;
  setManagedNodeId: (id: string) => void;
  warehouses: any[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('tier1_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('tier1_token'));
  const [role, setRole] = useState<UserRole>((user?.role as UserRole) || 'UNASSIGNED');
  const [managedNodeId, setManagedNodeId] = useState<string>('');
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    fetch(`${BASE_URL}/api/v1/warehouses`)
      .then(res => res.json())
      .then(data => {
        const nodes = data.data || [];
        setWarehouses(nodes);
        setManagedNodeId(prev => prev || user?.warehouseId || nodes[0]?.id || '');
      })
      .catch(err => console.error('Failed to load nodes:', err));
  }, [user?.id]);

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      const data = await api.post('/api/v1/auth/google', { credential });
      if (!data.data) throw new Error(data.message || 'Login failed');

      const { token: newToken, user: newUser } = data.data;
      setToken(newToken);
      setUser(newUser);
      setRole(newUser.role as UserRole);
      if (newUser.warehouseId) setManagedNodeId(newUser.warehouseId);

      localStorage.setItem('tier1_token', newToken);
      localStorage.setItem('tier1_user', JSON.stringify(newUser));
      return true;
    } catch (err) {
      console.error('Google Auth Error:', err);
      return false;
    }
  };

  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await api.post('/api/v1/auth/login', { email, password });
      if (!data.data) throw new Error(data.message || 'Login failed');

      const { token: newToken, user: newUser } = data.data;
      setToken(newToken);
      setUser(newUser);
      setRole(newUser.role as UserRole);
      if (newUser.warehouseId) setManagedNodeId(newUser.warehouseId);

      localStorage.setItem('tier1_token', newToken);
      localStorage.setItem('tier1_user', JSON.stringify(newUser));
      return true;
    } catch (err) {
      console.error('Credentials Auth Error:', err);
      return false;
    }
  };

  /**
   * One-Click Demo / Evaluation Gateway.
   * Authenticates evaluation roles (GLOBAL_ADMIN, NODE_MANAGER, AUDITOR) instantly.
   */
  const loginAsDemo = async (roleName: string, warehouseCode = 'DEL-01'): Promise<boolean> => {
    try {
      const data = await api.post('/api/v1/auth/demo-login', { role: roleName, warehouseCode });
      if (!data.data) throw new Error(data.message || 'Demo login failed');

      const { token: newToken, user: newUser } = data.data;
      setToken(newToken);
      setUser(newUser);
      setRole(newUser.role as UserRole);
      if (newUser.warehouseId) setManagedNodeId(newUser.warehouseId);

      localStorage.setItem('tier1_token', newToken);
      localStorage.setItem('tier1_user', JSON.stringify(newUser));
      return true;
    } catch (err) {
      console.error('Demo Login Error:', err);
      return false;
    }
  };

  const refreshUser = useCallback(async (): Promise<void> => {
    const storedToken = localStorage.getItem('tier1_token');
    if (!storedToken) return;
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      const data = await res.json();
      if (data.data) {
        const updatedUser = data.data as AuthUser;
        setUser(updatedUser);
        setRole(updatedUser.role as UserRole);
        localStorage.setItem('tier1_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Failed to refresh user session', err);
    }
  }, []);

  const logout = () => {
    setUser(null);
    setToken(null);
    setManagedNodeId('');
    setWarehouses([]);
    localStorage.removeItem('tier1_token');
    localStorage.removeItem('tier1_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user, token, loginWithGoogle, loginWithCredentials, loginAsDemo, logout, refreshUser,
        role, setRole, managedNodeId, setManagedNodeId, warehouses
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
