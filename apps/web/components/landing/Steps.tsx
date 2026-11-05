import { SlabGlow } from "./SlabGlow";

// "How it works" (#story): quatro cartões pretos em uma fileira, cada um com um esboço desenhado
// em HTML (sem fotos) do que acontece naquele passo. Só o que o produto faz hoje.

const ROW = "flex h-8 items-center gap-2 rounded-lg bg-white/10 px-3 text-[12px] text-white/80";

function Art({ i }: { i: number }) {
  if (i === 0)
    return (
      <div className="grid gap-1.5" aria-hidden="true">
        {["Your business", "Where you are", "Hours", "Phone"].map((t) => (
          <span key={t} className={ROW}>
            <span className="size-1.5 rounded-full bg-[#00c2ff]" />
            {t}
          </span>
        ))}
      </div>
    );
  if (i === 1)
    return (
      <div className="grid gap-2 rounded-xl border border-white/15 p-4" aria-hidden="true">
        <span className="h-2 w-2/5 rounded bg-white/15" />
        <span className="h-7 w-3/5 rounded-lg bg-white/85" />
        <span className="h-2 w-4/5 rounded bg-white/15" />
        <span className="h-2 w-3/5 rounded bg-white/15" />
        <span className="mt-1 h-6 w-1/3 rounded-full bg-[#0066ff]" />
      </div>
    );
  if (i === 2)
    return (
      <div className="rounded-xl border border-white/15 p-3 text-[12px]" aria-hidden="true">
        <p className="text-white/55">Describe a change</p>
        <p className="mt-1.5 rounded-lg bg-white/10 px-3 py-2 text-white/85">
          Make the intro shorter.
        </p>
        <p className="mt-2.5 flex items-center gap-2 text-white/70">
          <span className="size-1.5 rounded-full bg-[#00c2ff]" />
          New draft ready to review
        </p>
      </div>
    );
  return (
    <div className="overflow-hidden rounded-xl border border-white/15" aria-hidden="true">
      <div className="flex items-center gap-1.5 border-b border-white/15 px-3 py-2">
        <span className="size-1.5 rounded-full bg-white/25" />
        <span className="size-1.5 rounded-full bg-white/25" />
        <span className="size-1.5 rounded-full bg-white/25" />
        <span className="ml-2 h-2 flex-1 rounded bg-white/10" />
      </div>
      <div className="grid gap-2 p-3">
        <span className="h-5 w-1/2 rounded bg-white/85" />
        <span className="h-2 w-3/4 rounded bg-white/15" />
        <span className="mt-1 flex items-center gap-2 text-[12px] text-white/70">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          Live
        </span>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "Answer a few questions",
    body: "What you do, where, and anything worth knowing. About a minute.",
  },
  {
    title: "Get a finished site",
    body: "Services, hours, contact form and a call button, already in place.",
  },
  {
    title: "Change anything",
    body: "Click to edit, or ask the AI in plain words. You review every draft.",
  },
  {
    title: "Go live",
    body: "A free nosweatfd.com address, or your own domain on Pro.",
  },
];

export function Steps() {
  return (
    <section
      id="story"
      aria-labelledby="story-title"
      className="scroll-mt-14 px-5 py-20 text-center sm:px-8 lg:py-28"
    >
      <span className="lp-tag">How it works</span>
      <h2 id="story-title" className="lp-h mt-6 text-[clamp(1.9rem,3.9vw,3.375rem)]">
        From a few answers
        <br />
        <span className="dim">to a website that works.</span>
      </h2>
      <ol
        data-slabs
        className="mx-auto mt-12 grid w-full max-w-[1180px] grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-4"
      >
        {STEPS.map((step, index) => (
          <li key={step.title} className="lp-slab flex flex-col gap-6 p-6">
            <p className="lp-slab-n text-[12px] font-semibold tracking-[0.1em] text-white/60">
              STEP {String(index + 1).padStart(2, "0")}
            </p>
            <Art i={index} />
            <div className="mt-auto">
              <h3 className="text-[20px] leading-tight font-semibold tracking-[-0.02em] text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-[14.5px] leading-[1.55] text-white/70">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <SlabGlow />
    </section>
  );
}
