"use client";

import { type ChangeEvent, useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table";
import { sensorReadingColumns } from "@/components/sensor-readings/columns";
import { useSensorReadings } from "@/hooks/use-sensor-readings";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function SensorReadingsTable() {
  const [isManualRefresh, setIsManualRefresh] = useState(false);
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
  } = useSensorReadings({
    pollIntervalMs: 5000,
    initialLimit: 20,
  });

  const pageCount = meta?.totalPages ?? undefined;
  const totalItems = meta?.totalItems ?? data.length;
  const currentPage = meta?.page ?? page;
  const totalPages = meta?.totalPages ?? (data.length > 0 ? page : 1);
  const displayPage = currentPage > 0 ? currentPage : 1;
  const displayTotalPages = totalPages > 0 ? totalPages : 1;

  const canPreviousPage = displayPage > 1;
  const canNextPage =
    totalPages > 0 ? currentPage < totalPages : data.length === limit;

  const formattedTotalItems = useMemo(
    () => new Intl.NumberFormat().format(totalItems),
    [totalItems],
  );

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

  return (
    <div className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Displaying page {displayPage} of {displayTotalPages}.
          </p>
          <p className="text-xs text-muted-foreground">
            {formattedTotalItems} total readings. Updates automatically every 5 seconds.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
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
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing || isManualRefresh}
            className={cn(
              "inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors",
              "hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200",
              (isLoading || isRefreshing || isManualRefresh) &&
                "pointer-events-none opacity-60",
            )}
          >
            Refresh
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load sensor readings: {error.message}
        </div>
      ) : null}

      <DataTable
        columns={sensorReadingColumns}
        data={data}
        isLoading={isLoading}
        manualPagination
        pageCount={pageCount}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span
            className={cn(
              "flex h-2.5 w-2.5 rounded-full",
              isLoading || isRefreshing
                ? "bg-emerald-500 animate-pulse"
                : "bg-emerald-500/60",
            )}
          />
          {isLoading
            ? "Loading sensor readings..."
            : isRefreshing
              ? "Updating sensor readings..."
              : "Sensor readings are up to date."}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={!canPreviousPage || isLoading}
            className={cn(
              "inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors",
              "hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200",
              (!canPreviousPage || isLoading) && "pointer-events-none opacity-60",
            )}
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {displayPage} of {displayTotalPages}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNextPage || isLoading}
            className={cn(
              "inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors",
              "hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200",
              (!canNextPage || isLoading) && "pointer-events-none opacity-60",
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
