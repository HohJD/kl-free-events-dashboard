import type { Metadata } from "next";
import { FareSheet } from "@/components/fare-sheet";
import { getFlights } from "@/lib/load-flights";

export const metadata: Metadata = {
  title: "KL ⇄ London fares · Free Events Malaysia",
  description: "Daily Kuala Lumpur and London flight fares, one-way and return, with a buy-or-wait signal for each date.",
};

export default function FlightsPage() {
  return <FareSheet data={getFlights()} />;
}
