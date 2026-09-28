import { AppShell } from "@/components/masteryos/chrome";
import { OlympiadStudio } from "./OlympiadStudio";

export const metadata = {
  title: "Olympiad | Haim Math",
  description: "Original mathematical thinking challenges for Haim.",
};

export default function OlympiadPage() {
  return (
    <AppShell active="/olympiad" mode="simple">
      <OlympiadStudio />
    </AppShell>
  );
}
