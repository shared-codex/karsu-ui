import type { Metadata } from "next";

import { SensorReadingsDashboard } from "@/components/sensor-readings/sensor-readings-dashboard";

export const metadata: Metadata = {
  title: "Sensor Readings",
  description: "Real-time moisture telemetry refreshed every five seconds.",
};

export default function SensorReadingsPage() {
  return <SensorReadingsDashboard />;
}
