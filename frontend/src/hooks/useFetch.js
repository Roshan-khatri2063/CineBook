import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../utils/getErrorMessage.js";

// Runs an async function and tracks { data, loading, error }.
// It runs again whenever a value in `deps` changes, or when reload() is called.
// Old data stays on screen while the new request is loading (no flicker).
export default function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState((prev) => ({ ...prev, loading: false, error: getErrorMessage(error) }));
      });

    return () => {
      cancelled = true; // ignore answers that arrive after the page changed
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
