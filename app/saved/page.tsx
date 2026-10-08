import type { Metadata } from "next";
import { SavedView } from "@/components/saved-view";

export const metadata: Metadata = {
  title: "My tracker · Student Repo by ATH",
  description: "Everything you are tracking: events, applications and deadlines.",
};

export default function SavedPage() {
  return <SavedView />;
}
