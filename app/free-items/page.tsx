import type { Metadata } from "next";
import { FreeItemsView } from "@/components/free-items-view";
import { getItems } from "@/lib/items";

export const metadata: Metadata = {
  title: "Free items · Free Things Malaysia",
  description: "Things people near you are giving away for free. Claim on WhatsApp, or post something you no longer need.",
};

export default function FreeItemsPage() {
  return <FreeItemsView fallback={getItems()} />;
}
