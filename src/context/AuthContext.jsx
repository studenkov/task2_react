import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router';
import {
  login as loginRequest,
  register as registerRequest,
  getMe,
} from '@/api/auth';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('session') || 'null');
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem('session');
    localStorage.removeItem('cart_guest');
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    if (!session?.token) return;

    let ignore = false;
    getMe(session.token)
      .then((data) => {
        if (!ignore && data?.user) {
          setSession((prev) => {
            if (!prev) return null;
            const nextSession = {
              ...prev,
              ...data.user,
              token: prev.token || data.token,
            };
            localStorage.setItem('session', JSON.stringify(nextSession));
            return nextSession;
          });
        }
      })
      .catch(() => {
        if (!ignore) {
          logout();
        }
      });

    return () => {
      ignore = true;
    };
  }, [session?.token, logout]);

  const refreshUser = useCallback(async () => {
    const currentToken = session?.token;
    if (!currentToken) return null;

    try {
      const data = await getMe(currentToken);
      if (data?.user) {
        let updated = null;
        setSession((prev) => {
          if (!prev) return null;
          updated = {
            ...prev,
            ...data.user,
            token: prev.token || currentToken,
          };
          localStorage.setItem('session', JSON.stringify(updated));
          return updated;
        });
        return updated;
      }
    } catch {
      //
    }
    return null;
  }, [session?.token]);

  async function login(credentials, password) {
    const data = await loginRequest(credentials, password);
    const user = data.user || data;
    const sessionData = {
      ...user,
      token: data.token,
    };
    setSession(sessionData);
    localStorage.setItem('session', JSON.stringify(sessionData));
    return sessionData;
  }

  async function register(userData, password, fullName) {
    const data = await registerRequest(userData, password, fullName);
    if (data?.token && data?.user) {
      const sessionData = {
        ...data.user,
        token: data.token,
      };
      setSession(sessionData);
      localStorage.setItem('session', JSON.stringify(sessionData));
    }
    return data;
  }

  function updateSession(updates) {
    setSession((prev) => {
      if (!prev) return null;
      const nextSession = { ...prev, ...updates };
      localStorage.setItem('session', JSON.stringify(nextSession));
      return nextSession;
    });
  }

  const value = useMemo(
    () => ({ session, login, register, logout, updateSession, refreshUser }),
    [session, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
