import type { Metadata } from "next";
import { SavedView } from "@/components/saved-view";

export const metadata: Metadata = {
  title: "My tracker · Students Repo",
  description: "Everything you are tracking: events, applications and deadlines.",
};

export default function SavedPage() {
  return <SavedView />;
}
