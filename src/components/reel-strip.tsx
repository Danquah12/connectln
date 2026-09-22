import { Link } from "@tanstack/react-router";
import { ReelStage, workSerial } from "@/components/work-frame";
import { seedReels } from "@/lib/reel-seed";
import { hallClipLive, isLectureReel } from "@/lib/clip-ingest";
import { hallEnglish } from "@/lib/hall-lang";
import { personById, useForge } from "@/lib/store";

export function ReelStrip() {
  const extra = useForge((s) => s.extraReels);
  const people = useForge((s) => s.people);
  const clipStatus = useForge((s) => s.clipStatus);
  const catalog = [...extra, ...seedReels].filter((r) => {
    const author = personById(people, r.personId);
    if (isLectureReel(r)) return false;
    if (!hallEnglish(r.title, r.caption, author?.name)) return false;
    return hallClipLive(r.youtube, clipStatus);
  }).slice(0, 10);

  return (
    <section>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-brick uppercase">Proof plates</p>
          <h2 className="font-display text-2xl tracking-wide">Reels of the work</h2>
        </div>
        <Link to="/reels" className="text-xs text-brick hover:underline">
          Open the hall
        </Link>
      </div>
      <ul className="chip-row -mx-3 px-3 sm:mx-0 sm:px-0">
        {catalog.map((r) => {
          const author = personById(people, r.personId);
          return (
            <li key={r.id} className="reel-thumb shrink-0">
              <Link to="/reels" search={{ id: r.id }} className="block">
                <ReelStage serial={workSerial(r.id)} stamp={author?.trade ?? "Work"}>
                  <img src={r.still} alt="" className="size-full object-cover object-[center_18%]" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/50 to-transparent px-2 pb-2 pt-8 text-cream">
                    <span className="block truncate font-display text-lg leading-none tracking-wide">
                      {author?.name ?? r.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-cream/70">{r.title}</span>
                  </span>
                </ReelStage>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
