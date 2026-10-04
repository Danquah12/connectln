import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function sentences(raw: string) {
  return raw
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

function lineOf(text: string, title?: string) {
  const bits = sentences(text);
  const line = (bits[0] || title || text).replace(/^["“]|["”]$/g, "").trim();
  return line || "The line on the film.";
}

export function FilmNotes({
  text,
  title,
  speaker,
  trade,
  className,
}: {
  text?: string;
  title?: string;
  speaker?: string;
  trade?: string;
  className?: string;
}) {
  const source = (text || title || "").trim();
  const notes = useMemo(() => {
    const bits = sentences(source);
    return bits.length ? bits : [lineOf(source, title)];
  }, [source, title]);
  const [at, setAt] = useState(0);
  const note = notes[at] ?? notes[0];
  const line = lineOf(source, title);
  const who = speaker || "The person on the film";
  const bench = trade || "the trade";

  return (
    <aside className={cn("flex min-w-0 flex-col gap-4 rounded-2xl bg-[#152033] p-4 text-[#e8eef8]", className)}>
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#e4b15a]">WHAT IT MEANS</p>
        <p className="mt-2 text-sm leading-relaxed">
          The line written on the film is “{note}” {who} put that line on the picture so you know the claim before the film ends. It belongs with {bench}. On the job, the film is about that line and what it is doing in the work. Watch for the moment the film shows why that line is true. If you can say the same idea without copying the title, you have the point.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="h-9 rounded-full bg-[#243044] px-4 text-sm font-medium text-[#d5deea] disabled:opacity-40"
          disabled={at <= 0}
          onClick={() => setAt((n) => Math.max(0, n - 1))}
        >
          Previous note
        </button>
        <button
          type="button"
          className="h-9 rounded-full bg-[#e4b15a] px-4 text-sm font-medium text-[#1c1408] disabled:opacity-40"
          disabled={at >= notes.length - 1}
          onClick={() => setAt((n) => Math.min(notes.length - 1, n + 1))}
        >
          Next note
        </button>
      </div>
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#e4b15a]">LEARNING THREAD</p>
        <p className="mt-1 text-xs text-[#b7c3d4]">Follow the line on the film, then the next film in the same idea.</p>
        <ol className="mt-3 flex flex-col gap-2">
          {(
            [
              ["THE LINE", `Start with the words on the picture: “${line}” That sentence is the lesson. Everything after it is there to prove it.`],
              ["WHAT IT MEANS", `In ${bench}, the film is about the work and what that line is doing on the job.`],
              ["WHY STAY WITH IT", `Say “${line}” in your own words before you leave. If you cannot, the next film will feel like a new subject. If you can, you are ready for the next step in ${bench}.`],
            ] as const
          ).map(([mark, body], i) => (
            <li key={mark}>
              <div className="rounded-2xl bg-[#1c2a42] px-3.5 py-3">
                <p className="text-[11px] font-semibold tracking-wide text-[#e4b15a]">
                  {i + 1} · {mark}
                </p>
                <p className="mt-1 text-sm leading-snug">{body}</p>
              </div>
              {i < 2 ? <p className="py-1 text-center text-xs text-[#8ea0b8]">↓</p> : <p className="pt-1 text-center text-xs text-[#8ea0b8]">↓</p>}
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
