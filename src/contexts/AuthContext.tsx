import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  loginWithEmail, loginWithGoogle, logout, observeAuth, readIsAdmin, registerWithEmail, type FirebaseUser,
} from '@/firebase/auth';
import { ensureUserProfile, getUserProfile } from '@/services/userService';
import type { User, UserProfile } from '@/types';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface AuthValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  /** true enquanto o Firebase ainda está verificando se há alguém logado. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthValue | null>(null);

const toUser = (fu: FirebaseUser, isAdmin: boolean): User => ({
  uid: fu.uid,
  email: fu.email ?? '',
  displayName: fu.displayName ?? '',
  photoURL: fu.photoURL ?? '',
  isAdmin,
});

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  /** Nome/telefone digitados no cadastro, usados quando o perfil é criado logo após o login automático. */
  const pendingExtras = useRef<{ name?: string; phone?: string }>({});

  useEffect(() => {
    let cancelled = false;
    const unsub = observeAuth(async (fu) => {
      if (!fu) {
        if (!cancelled) { setUser(null); setProfile(null); setLoading(false); }
        return;
      }
      try {
        const isAdmin = await readIsAdmin(fu);
        const prof = await ensureUserProfile(fu, pendingExtras.current).catch(() => null);
        pendingExtras.current = {};
        if (!cancelled) { setUser(toUser(fu, isAdmin)); setProfile(prof); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => { cancelled = true; unsub(); };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<User> => {
    const fu = await loginWithEmail(email, password);
    // Força a leitura do token novo: garante que o "admin" mais recente seja considerado.
    const isAdmin = await readIsAdmin(fu, true);
    const u = toUser(fu, isAdmin);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<User> => {
    pendingExtras.current = { name: input.name, phone: input.phone };
    const fu = await registerWithEmail(input.email, input.password, input.name);
    return toUser(fu, false);
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<User> => {
    const fu = await loginWithGoogle();
    return toUser(fu, await readIsAdmin(fu, true));
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await logout();
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user) return;
    setProfile(await getUserProfile(user.uid));
  }, [user]);

  const value = useMemo<AuthValue>(
    () => ({ user, profile, isAdmin: user?.isAdmin === true, loading, signIn, register, signInWithGoogle, signOut, refreshProfile }),
    [user, profile, loading, signIn, register, signInWithGoogle, signOut, refreshProfile],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
