import { useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Repeat2, ScanSearch, Send } from "lucide-react";
import { toast } from "sonner";
import { Portrait } from "@/components/portrait";
import { RelatedStrip } from "@/components/related-strip";
import { LEARN_PATHS } from "@/lib/learn-paths";
import { LIBRARIES } from "@/lib/libraries";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Person, Trade } from "@/lib/types";

function studyPath(meaning: string | undefined, yours?: Trade) {
  const text = (meaning ?? "").toLowerCase();
  const named = LEARN_PATHS.filter((p) => text.includes(p.trade.toLowerCase()));
  const hit = named.sort((a, b) => b.trade.length - a.trade.length)[0];
  return hit ?? LEARN_PATHS.find((p) => p.trade === yours) ?? LEARN_PATHS[0];
}

function tally(n?: number) {
  if (n == null) return "";
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(n);
}

export function ClipRail({
  person,
  likes,
  comments,
  reposts,
  liked,
  onLike,
  onComment,
  onWrite,
  onRepost,
  meaning,
  clipId,
  className,
}: {
  person?: Person | null;
  likes?: number;
  comments?: number;
  reposts?: number;
  liked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onWrite?: (body: string) => void;
  onRepost?: () => void;
  meaning?: string;
  clipId?: string;
  className?: string;
}) {
  const you = personById(useForge((s) => s.people), useForge((s) => s.youId));
  const youId = useForge((s) => s.youId);
  const people = useForge((s) => s.people);
  const sendMail = useForge((s) => s.sendMail);
  const sitLesson = useForge((s) => s.sitLesson);
  const noteWatch = useForge((s) => s.noteWatch);
  const face = person ?? you;
  const [openMeaning, setOpenMeaning] = useState(false);
  const [analyse, setAnalyse] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [box, setBox] = useState(false);
  const [study, setStudy] = useState(false);
  const [held, setHeld] = useState<string[]>([]);
  const [portal, setPortal] = useState(false);
  const [who, setWho] = useState("");
  const [pick, setPick] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState("");
  const [wrote, setWrote] = useState<string[]>([]);
  const field = useRef<HTMLTextAreaElement>(null);
  const [localLike, setLocalLike] = useState(false);
  const [localRepost, setLocalRepost] = useState(false);
  const heartOn = liked ?? localLike;
  const repostOn = localRepost;

  function filmUrl() {
    if (clipId) return `${window.location.origin}/watch/${clipId}`;
    return window.location.href;
  }

  function openNet(kind: "linkedin" | "facebook" | "whatsapp" | "instagram" | "tiktok") {
    const url = filmUrl();
    const text = meaning?.slice(0, 140) || "ConnectLn";
    noteWatch("repost", text, kind);
    if (!repostOn) onRepost?.();
    setLocalRepost(true);
    const encoded = encodeURIComponent(url);
    const line = encodeURIComponent(`${text} ${url}`);
    if (kind === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, "_blank", "noopener,noreferrer");
      return;
    }
    if (kind === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, "_blank", "noopener,noreferrer");
      return;
    }
    if (kind === "whatsapp") {
      window.open(`https://wa.me/?text=${line}`, "_blank", "noopener,noreferrer");
      return;
    }
    void navigator.clipboard.writeText(`${text}\n${url}`).then(
      () => toast(kind === "instagram" ? "Link copied. Paste it on Instagram." : "Link copied. Paste it on TikTok."),
      () => toast(url),
    );
    window.open(kind === "instagram" ? "https://www.instagram.com/" : "https://www.tiktok.com/", "_blank", "noopener,noreferrer");
  }

  function deliver(e: FormEvent) {
    e.preventDefault();
    if (!pick) return;
    const url = filmUrl();
    const line = note.trim() || meaning || "A film from the hall.";
    sendMail(pick, (meaning || "A film").slice(0, 72), `${line}\n\n${url}`);
    noteWatch("send", meaning || "film", pick);
    toast("Sent.");
    setPortal(false);
    setNote("");
    setWho("");
    setPick(null);
  }

  const path = studyPath(meaning, you?.trade);
  const library = LIBRARIES[path.trade];
  const checks = path.steps
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  const found = people
    .filter((p) => p.id !== youId && p.name.toLowerCase().includes(who.trim().toLowerCase()))
    .slice(0, 6);
  const likeCount = (likes ?? 0) + (heartOn && liked == null ? 1 : 0);
  const item =
    "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground hover:bg-canvas hover:text-ink";

  return (
    <div data-clip-rail="1" className={cn("min-w-0 max-w-full border-t border-border bg-cream text-ink", className)}>
      <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {face ? <Portrait person={face} size="sm" presence={false} /> : <Heart className="size-4 fill-brick text-brick" />}
          <span>{tally(likeCount)}</span>
        </span>
        <button type="button" className="hover:underline" onClick={() => setBox(true)}>
          {tally(comments ?? wrote.length)} comments · {tally((reposts ?? 0) + (repostOn ? 1 : 0))} reposts
        </button>
      </div>
      <div className="grid grid-cols-5 border-t border-border">
        <button
          type="button"
          className={cn(item, heartOn && "text-brick")}
          onClick={() => {
            if (onLike) onLike();
            else {
              setLocalLike((v) => !v);
              noteWatch(localLike ? "unlike" : "like", meaning || "film");
            }
          }}
        >
          <Heart className={cn("size-5", heartOn && "fill-brick text-brick")} strokeWidth={1.75} />
          {heartOn ? "Loved" : "Like"}
        </button>
        <button
          type="button"
          className={cn(item, box && "text-ink")}
          onClick={() => {
            setBox(true);
            onComment?.();
            window.setTimeout(() => field.current?.focus(), 40);
          }}
        >
          <MessageCircle className="size-5" strokeWidth={1.75} />
          Comment
        </button>
        <button type="button" className={cn(item, (repostOn || sheet) && "text-ok")} onClick={() => setSheet((v) => !v)}>
          <Repeat2 className="size-5" strokeWidth={1.75} />
          Repost
        </button>
        <button type="button" className={cn(item, portal && "text-ink")} onClick={() => setPortal((v) => !v)}>
          <Send className="size-5" strokeWidth={1.75} />
          Send
        </button>
        <button
          type="button"
          className={cn(item, analyse && "text-ink")}
          onClick={() => {
            setAnalyse((v) => !v);
            noteWatch("meaning", meaning || "film", "Analyse");
          }}
        >
          <ScanSearch className="size-5" strokeWidth={1.75} />
          Analyse
        </button>
      </div>
      <RelatedStrip meaning={meaning} clipId={clipId} speakerId={face?.id} />
      {sheet ? (
        <div className="flex flex-wrap gap-1.5 px-3 pb-3">
          {(
            [
              ["linkedin", "LinkedIn"],
              ["facebook", "Facebook"],
              ["whatsapp", "WhatsApp"],
              ["instagram", "Instagram"],
              ["tiktok", "TikTok"],
            ] as const
          ).map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              className="h-9 rounded-full bg-ink px-3 text-xs font-medium text-cream"
              onClick={() => openNet(kind)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      {portal ? (
        <form className="flex flex-col gap-2 px-3 pb-3" onSubmit={deliver}>
          <input
            value={who}
            onChange={(e) => {
              setWho(e.target.value);
              setPick(null);
            }}
            placeholder="Who are you sending this to?"
            className="h-10 w-full rounded-lg border border-border bg-canvas px-3 text-sm outline-none"
          />
          <ul className="flex flex-col">
            {found.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={cn(
                    "flex h-9 w-full items-center rounded-md px-2 text-left text-sm",
                    pick === p.id ? "bg-ink text-cream" : "hover:bg-canvas",
                  )}
                  onClick={() => {
                    setPick(p.id);
                    setWho(p.name);
                  }}
                >
                  {p.name}
                  <span className="ml-2 text-xs opacity-60">{p.trade}</span>
                </button>
              </li>
            ))}
          </ul>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Add a note"
            className="w-full resize-none rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={!pick}
            className="h-9 self-end rounded-full bg-ink px-4 text-xs font-medium text-cream disabled:opacity-40"
          >
            Send
          </button>
        </form>
      ) : null}
      {box ? (
        <form
          className="flex flex-col gap-2 px-3 pb-3"
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim();
            if (!text) return;
            noteWatch("comment", meaning || clipId || "film", text);
            onWrite?.(text);
            setWrote((rows) => [text, ...rows].slice(0, 8));
            setDraft("");
          }}
        >
          <textarea
            ref={field}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Write a comment"
            className="w-full resize-none rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="h-9 self-end rounded-full bg-ink px-4 text-xs font-medium text-cream disabled:opacity-40"
          >
            Comment
          </button>
          {wrote.map((line) => (
            <p key={line} className="text-sm leading-snug">
              {line}
            </p>
          ))}
        </form>
      ) : null}
      {analyse ? (
        <div className="flex flex-col gap-2 border-t border-border px-3 py-3 text-sm leading-relaxed">
          <p className="font-medium">
            {face ? `${face.name} · ${face.level} ${face.trade}` : "The film"}
            {face?.city ? ` · ${face.city}` : ""}
          </p>
          {meaning ? <p>{meaning}</p> : <p className="text-muted-foreground">No words on this film yet.</p>}
          <p className="text-muted-foreground">
            What it is asking: {path.trade}. {checks[0] ?? path.steps}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              className="h-8 rounded-full bg-ink px-3 text-xs font-medium text-cream"
              onClick={() => {
                setStudy((v) => !v);
                noteWatch("study", path.trade, path.house);
              }}
            >
              Study this
            </button>
            <button
              type="button"
              className="h-8 rounded-full bg-canvas px-3 text-xs font-medium"
              onClick={() => {
                setOpenMeaning((v) => !v);
                noteWatch("meaning", meaning || "film", meaning);
              }}
            >
              Meaning
            </button>
            <Link to="/learn" className="inline-flex h-8 items-center text-xs font-medium underline">
              Open Learn
            </Link>
          </div>
        </div>
      ) : null}
      {openMeaning && meaning ? <p className="px-3 pb-3 text-sm leading-relaxed">{meaning}</p> : null}
      {study ? (
        <div className="flex flex-col gap-2 px-3 pb-3 text-sm leading-relaxed">
          <p className="font-medium">{path.trade}</p>
          <p>{path.steps}</p>
          <a href={path.href} target="_blank" rel="noreferrer" className="underline">
            Where it is issued · {path.house}
          </a>
          <a href={library.href} target="_blank" rel="noreferrer" className="underline">
            Paid library · {library.house}
          </a>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Say it back</p>
          {checks.map((line) => {
            const on = held.includes(line);
            return (
              <button
                key={line}
                type="button"
                className={cn("rounded-lg px-3 py-2 text-left", on ? "bg-ink text-cream" : "bg-canvas")}
                onClick={() => {
                  setHeld((rows) => (rows.includes(line) ? rows.filter((x) => x !== line) : [...rows, line]));
                  sitLesson(path.trade);
                }}
              >
                {on ? "Held · " : ""}
                {line}
              </button>
            );
          })}
          <Link to="/learn" className="text-xs font-medium underline">
            Open the full path on Learn
          </Link>
        </div>
      ) : null}
    </div>
  );
}
