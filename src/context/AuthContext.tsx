import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing auth state
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const { isAuthenticated: storedIsAuthenticated, isAdmin: storedIsAdmin } = JSON.parse(storedAuth);
      setIsAuthenticated(storedIsAuthenticated);
      setIsAdmin(storedIsAdmin);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);

      // Check if the credentials match the admin credentials
      const isAdminUser = email === import.meta.env.VITE_ADMIN_EMAIL &&
        password === import.meta.env.VITE_ADMIN_PASSWORD;

      if (!isAdminUser) {
        setError('Invalid email or password');
        return false;
      }

      // Set authentication state
      setIsAuthenticated(true);
      setIsAdmin(true);

      // Store auth state
      localStorage.setItem('auth', JSON.stringify({
        isAuthenticated: true,
        isAdmin: true
      }));

      return true;
    } catch (err) {
      setError('An error occurred during login');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem('auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, logout, error }}>
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