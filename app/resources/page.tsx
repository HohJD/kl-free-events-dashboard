import type { Metadata } from "next";
import { ResourcesView } from "@/components/resources-view";
import { getResources } from "@/lib/load-resources";

export const metadata: Metadata = {
  title: "Student resources · Free Events Malaysia",
  description: "Open scholarships, internships in Malaysia and free tools for students, with tech picks first.",
};

export default function ResourcesPage() {
  const { resources, generatedAt } = getResources();
  return <ResourcesView resources={resources} generatedAt={generatedAt ? generatedAt.toISOString() : null} />;
}
