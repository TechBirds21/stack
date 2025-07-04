/* -------------------------------------------------------------------------- */
/*  AuthContext.tsx – Python-only auth                                        */
/* -------------------------------------------------------------------------- */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { authAPI, type User } from '@/lib/api'; // ← comes from the Python API

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (payload: Record<string, any>) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
};

/* -------------------------------------------------------------------------- */
/*  Provider                                                                  */
/* -------------------------------------------------------------------------- */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* --------------------------- initial session --------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const me = await authAPI.me(); // GET /auth/me with Bearer token
        setUser(me);
      } catch (err) {
        console.error('No active session:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ------------------------------- actions ------------------------------ */
  const signIn = async (email: string, password: string) => {
    try {
      const me = await authAPI.login(email, password);
      setUser(me);
      return {};
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  };

  const signUp = async (payload: Record<string, any>) => {
    try {
      const me = await authAPI.signup(payload);
      setUser(me);
      return {};
    } catch (err: any) {
      return { error: err.message || 'Registration failed' };
    }
  };

  const signOut = async () => {
    try {
      authAPI.logout();
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  /* ------------------------------ context ------------------------------- */
  const value: AuthContextType = { user, loading, signIn, signUp, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
