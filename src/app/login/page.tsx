import { LockKeyhole } from "lucide-react";
import {
  getAppAccessSettings,
  getSafeReturnPath,
} from "@/lib/server/production-safety";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    loggedOut?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const settings = getAppAccessSettings();
  const returnPath = getSafeReturnPath(query.next ?? null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f0e5] px-5 py-10 text-[#17211f]">
      <section className="w-full max-w-md rounded-[2rem] border border-[#dfd3c0] bg-white/90 p-7 shadow-xl sm:p-9">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#10211f] text-[#f8efe1]">
          <LockKeyhole className="size-7" aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-[#94652e]">
          Haim Math
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">가족 로그인</h1>
        <p className="mt-3 leading-7 text-[#53615c]">
          이 iPad에서는 처음 한 번만 로그인하면 돼요. 로그인은 180일 동안
          안전하게 유지됩니다.
        </p>

        {query.error === "1" ? (
          <p
            role="alert"
            className="mt-5 rounded-2xl bg-[#fff0e5] px-4 py-3 font-semibold text-[#8a3f22]"
          >
            이름이나 비밀번호가 맞지 않아요. 다시 확인해 주세요.
          </p>
        ) : null}
        {query.loggedOut === "1" ? (
          <p className="mt-5 rounded-2xl bg-[#eaf5ef] px-4 py-3 font-semibold text-[#285943]">
            이 iPad의 로그인이 지워졌어요.
          </p>
        ) : null}

        <form action="/api/auth/login" method="post" className="mt-7 space-y-5">
          <input type="hidden" name="next" value={returnPath} />
          <label className="block">
            <span className="text-sm font-bold">사용자 이름</span>
            <input
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              defaultValue={settings.username}
              required
              className="mt-2 w-full rounded-2xl border border-[#cabda9] bg-white px-4 py-4 text-lg outline-none transition focus:border-[#2f6173] focus:ring-4 focus:ring-[#2f6173]/15"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold">비밀번호</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded-2xl border border-[#cabda9] bg-white px-4 py-4 text-lg outline-none transition focus:border-[#2f6173] focus:ring-4 focus:ring-[#2f6173]/15"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-[#d99b4a] px-6 py-4 text-lg font-bold text-[#10211f] transition hover:bg-[#e7ad60] focus:outline-none focus:ring-4 focus:ring-[#d99b4a]/30"
          >
            시작하기
          </button>
        </form>

        <div className="mt-7 border-t border-[#e7ddce] pt-5">
          <p className="text-sm leading-6 text-[#64716c]">
            공용 iPad를 쓰거나 로그인을 처음부터 다시 하고 싶나요?
          </p>
          <form action="/api/auth/logout" method="post" className="mt-2">
            <button
              type="submit"
              className="text-sm font-bold text-[#7a5130] underline decoration-[#d99b4a] decoration-2 underline-offset-4"
            >
              이 iPad의 로그인 지우기
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
