import { useEffect, useState } from 'react';
import type { Unsubscribe } from 'firebase/firestore';
import { firebaseErrorMessage } from '@/firebase/firestore';

type Subscribe<T> = (cb: (value: T) => void, onError: (err: Error) => void) => Unsubscribe;

/** Escuta uma coleção do Firestore em tempo real (usado nas telas do painel). */
export function useSubscription<T>(subscribe: Subscribe<T>, initial: T, deps: ReadonlyArray<unknown> = []): {
  data: T;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribe(
      (value) => { setData(value); setLoading(false); setError(null); },
      (err) => { setError(firebaseErrorMessage(err)); setLoading(false); },
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
