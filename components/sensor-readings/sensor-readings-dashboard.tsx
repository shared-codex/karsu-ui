"use client";

import { useMemo } from "react";

import { SensorReadingsTable } from "@/components/sensor-readings/sensor-readings-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_SENSOR_POLL_INTERVAL_MS,
  useSensorReadings,
} from "@/hooks/use-sensor-readings";
import { type SensorReading } from "@/lib/api/sensor-readings";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "./columns";

const moistureFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});
const integerFormatter = new Intl.NumberFormat();
const secondsFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});
const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

type SensorStatistics = {
  average: number | null;
  min: number | null;
  max: number | null;
  range: number | null;
  trend: number | null;
  latest: SensorReading | null;
  earliest: SensorReading | null;
  lastUpdated: number | null;
};

function formatMoisture(value: number | null) {
  return typeof value === "number" && Number.isFinite(value)
    ? moistureFormatter.format(value)
    : "—";
}

function formatSignedMoisture(value: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  const absolute = moistureFormatter.format(Math.abs(value));
  if (value > 0) {
    return `+${absolute}`;
  }
  if (value < 0) {
    return `-${absolute}`;
  }
  return absolute;
}

function formatRelativeTime(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }

  const diffMs = date.getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return relativeTimeFormatter.format(diffSeconds, "second");
  }

  const diffMinutes = Math.round(diffMs / (60 * 1000));
  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMs / (60 * 60 * 1000));
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  return relativeTimeFormatter.format(diffDays, "day");
}

function formatPollInterval(ms: number) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = ms / 1000;
  const plural = Math.abs(seconds - 1) < 0.01 ? "second" : "seconds";
  return `${secondsFormatter.format(seconds)} ${plural}`;
}

function computeStatistics(data: SensorReading[]): SensorStatistics {
  let latest: SensorReading | null = null;
  let earliest: SensorReading | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;
  let earliestTime = Number.POSITIVE_INFINITY;
  let sum = 0;
  let count = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const reading of data) {
    const { moisture, timestamp } = reading;

    if (typeof moisture === "number" && Number.isFinite(moisture)) {
      sum += moisture;
      count += 1;
      if (moisture < min) {
        min = moisture;
      }
      if (moisture > max) {
        max = moisture;
      }
    }

    const parsedTime = Date.parse(timestamp);
    if (!Number.isNaN(parsedTime)) {
      if (parsedTime > latestTime) {
        latestTime = parsedTime;
        latest = reading;
      }
      if (parsedTime < earliestTime) {
        earliestTime = parsedTime;
        earliest = reading;
      }
    }
  }

  const latestMoisture =
    latest && typeof latest.moisture === "number" && Number.isFinite(latest.moisture)
      ? latest.moisture
      : null;
  const earliestMoisture =
    earliest && typeof earliest.moisture === "number" && Number.isFinite(earliest.moisture)
      ? earliest.moisture
      : null;

  return {
    average: count > 0 ? sum / count : null,
    min: count > 0 ? min : null,
    max: count > 0 ? max : null,
    range: count > 0 ? max - min : null,
    trend:
      typeof latestMoisture === "number" && typeof earliestMoisture === "number"
        ? latestMoisture - earliestMoisture
        : null,
    latest,
    earliest,
    lastUpdated:
      latestTime > Number.NEGATIVE_INFINITY ? latestTime : null,
  };
}

export function SensorReadingsDashboard() {
  const sensorState = useSensorReadings({
    pollIntervalMs: DEFAULT_SENSOR_POLL_INTERVAL_MS,
    initialLimit: 20,
  });

  const {
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
  } = sensorState;

  const statistics = useMemo(() => computeStatistics(data), [data]);
  const isInitialLoading = isLoading && data.length === 0;
  const latestMoistureValue =
    statistics.latest && Number.isFinite(statistics.latest.moisture)
      ? statistics.latest.moisture
      : null;
  const earliestMoistureValue =
    statistics.earliest && Number.isFinite(statistics.earliest.moisture)
      ? statistics.earliest.moisture
      : null;
  const latestMoistureDisplay = formatMoisture(latestMoistureValue);
  const earliestMoistureDisplay = formatMoisture(earliestMoistureValue);
  const averageMoistureDisplay = formatMoisture(statistics.average);
  const minMoistureDisplay = formatMoisture(statistics.min);
  const maxMoistureDisplay = formatMoisture(statistics.max);
  const rangeDisplay = formatMoisture(statistics.range);
  const trendDisplay = formatSignedMoisture(statistics.trend);

  const totalItemsFromMeta = meta?.totalItems ?? 0;
  const normalizedTotalItems =
    totalItemsFromMeta > 0
      ? Math.max(totalItemsFromMeta, data.length)
      : data.length;
  const totalPagesFromMeta = meta && meta.totalPages > 0 ? meta.totalPages : null;
  const totalPages =
    totalPagesFromMeta ??
    (normalizedTotalItems > 0
      ? Math.max(1, Math.ceil(normalizedTotalItems / Math.max(limit, 1)))
      : 1);
  const currentPage = meta?.page ?? page;
  const displayPage = currentPage > 0 ? currentPage : 1;

  const formattedRecordsOnPage = integerFormatter.format(data.length);
  const formattedTotalRecords = integerFormatter.format(normalizedTotalItems);
  const formattedLimit = integerFormatter.format(limit);
  const formattedDisplayPage = integerFormatter.format(displayPage);
  const formattedTotalPages = integerFormatter.format(totalPages);

  const earliestDate =
    statistics.earliest !== null ? new Date(statistics.earliest.timestamp) : null;
  const earliestAbsolute = statistics.earliest
    ? formatTimestamp(statistics.earliest.timestamp)
    : "—";
  const earliestRelative = formatRelativeTime(earliestDate);
  const lastUpdatedDate =
    statistics.lastUpdated !== null ? new Date(statistics.lastUpdated) : null;
  const lastUpdatedAbsolute = statistics.latest
    ? formatTimestamp(statistics.latest.timestamp)
    : "—";
  const lastUpdatedRelative = formatRelativeTime(lastUpdatedDate);

  const pollIntervalLabel = formatPollInterval(DEFAULT_SENSOR_POLL_INTERVAL_MS);

  const trendClassName = cn(
    "text-xs",
    typeof statistics.trend === "number" && !Number.isNaN(statistics.trend)
      ? statistics.trend > 0
        ? "text-emerald-600"
        : statistics.trend < 0
          ? "text-red-600"
          : "text-muted-foreground"
      : "text-muted-foreground",
  );

  let pollingStatusLabel = "Live";
  let pollingStatusIndicator = "bg-emerald-500/80";
  let pollingStatusDescription = "Connected to telemetry service.";

  if (error) {
    pollingStatusLabel = "Error";
    pollingStatusIndicator = "bg-red-500";
    pollingStatusDescription = "API request failed. Review the service and try again.";
  } else if (isLoading) {
    pollingStatusLabel = "Loading";
    pollingStatusIndicator = "bg-emerald-500 animate-pulse";
    pollingStatusDescription = "Fetching the selected page from the service.";
  } else if (isRefreshing) {
    pollingStatusLabel = "Updating";
    pollingStatusIndicator = "bg-emerald-500 animate-pulse";
    pollingStatusDescription = "Synchronizing the latest readings.";
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Sensor Readings
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor live soil moisture telemetry. The table below refreshes automatically every {pollIntervalLabel}.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest moisture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {isInitialLoading ? (
              <>
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-4 w-40" />
              </>
            ) : (
              <>
                <div className="text-2xl font-semibold tracking-tight text-foreground">
                  {latestMoistureDisplay}
                </div>
                <p className="text-xs text-muted-foreground">
                  {lastUpdatedRelative !== "—"
                    ? `Updated ${lastUpdatedRelative}`
                    : "Awaiting first update"}
                  {lastUpdatedAbsolute !== "—" ? ` • ${lastUpdatedAbsolute}` : null}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average moisture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isInitialLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-4 w-36" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-semibold tracking-tight text-foreground">
                  {averageMoistureDisplay}
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">Min</dt>
                    <dd className="font-medium text-foreground">{minMoistureDisplay}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">Max</dt>
                    <dd className="font-medium text-foreground">{maxMoistureDisplay}</dd>
                  </div>
                </dl>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {isInitialLoading ? (
              <>
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-semibold tracking-tight text-foreground">
                  {rangeDisplay}
                </div>
                <p className={trendClassName}>
                  Change since first reading {trendDisplay}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isInitialLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-7 w-16" />
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className={cn("h-10 w-full", index === 2 ? "col-span-2" : undefined)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Rows on this page</p>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {formattedRecordsOnPage}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">Total records</dt>
                    <dd className="font-medium text-foreground">{formattedTotalRecords}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">Rows per page</dt>
                    <dd className="font-medium text-foreground">{formattedLimit}</dd>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <dt className="text-muted-foreground">Page</dt>
                    <dd className="font-medium text-foreground">
                      {formattedDisplayPage} of {formattedTotalPages}
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <SensorReadingsTable
          data={data}
          meta={meta}
          page={page}
          limit={limit}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          error={error}
          setPage={setPage}
          setLimit={setLimit}
          refetch={refetch}
          pollIntervalMs={DEFAULT_SENSOR_POLL_INTERVAL_MS}
          className="lg:h-full"
        />
        <div className="grid gap-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Polling status</CardTitle>
              <CardDescription>Connection health and cadence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <span
                    className={cn("h-2.5 w-2.5 rounded-full", pollingStatusIndicator)}
                  />
                  {pollingStatusLabel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{pollingStatusDescription}</p>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Interval</span>
                <span className="font-medium text-foreground">{pollIntervalLabel}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Last updated</span>
                {isInitialLoading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    {lastUpdatedRelative !== "—"
                      ? `${lastUpdatedRelative} (${lastUpdatedAbsolute})`
                      : "—"}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Dataset summary</CardTitle>
              <CardDescription>Snapshot of the current query window.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {isInitialLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Time window
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 rounded-md border border-dashed border-border/60 p-3">
                        <p className="text-xs text-muted-foreground">Earliest reading</p>
                        <p className="text-sm font-medium text-foreground">{earliestAbsolute}</p>
                        <p className="text-xs text-muted-foreground">
                          {earliestRelative !== "—" ? earliestRelative : "Awaiting data"}
                        </p>
                      </div>
                      <div className="space-y-1 rounded-md border border-dashed border-border/60 p-3">
                        <p className="text-xs text-muted-foreground">Latest reading</p>
                        <p className="text-sm font-medium text-foreground">{lastUpdatedAbsolute}</p>
                        <p className="text-xs text-muted-foreground">
                          {lastUpdatedRelative !== "—" ? lastUpdatedRelative : "Awaiting data"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Earliest moisture</span>
                      <p className="font-medium text-foreground">{earliestMoistureDisplay}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Latest moisture</span>
                      <p className="font-medium text-foreground">{latestMoistureDisplay}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
