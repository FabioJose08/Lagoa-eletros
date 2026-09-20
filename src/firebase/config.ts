import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';

/* A configuração vem SEMPRE de variáveis de ambiente (arquivo .env, veja .env.example).
   Nenhuma credencial fica escrita no código. */
const env = typeof import.meta !== 'undefined' && import.meta && 'env' in import.meta ? import.meta.env : {} as Record<string, string | undefined>;
const rawStorageBucket = env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ?? '';
const storageEnabled = env.VITE_ENABLE_STORAGE_UPLOADS === 'true';

export const firebaseConfig: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: storageEnabled ? rawStorageBucket : '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const hasStorageConfigured = (): boolean => storageEnabled && Boolean(rawStorageBucket && rawStorageBucket.length > 0);

export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

/** Botão "Entrar com Google" só aparece se o provedor foi ativado e esta variável estiver "true". */
export const isGoogleLoginEnabled: boolean = env.VITE_ENABLE_GOOGLE_LOGIN === 'true';

/** Inicialização preguiçosa: nada roda no import, então o site mostra a tela de configuração em vez de quebrar. */
export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase não configurado. Copie .env.example para .env e preencha as variáveis.');
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}
