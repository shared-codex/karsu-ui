"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { type SensorReading } from "@/lib/api/sensor-readings";

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function formatTimestamp(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateTimeFormatter.format(parsed);
}

export const sensorReadingColumns: ColumnDef<SensorReading>[] = [
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: ({ row }) => {
      const timestamp = row.getValue<string>("timestamp");
      return <span className="font-medium text-foreground">{formatTimestamp(timestamp)}</span>;
    },
  },
  {
    accessorKey: "moisture",
    header: "Moisture",
    cell: ({ row }) => {
      const moisture = row.getValue<number>("moisture");
      if (typeof moisture !== "number" || Number.isNaN(moisture)) {
        return <span className="text-muted-foreground">—</span>;
      }

      return <span className="tabular-nums text-foreground">{moisture}</span>;
    },
  },
];
