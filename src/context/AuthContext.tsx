import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  role: 'admin' | 'viewer' | null;
  login: (email: string | null, password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<'admin' | 'viewer' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing auth state
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const { isAuthenticated: storedIsAuthenticated, isAdmin: storedIsAdmin, role: storedRole } = JSON.parse(storedAuth);
      setIsAuthenticated(storedIsAuthenticated);
      setIsAdmin(storedIsAdmin);
      setRole(storedRole);
    }
  }, []);

  const login = async (email: string | null, password: string) => {
    try {
      setError(null);

      // Check if environment variables are defined
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
      const viewerPassword = import.meta.env.VITE_VIEWER_PASSWORD;
      if (!adminEmail || !adminPassword || !viewerPassword) {
        setError('Credentials not configured');
        return false;
      }

      // Admin login
      if (email && email === adminEmail && password === adminPassword) {
        setIsAuthenticated(true);
        setIsAdmin(true);
        setRole('admin');
        localStorage.setItem('auth', JSON.stringify({
          isAuthenticated: true,
          isAdmin: true,
          role: 'admin',
        }));
        return true;
      }

      // Viewer login (no email required)
      if (!email && password === viewerPassword) {
        setIsAuthenticated(true);
        setIsAdmin(false);
        setRole('viewer');
        localStorage.setItem('auth', JSON.stringify({
          isAuthenticated: true,
          isAdmin: false,
          role: 'viewer',
        }));
        return true;
      }

      setError('Invalid credentials. Please try again.');
      return false;
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setRole(null);
    localStorage.removeItem('auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, role, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}