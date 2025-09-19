export const SENSOR_READINGS_ENDPOINT =
  process.env.NEXT_PUBLIC_SENSOR_READINGS_ENDPOINT ??
  "http://localhost:8080/api/sensor-readings-alt";

export interface SensorReading {
  timestamp: string;
  moisture: number;
}

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface SensorReadingsResponse {
  data: SensorReading[];
  meta: PaginationMeta;
}

export interface FetchSensorReadingsParams {
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

export async function fetchSensorReadings({
  page = 1,
  limit = 20,
  signal,
}: FetchSensorReadingsParams = {}): Promise<SensorReadingsResponse> {
  const url = new URL(SENSOR_READINGS_ENDPOINT);

  if (typeof page === "number" && !Number.isNaN(page)) {
    url.searchParams.set("page", String(page));
  }

  if (typeof limit === "number" && !Number.isNaN(limit)) {
    url.searchParams.set("limit", String(limit));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch sensor readings: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as SensorReadingsResponse;

  if (!payload || !Array.isArray(payload.data) || typeof payload.meta !== "object") {
    throw new Error("Invalid sensor readings response shape");
  }

  return payload;
}
