import { AppShell } from "@/components/masteryos/chrome";
import { LessonModules } from "./LessonModules";

export const metadata = {
  title: "Lessons | The Great Haim's Math Mastery",
  description: "Teaching-first maths modules for Haim.",
};

export default function LessonsPage() {
  return (
    <AppShell active="/lessons" mode="simple">
      <LessonModules />
    </AppShell>
  );
}
