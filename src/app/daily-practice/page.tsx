import { AppShell } from "@/components/masteryos/chrome";
import { DailyPractice } from "./DailyPractice";

export const metadata = {
  title: "Daily Practice | The Great Haim's Math Mastery",
  description: "A short mixed maths practice session for Haim.",
};

export default function DailyPracticePage() {
  return (
    <AppShell active="/daily-practice" mode="simple">
      <DailyPractice />
    </AppShell>
  );
}
