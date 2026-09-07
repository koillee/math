import { AppShell, PageHeader } from "@/components/masteryos/chrome";
import { ParentSummaryClient } from "./ParentSummaryClient";

export const metadata = {
  title: "Parent Summary | Haim Math",
  description: "A simple parent view of Haim's recent maths practice.",
};

export default function ParentReportPage() {
  return (
    <AppShell active="/parent-report" mode="simple">
      <PageHeader eyebrow="Parent Summary" title="What to review next">
        <p>
          A practical home view based on the practice completed in this browser.
          It is a learning signal, not a grade.
        </p>
      </PageHeader>
      <ParentSummaryClient />
    </AppShell>
  );
}
