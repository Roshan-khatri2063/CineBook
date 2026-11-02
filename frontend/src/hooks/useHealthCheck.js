import { useCallback, useEffect, useState } from "react";
import { getHealth } from "../services/healthService.js";
import { getErrorMessage } from "../utils/getErrorMessage.js";

// Loads API health and exposes loading / error state plus a refresh function.
export default function useHealthCheck() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const check = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getHealth());
    } catch (err) {
      setData(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { data, loading, error, refresh: check };
}
