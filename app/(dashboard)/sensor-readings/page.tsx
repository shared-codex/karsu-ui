import type { Metadata } from "next";

import { SensorReadingsTable } from "@/components/sensor-readings/sensor-readings-table";

export const metadata: Metadata = {
  title: "Sensor Readings",
  description: "Real-time moisture telemetry refreshed every five seconds.",
};

export default function SensorReadingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Sensor Readings</h1>
        <p className="text-sm text-muted-foreground">
          Live stream of soil moisture data. Values automatically refresh every five seconds.
        </p>
      </div>
      <SensorReadingsTable />
    </div>
  );
}
