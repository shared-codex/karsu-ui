"use client";

import { type ChangeEvent, type HTMLAttributes, useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table";
import { sensorReadingColumns } from "@/components/sensor-readings/columns";
import { type UseSensorReadingsResult } from "@/hooks/use-sensor-readings";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const integerFormatter = new Intl.NumberFormat();
const secondsFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

export interface SensorReadingsTableProps
  extends Pick<
      UseSensorReadingsResult,
      | "data"
      | "meta"
      | "page"
      | "limit"
      | "isLoading"
      | "isRefreshing"
      | "error"
      | "setPage"
      | "setLimit"
      | "refetch"
    >,
    HTMLAttributes<HTMLDivElement> {
  pollIntervalMs?: number;
}

export function SensorReadingsTable({
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
  pollIntervalMs = 5000,
  className,
  ...divProps
}: SensorReadingsTableProps) {
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  const totalItemsFromMeta = meta?.totalItems ?? 0;
  const normalizedTotalItems =
    totalItemsFromMeta > 0
      ? Math.max(totalItemsFromMeta, data.length)
      : data.length;

  const currentPageFromMeta = meta?.page ?? page;
  const displayPage = currentPageFromMeta > 0 ? currentPageFromMeta : 1;

  const totalPagesFromMeta =
    meta && meta.totalPages > 0 ? meta.totalPages : null;
  const estimatedTotalPages =
    totalPagesFromMeta ??
    (normalizedTotalItems > 0
      ? Math.max(1, Math.ceil(normalizedTotalItems / Math.max(limit, 1)))
      : 1);
  const displayTotalPages = estimatedTotalPages > 0 ? estimatedTotalPages : 1;

  const canPreviousPage = displayPage > 1;
  const canNextPage =
    totalPagesFromMeta !== null
      ? displayPage < totalPagesFromMeta
      : data.length >= limit;

  const formattedTotalItems = useMemo(
    () => integerFormatter.format(normalizedTotalItems),
    [normalizedTotalItems],
  );
  const formattedDisplayPage = useMemo(
    () => integerFormatter.format(displayPage),
    [displayPage],
  );
  const formattedDisplayTotalPages = useMemo(
    () => integerFormatter.format(displayTotalPages),
    [displayTotalPages],
  );

  const pollIntervalSeconds = pollIntervalMs / 1000;
  const pollIntervalLabel =
    pollIntervalMs < 1000
      ? `${pollIntervalMs}ms`
      : `${secondsFormatter.format(pollIntervalSeconds)} ${
          Math.abs(pollIntervalSeconds - 1) < 0.01 ? "second" : "seconds"
        }`;

  const handlePrevious = () => {
    if (canPreviousPage) {
      setPage((current) => Math.max(1, current - 1));
    }
  };

  const handleNext = () => {
    if (canNextPage) {
      setPage((current) => current + 1);
    }
  };

  const handleLimitChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = Number.parseInt(event.target.value, 10);
    if (!Number.isFinite(value)) {
      return;
    }
    setLimit(value);
    setPage(1);
  };

  const handleManualRefresh = async () => {
    setIsManualRefresh(true);
    try {
      await refetch();
    } finally {
      setIsManualRefresh(false);
    }
  };

  let statusMessage = "Sensor readings are up to date.";
  let statusIndicatorClass = "bg-emerald-500/70";

  if (error) {
    statusMessage = "Failed to refresh sensor readings.";
    statusIndicatorClass = "bg-red-500";
  } else if (isLoading) {
    statusMessage = "Loading sensor readings...";
    statusIndicatorClass = "bg-emerald-500 animate-pulse";
  } else if (isRefreshing || isManualRefresh) {
    statusMessage = "Updating sensor readings...";
    statusIndicatorClass = "bg-emerald-500 animate-pulse";
  }

  return (
    <Card
      className={cn("flex h-full flex-col overflow-hidden", className)}
      {...divProps}
    >
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Moisture feed</CardTitle>
          <CardDescription>
            Displaying page {formattedDisplayPage} of {formattedDisplayTotalPages}. {" "}
            {formattedTotalItems} total readings. Auto refresh every {pollIntervalLabel}.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Rows per page
            <select
              className="rounded-md border border-input bg-background px-2 py-1 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={limit}
              onChange={handleLimitChange}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing || isManualRefresh}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>

      {error ? (
        <CardContent>
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to load sensor readings: {error.message}
          </div>
        </CardContent>
      ) : null}

      <CardContent className="flex-1 p-0">
        <DataTable
          columns={sensorReadingColumns}
          data={data}
          isLoading={isLoading}
          manualPagination
          pageCount={
            totalPagesFromMeta !== null ? totalPagesFromMeta : estimatedTotalPages
          }
        />
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t bg-muted/40 px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span
            className={cn("h-2.5 w-2.5 rounded-full", statusIndicatorClass)}
          />
          {statusMessage}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={!canPreviousPage || isLoading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {formattedDisplayPage} of {formattedDisplayTotalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={handleNext}
            disabled={!canNextPage || isLoading}
          >
            Next
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
