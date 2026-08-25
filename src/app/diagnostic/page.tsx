import { DiagnosticForm } from "./DiagnosticForm";
import { AppShell, PageHeader } from "@/components/masteryos/chrome";
import { getActiveDiagnosticItems } from "@/lib/learning/assessment";
import { getMvpState } from "@/lib/learning/queries";

export const dynamic = "force-dynamic";

export default async function DiagnosticPage() {
  await getMvpState();
  const diagnosticItems = await getActiveDiagnosticItems();
  return (
    <AppShell active="/diagnostic">
      <PageHeader eyebrow="Diagnostic Assessment" title="Short Year 6 maths diagnostic">
        <p>This is not a grade. Each response creates evidence about correctness, explanation, confidence, representation choice, and possible misconceptions.</p>
      </PageHeader>
      <DiagnosticForm items={diagnosticItems} />
    </AppShell>
  );
}
