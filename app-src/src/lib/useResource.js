import { useCallback, useEffect, useState } from 'react';
import { apiGet, AuthError } from '../api.js';

// Ambil satu endpoint Worker. `enabled` menunda fetch sampai dibutuhkan; `path` null = tidak fetch.
export function useResource(path, enabled, onAuthError) {
  const [state, setState] = useState({ data: null, error: null, loading: false });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled || !path) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    apiGet(path)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((err) => {
        if (!alive) return;
        if (err instanceof AuthError) onAuthError();
        setState((s) => ({ ...s, error: err.message, loading: false }));
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled, nonce]);

  return { ...state, reload: useCallback(() => setNonce((n) => n + 1), []) };
}
