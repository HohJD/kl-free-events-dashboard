import type { Metadata } from "next";
import { SavedView } from "@/components/saved-view";

export const metadata: Metadata = {
  title: "Saved · Free Things Malaysia",
  description: "Everything you saved: events, scholarships and internships.",
};

export default function SavedPage() {
  return <SavedView />;
}
