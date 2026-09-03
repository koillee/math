import { AppShell } from "@/components/masteryos/chrome";
import { GugudanPractice } from "./GugudanPractice";

export const metadata = {
  title: "Gugudan Practice | Haim Math",
  description: "Smart one-digit multiplication practice for Haim.",
};

export default function GugudanPage() {
  return (
    <AppShell active="/gugudan" mode="simple">
      <GugudanPractice />
    </AppShell>
  );
}
