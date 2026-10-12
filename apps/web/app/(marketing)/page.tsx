import Link from "next/link";

const STEPS = [
  {
    title: "Describe your business",
    body: "Tell us what you do and where, in plain English. One or two sentences is plenty.",
  },
  {
    title: "AI builds your site",
    body: "We pick the right design for your industry and write your pages, services, and FAQ.",
  },
  {
    title: "Review and go live",
    body: "Tweak anything you like, then publish. Your customers can call you in one tap.",
  },
];

const INDUSTRIES = [
  "Home services",
  "Beauty & salons",
  "Restaurants",
  "Professional services",
  "Portfolios",
];

export default function LandingPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 mx-auto h-[36rem] max-w-5xl rounded-full bg-linear-to-tr from-sky-200 via-emerald-100 to-amber-100 opacity-70 blur-3xl"
        />
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-24 text-center sm:px-6 sm:pt-28 sm:pb-32">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-slate-600">
            <span className="size-2 rounded-full bg-emerald-500" />
            Built for small businesses across the U.S.
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-5xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-7xl">
            Your website,{" "}
            <span className="bg-linear-to-r from-sky-600 to-emerald-500 bg-clip-text text-transparent">
              no sweat.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-slate-600 sm:text-xl">
            Describe your business in a sentence. Get a professional, mobile-ready website in under
            a minute. No design skills, no code.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/create"
              className="w-full rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-slate-900/20 transition hover:bg-slate-700 sm:w-auto"
            >
              Create my website
            </Link>
            <a
              href="#how-it-works"
              className="w-full rounded-full border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition hover:border-slate-400 sm:w-auto"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-sm text-slate-500">Free to try. No credit card required.</p>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-16 bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-widest text-sky-600 uppercase">
              How it works
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps. About sixty seconds.
            </h2>
          </div>
          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 to-emerald-500 font-display text-lg font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-6 font-display text-xl font-bold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Designed for your industry
          </h2>
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {INDUSTRIES.map((industry) => (
              <li
                key={industry}
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700"
              >
                {industry}
              </li>
            ))}
          </ul>
          <div className="mx-auto mt-16 max-w-3xl rounded-3xl bg-slate-900 px-6 py-12 text-white sm:px-12">
            <h2 className="font-display text-3xl font-bold tracking-tight text-balance">
              Ready to get your business online?
            </h2>
            <p className="mt-3 text-slate-300">It takes less time than finding a parking spot.</p>
            <Link
              href="/create"
              className="mt-8 inline-block rounded-full bg-white px-8 py-4 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Create my website
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
