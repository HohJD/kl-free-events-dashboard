import type { Metadata } from "next";
import { FlightView } from "@/components/flight-view";
import { getFlights } from "@/lib/load-flights";

export const metadata: Metadata = {
  title: "KL ⇄ London flight fares · Free Events Malaysia",
  description: "Cheapest Kuala Lumpur and London fares for every departure date over 6 months, one-way and return, with a book-now signal.",
};

export default function FlightsPage() {
  return <FlightView data={getFlights()} />;
}
