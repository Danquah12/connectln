import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WorkFrame, workSerial, HOUSE_NAME, stripHouse } from "@/components/work-frame";
import { YoutubeClip } from "@/components/youtube-clip";
import { lessons, trainings } from "@/lib/board-seed";
import { hallClipLive, isLecturePost } from "@/lib/clip-ingest";
import { sitStreak } from "@/lib/return";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Trade } from "@/lib/types";

const TRACKS: { id: "all" | "care" | "tools" | "build" | "civic" | "lab"; label: string; trades?: Trade[] }[] = [
  { id: "all", label: "All houses" },
  { id: "care", label: "Care", trades: ["Nurse", "Physician", "Pharmacist", "Therapist", "Dentist"] },
  { id: "tools", label: "On the tools", trades: ["Electrician", "Plumber", "HVAC", "Welder", "Carpenter"] },
  { id: "build", label: "Build", trades: ["Developer", "Faculty"] },
  { id: "civic", label: "Civic", trades: ["Advisor", "Realtor"] },
  { id: "lab", label: "Labs", trades: ["Faculty"] },
];

export const Route = createFileRoute("/learn")({ component: LearnPage });

function LearnPage() {
  const people = useForge((s) => s.people);
  const posts = useForge((s) => s.posts);
  const clipStatus = useForge((s) => s.clipStatus);
  const satLessonIds = useForge((s) => s.satLessonIds);
  const satDays = useForge((s) => s.satDays);
  const sitLesson = useForge((s) => s.sitLesson);
  const streak = sitStreak(satDays);
  const [openId, setOpenId] = useState<string | null>(null);
  const [track, setTrack] = useState<(typeof TRACKS)[number]["id"]>("all");

  const lectures = useMemo(() => {
    const rows = posts.filter((p) => isLecturePost(p) && p.youtube && hallClipLive(p.youtube, clipStatus, p.id));
    const t = TRACKS.find((x) => x.id === track);
    if (!t?.trades) return rows;
    return rows.filter((p) => {
      const who = personById(people, p.authorId);
      return who ? t.trades!.includes(who.trade) : false;
    });
  }, [posts, clipStatus, track, people]);
  const open = lectures.find((p) => p.id === openId);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Learn → certify → prove → work</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lectures live here — MIT, Johns Hopkins, NIH, the academies. Shop talk stays the hall.
          {streak ? ` ${streak}-day sit streak.` : ""}
        </p>
      </header>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Houses</h2>
        <p className="mt-1 text-xs text-muted-foreground">One lecture at a time. Stamped {HOUSE_NAME}. Not on Shop talk.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {TRACKS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTrack(t.id)}
              className={cn(
                "h-9 rounded-full px-3 text-sm font-medium",
                track === t.id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {open?.youtube ? (
          <div className="mt-3">
            <WorkFrame serial={workSerial(open.id)} stamp={HOUSE_NAME}>
              <YoutubeClip id={open.youtube} headline={stripHouse(open.headline)} title={open.headline} bare />
            </WorkFrame>
            <p className="mt-2 text-sm font-medium">{stripHouse(open.headline)}</p>
            <button type="button" className="mt-1 text-xs text-brick hover:underline" onClick={() => setOpenId(null)}>
              Close lecture
            </button>
          </div>
        ) : null}
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {lectures.slice(0, 12).map((p) => {
            const who = personById(people, p.authorId);
            const on = p.id === openId;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(on ? null : p.id)}
                  className="w-full overflow-hidden rounded-lg bg-canvas text-left"
                >
                  <img src={p.photo} alt="" className="aspect-video w-full object-cover" />
                  <span className="block truncate px-2 py-1.5 text-xs font-medium">
                    {stripHouse(p.headline) || who?.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {lectures.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">The desk is pulling houses. Sit a lesson below meanwhile.</p>
        ) : null}
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Teach me</h2>
        <ul className="mt-3 space-y-3">
          {lessons.map((l) => {
            const a = personById(people, l.authorId);
            const sat = satLessonIds.includes(l.id);
            return (
              <li key={l.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{l.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a?.name} · {l.minutes} min · {l.topic}
                    {sat ? " · sat" : ""}
                  </p>
                </div>
                <Button
                  variant={sat ? "ink" : "outline"}
                  size="sm"
                  onClick={() => {
                    sitLesson(l.id);
                    toast(`Sat ${l.title}.`);
                  }}
                >
                  {sat ? "Sat" : "Sit it"}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Training marketplace</h2>
        <ul className="mt-3 space-y-3">
          {trainings.map((t) => (
            <li key={t.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t.place} · {t.when} · {t.tickets.join(", ")}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/events">See the calendar</Link>
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-xs text-muted-foreground">
        Then{" "}
        <Link to="/challenges" className="text-brick hover:underline">
          prove it
        </Link>
        , claim{" "}
        <Link to="/fund" className="text-brick hover:underline">
          funding
        </Link>
        , or take a call.
      </p>
    </div>
  );
}
