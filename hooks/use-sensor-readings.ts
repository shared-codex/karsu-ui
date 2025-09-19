import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchSensorReadings,
  type PaginationMeta,
  type SensorReading,
  type SensorReadingsResponse,
} from "@/lib/api/sensor-readings";

export const DEFAULT_SENSOR_POLL_INTERVAL_MS = 5000;

type FetchRequest = {
  page: number;
  limit: number;
  withLoading: boolean;
};

const sanitizePositiveInteger = (
  value: number,
  fallback: number,
  { allowZero = false }: { allowZero?: boolean } = {},
) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const normalized = Math.floor(value);

  if (allowZero) {
    return normalized < 0 ? fallback : normalized;
  }

  return normalized <= 0 ? fallback : normalized;
};

export interface UseSensorReadingsOptions {
  /** Page number to request initially. */
  initialPage?: number;
  /** Page size to request initially. */
  initialLimit?: number;
  /** How frequently to poll for fresh data (ms). */
  pollIntervalMs?: number;
  /** Disable fetching/polling when false. */
  enabled?: boolean;
}

export interface UseSensorReadingsResult {
  data: SensorReading[];
  meta: PaginationMeta | null;
  page: number;
  limit: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  setPage: (value: number | ((current: number) => number)) => void;
  setLimit: (value: number | ((current: number) => number)) => void;
  refetch: () => Promise<SensorReadingsResponse | null>;
}

export function useSensorReadings({
  initialPage = 1,
  initialLimit = 20,
  pollIntervalMs = DEFAULT_SENSOR_POLL_INTERVAL_MS,
  enabled = true,
}: UseSensorReadingsOptions = {}): UseSensorReadingsResult {
  const [page, setPageState] = useState(() =>
    sanitizePositiveInteger(initialPage, 1, { allowZero: true }),
  );
  const [limit, setLimitState] = useState(() =>
    sanitizePositiveInteger(initialLimit, 20),
  );
  const [data, setData] = useState<SensorReading[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(enabled));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(
    async ({ page: nextPage, limit: nextLimit, withLoading }: FetchRequest) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      if (withLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await fetchSensorReadings({
          page: nextPage,
          limit: nextLimit,
          signal: controller.signal,
        });

        if (controller.signal.aborted || controllerRef.current !== controller) {
          return null;
        }

        setData(response.data);
        setMeta(response.meta);
        setError(null);

        return response;
      } catch (caughtError) {
        if ((caughtError as Error).name === "AbortError") {
          return null;
        }

        setError(caughtError as Error);
        return null;
      } finally {
        const isLatestRequest = controllerRef.current === controller;

        if (withLoading) {
          if (isLatestRequest) {
            setIsLoading(false);
          }
        } else if (isLatestRequest) {
          setIsRefreshing(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      controllerRef.current?.abort();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    fetchData({ page, limit, withLoading: true });
  }, [enabled, page, limit, fetchData]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (pollIntervalMs <= 0) {
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      fetchData({ page, limit, withLoading: false });
    }, pollIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, page, limit, pollIntervalMs, fetchData]);

  const setPage = useCallback(
    (value: number | ((current: number) => number)) => {
      setPageState((current) => {
        const nextValue =
          typeof value === "function" ? (value as (c: number) => number)(current) : value;

        return sanitizePositiveInteger(nextValue, 1, { allowZero: true });
      });
    },
    [],
  );

  const setLimit = useCallback(
    (value: number | ((current: number) => number)) => {
      setLimitState((current) => {
        const nextValue =
          typeof value === "function" ? (value as (c: number) => number)(current) : value;

        return sanitizePositiveInteger(nextValue, 20);
      });
    },
    [],
  );

  const refetch = useCallback(() => fetchData({ page, limit, withLoading: false }), [
    fetchData,
    page,
    limit,
  ]);

  return useMemo(
    () => ({
      data,
      meta,
      page,
      limit,
      isLoading,
      isRefreshing,
      error,
      setPage,
      setLimit,
      refetch,
    }),
    [data, meta, page, limit, isLoading, isRefreshing, error, setPage, setLimit, refetch],
  );
}
