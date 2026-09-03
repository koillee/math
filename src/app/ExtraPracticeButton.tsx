export function ExtraPracticeButton({
  label = "Start a new tutor lesson",
}: { label?: string }) {
  return (
    <a
      href="/practice/extra/start"
      className="inline-flex w-full items-center justify-center rounded-full border border-[#f2d8b0] bg-[#d99b4a] px-5 py-3 font-semibold text-[#10211f] shadow-sm transition hover:bg-[#e7ad60]"
    >
      {label}
    </a>
  );
}
