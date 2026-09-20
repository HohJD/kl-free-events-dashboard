import type { Metadata } from "next";
import { Redirect } from "@/components/redirect";

export const metadata: Metadata = {
  title: "Student resources · Free Things Malaysia",
  description: "Scholarships, internships, graduate roles and free tools now live with events on one page.",
};

/** Kept so older links keep working: resources moved onto the main page. */
export default function ResourcesPage() {
  return <Redirect to="/?type=scholarship" label="scholarships, internships and free tools" />;
}
