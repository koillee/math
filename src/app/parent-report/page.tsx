import { AppShell } from "@/components/masteryos/chrome";
import { ParentSummaryClient } from "./ParentSummaryClient";

export const metadata = {
  title: "Parent Summary | The Great Haim's Math Mastery",
  description: "A simple parent view of Haim's recent maths practice.",
};

export default function ParentReportPage() {
  return (
    <AppShell active="/parent-report" mode="simple">
      <ParentSummaryClient />
    </AppShell>
  );
}
