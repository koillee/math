import { AppShell } from "@/components/masteryos/chrome";
import { LessonModules } from "./LessonModules";

export const metadata = {
  title: "Lessons | Haim Math",
  description: "Teaching-first maths modules for Haim.",
};

export default function LessonsPage() {
  return (
    <AppShell active="/lessons" mode="simple">
      <LessonModules />
    </AppShell>
  );
}
