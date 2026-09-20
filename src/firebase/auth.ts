import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type ActionCodeSettings,
  type Auth,
  type Unsubscribe,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getFirebaseApp } from './config';

export type { FirebaseUser };

export const getAuthInstance = (): Auth => getAuth(getFirebaseApp());

export const observeAuth = (cb: (user: FirebaseUser | null) => void): Unsubscribe =>
  onAuthStateChanged(getAuthInstance(), cb);

export async function loginWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(getAuthInstance(), email.trim(), password);
  return cred.user;
}

export async function registerWithEmail(email: string, password: string, name: string): Promise<FirebaseUser> {
  const cred = await createUserWithEmailAndPassword(getAuthInstance(), email.trim(), password);
  await updateProfile(cred.user, { displayName: name.trim() });
  return cred.user;
}

/** Preparado para o futuro: só é exibido na tela se VITE_ENABLE_GOOGLE_LOGIN=true. */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const cred = await signInWithPopup(getAuthInstance(), new GoogleAuthProvider());
  return cred.user;
}

export const logout = (): Promise<void> => signOut(getAuthInstance());

export function getPasswordResetActionCodeSettings(origin?: string): ActionCodeSettings | undefined {
  const base = (origin ?? (typeof window !== 'undefined' ? window.location.origin : '')).trim();
  if (!base) return undefined;
  return { url: `${base}/login`, handleCodeInApp: false };
}

export const requestPasswordReset = (email: string): Promise<void> => {
  const actionCodeSettings = getPasswordResetActionCodeSettings();
  return actionCodeSettings
    ? sendPasswordResetEmail(getAuthInstance(), email.trim(), actionCodeSettings)
    : sendPasswordResetEmail(getAuthInstance(), email.trim());
};

/**
 * Admin = usuário com o custom claim "admin: true" no token de login.
 * O claim só pode ser definido no servidor (scripts/set-admin.mjs); o navegador apenas LÊ.
 * Quem realmente protege os dados são as Security Rules.
 */
export async function readIsAdmin(user: FirebaseUser, forceRefresh = false): Promise<boolean> {
  const result = await user.getIdTokenResult(forceRefresh);
  return result.claims.admin === true;
}

const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/invalid-login-credentials': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Já existe uma conta com este e-mail.',
  'auth/weak-password': 'A senha é muito fraca. Use pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão com a internet. Tente novamente.',
  'auth/popup-closed-by-user': 'Login cancelado.',
  'auth/operation-not-allowed': 'Este tipo de login não está ativado no Firebase (Authentication).',
};

export function authErrorMessage(err: unknown): string {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : '';
  return AUTH_MESSAGES[code] ?? 'Não foi possível concluir. Tente novamente.';
}
