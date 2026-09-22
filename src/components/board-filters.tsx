import { useEffect, type ReactNode } from "react";
import { Volume2 } from "lucide-react";
import { TRADE_GROUPS, TRADES } from "@/lib/seed";
import { talkAudio } from "@/lib/talk-scripts";
import { playHallVoice, stopHallVoice } from "@/lib/voice-bus";
import type { FieldGroup, Trade } from "@/lib/types";
import { cn } from "@/lib/utils";

export type BoardFilterFlag = {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
};

const HALL_MEDIA: Record<"all" | FieldGroup, { still: string; video?: string; label: string; personId?: string }> = {
  all: { still: "/sites/hall.jpg", label: "All" },
  trades: { still: "/sites/panel.jpg", video: "/reels/talk-jordan.mp4", label: "Trades", personId: "jordan-hale" },
  care: { still: "/sites/hospital.jpg", video: "/reels/talk-camila.mp4", label: "Care", personId: "camila-ruiz" },
  classroom: { still: "/sites/classroom.jpg", video: "/reels/talk-denise.mp4", label: "Classroom", personId: "denise-harper" },
  homes: { still: "/reels/talk-elena.jpg", video: "/reels/talk-elena.mp4", label: "Homes", personId: "elena-vasquez" },
  money: { still: "/reels/talk-grace.jpg", video: "/reels/talk-grace.mp4", label: "Money", personId: "grace-okonkwo" },
  build: { still: "/reels/talk-lena.jpg", video: "/reels/talk-lena.mp4", label: "Builders", personId: "lena-cho" },
};

const TICKET_MEDIA: Record<Trade, { still: string; video?: string; who: string; personId: string }> = {
  Electrician: { still: "/reels/talk-jordan.jpg", video: "/reels/talk-jordan.mp4", who: "Jordan Hale", personId: "jordan-hale" },
  Plumber: { still: "/reels/talk-marisol.jpg", video: "/reels/talk-marisol.mp4", who: "Marisol Vega", personId: "marisol-vega" },
  HVAC: { still: "/reels/talk-patty.jpg", video: "/reels/talk-patty.mp4", who: "Patty Nguyen", personId: "patty-nguyen" },
  Welder: { still: "/reels/talk-deshawn.jpg", video: "/reels/talk-deshawn.mp4", who: "DeShawn Brooks", personId: "deshawn-brooks" },
  Carpenter: { still: "/reels/talk-riley.jpg", video: "/reels/talk-riley.mp4", who: "Riley McCabe", personId: "riley-mccabe" },
  Ironworker: { still: "/reels/talk-hank.jpg", video: "/reels/talk-hank.mp4", who: "Hank Okafor", personId: "hank-okafor" },
  Millwright: { still: "/reels/talk-sam.jpg", video: "/reels/talk-sam.mp4", who: "Sam Park", personId: "sam-park" },
  Solar: { still: "/reels/talk-aisha.jpg", video: "/reels/talk-aisha.mp4", who: "Aisha Rahman", personId: "aisha-rahman" },
  Equipment: { still: "/reels/talk-luis.jpg", video: "/reels/talk-luis.mp4", who: "Luis Ortega", personId: "luis-ortega" },
  Elevator: { still: "/reels/talk-nora.jpg", video: "/reels/talk-nora.mp4", who: "Nora Ellison", personId: "nora-ellison" },
  Nurse: { still: "/reels/talk-camila.jpg", video: "/reels/talk-camila.mp4", who: "Camila Ruiz", personId: "camila-ruiz" },
  Physician: { still: "/reels/talk-priya.jpg", video: "/reels/talk-priya.mp4", who: "Priya Shah", personId: "priya-shah" },
  Pharmacist: { still: "/reels/talk-imani.jpg", video: "/reels/talk-imani.mp4", who: "Imani Cole", personId: "imani-cole" },
  Teacher: { still: "/reels/talk-denise.jpg", video: "/reels/talk-denise.mp4", who: "Denise Harper", personId: "denise-harper" },
  Faculty: { still: "/reels/talk-ruth.jpg", video: "/reels/talk-ruth.mp4", who: "Ruth Alvarez", personId: "ruth-alvarez" },
  Developer: { still: "/reels/talk-lena.jpg", video: "/reels/talk-lena.mp4", who: "Lena Cho", personId: "lena-cho" },
  Realtor: { still: "/reels/talk-elena.jpg", video: "/reels/talk-elena.mp4", who: "Elena Vasquez", personId: "elena-vasquez" },
  Agent: { still: "/reels/talk-nia.jpg", video: "/reels/talk-nia.mp4", who: "Nia Brooks", personId: "nia-brooks" },
  Therapist: { still: "/reels/talk-linh.jpg", video: "/reels/talk-linh.mp4", who: "Linh Phan", personId: "linh-phan" },
  Dentist: { still: "/reels/talk-omar.jpg", video: "/reels/talk-omar.mp4", who: "Omar Haddad", personId: "omar-haddad" },
  Advisor: { still: "/reels/talk-grace.jpg", video: "/reels/talk-grace.mp4", who: "Grace Okonkwo", personId: "grace-okonkwo" },
};

function hearPerson(personId?: string) {
  const src = personId ? talkAudio(personId) : "";
  if (src) playHallVoice(src);
  else stopHallVoice();
}

function MediaTile({
  still,
  video,
  play,
  caption,
  sub,
  live,
}: {
  still: string;
  video?: string;
  play: boolean;
  caption: string;
  sub?: string;
  live?: boolean;
}) {
  return (
    <span className="relative block aspect-[3/4] overflow-hidden bg-ink">
      {play && video ? (
        <video
          src={video}
          poster={still}
          className="absolute inset-0 size-full object-cover object-[center_18%]"
          muted
          loop
          playsInline
          autoPlay
        />
      ) : (
        <img src={still} alt="" className="absolute inset-0 size-full object-cover object-[center_18%]" />
      )}
      <span
        className={cn(
          "absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-ink/60",
          live && "bg-brick",
        )}
      >
        <Volume2 className="size-3.5 text-cream" />
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/70 to-transparent px-2 pb-2 pt-8">
        <span className="block truncate text-xs font-medium text-cream">{caption}</span>
        {sub ? <span className="block truncate text-[11px] text-cream/70">{sub}</span> : null}
        {live ? (
          <span className="mt-0.5 block text-[10px] tracking-wide text-cream/80 uppercase">Speaking</span>
        ) : (
          <span className="mt-0.5 block text-[10px] text-cream/55">Tap to hear</span>
        )}
      </span>
    </span>
  );
}

export function BoardFilters({
  group,
  trade,
  onGroup,
  onTrade,
  flags,
  hint,
  quiet = false,
}: {
  group: "all" | FieldGroup;
  trade: Trade | "all";
  onGroup: (g: "all" | FieldGroup) => void;
  onTrade: (t: Trade | "all") => void;
  flags?: BoardFilterFlag[];
  hint?: ReactNode;
  quiet?: boolean;
}) {
  const halls: { id: "all" | FieldGroup; label: string }[] = [
    { id: "all", label: "All" },
    ...TRADE_GROUPS.map((g) => ({ id: g.id, label: g.label })),
  ];
  const tickets =
    group === "all" ? TRADES : (TRADE_GROUPS.find((g) => g.id === group)?.trades ?? TRADES);
  const hallName = halls.find((h) => h.id === group)?.label ?? "All";
  const speakingId =
    trade !== "all" ? TICKET_MEDIA[trade].personId : group !== "all" ? HALL_MEDIA[group].personId : undefined;

  useEffect(() => {
    return () => stopHallVoice();
  }, []);

  if (quiet) {
    return (
      <section className="rounded-xl bg-cream p-3 shadow-[var(--shadow-border)] sm:p-4">
        <div className="flex flex-wrap gap-1.5">
          {halls.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                onGroup(h.id);
                onTrade("all");
              }}
              className={cn(
                "h-9 rounded-full px-3 text-sm font-medium",
                group === h.id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
              )}
            >
              {h.label}
            </button>
          ))}
        </div>
        {tickets.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onTrade("all")}
              className={cn(
                "h-9 rounded-full px-3 text-sm",
                trade === "all" ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
              )}
            >
              All in {hallName}
            </button>
            {tickets.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTrade(t)}
                className={cn(
                  "h-9 rounded-full px-3 text-sm",
                  trade === t ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        ) : null}
        {flags && flags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {flags.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={f.onClick}
                className={cn(
                  "h-9 rounded-full px-3 text-sm font-medium",
                  f.active ? "bg-brick text-cream" : "bg-canvas text-muted-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : null}
        {hint}
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-cream p-3 shadow-[var(--shadow-border)] sm:p-4">
      <p className="px-1 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        Hall
      </p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {halls.map((h) => {
          const media = HALL_MEDIA[h.id];
          const live = speakingId === media.personId && trade === "all";
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                onGroup(h.id);
                onTrade("all");
                hearPerson(media.personId);
              }}
              className={cn(
                "w-[6.5rem] shrink-0 overflow-hidden rounded-lg text-left sm:w-28",
                group === h.id ? "ring-2 ring-ink" : "opacity-85 hover:opacity-100",
              )}
            >
              <MediaTile
                still={media.still}
                video={media.video}
                play={group === h.id}
                caption={h.label}
                live={live}
              />
            </button>
          );
        })}
      </div>

      {tickets.length > 0 ? (
        <>
          <p className="mt-4 px-1 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Ticket
          </p>
          <div className="mt-2 flex gap-1 overflow-x-auto">
            <TicketChip active={trade === "all"} onClick={() => onTrade("all")}>
              All in {hallName}
            </TicketChip>
            {tickets.map((t) => (
              <TicketChip
                key={t}
                active={trade === t}
                onClick={() => {
                  onTrade(t);
                  hearPerson(TICKET_MEDIA[t].personId);
                }}
              >
                {t}
              </TicketChip>
            ))}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {tickets.map((t) => {
              const media = TICKET_MEDIA[t];
              const live = speakingId === media.personId && trade === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    onTrade(t);
                    hearPerson(media.personId);
                  }}
                  className={cn(
                    "w-[7.5rem] shrink-0 overflow-hidden rounded-lg text-left sm:w-36",
                    trade === t ? "ring-2 ring-brick" : "opacity-85 hover:opacity-100",
                  )}
                >
                  <MediaTile
                    still={media.still}
                    video={media.video}
                    play={trade === t}
                    caption={t}
                    sub={media.who}
                    live={live}
                  />
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {flags && flags.length > 0 ? (
        <>
          <div className="mt-4 h-px bg-ink/10" />
          <div className="mt-3 flex flex-wrap gap-2">
            {flags.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={f.onClick}
                className={cn(
                  "h-10 rounded-lg px-3.5 text-sm font-medium transition-colors duration-150",
                  f.active
                    ? "bg-brick text-cream"
                    : "bg-canvas text-muted-foreground hover:text-ink",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {hint ? <p className="mt-3 px-1 text-xs text-muted-foreground">{hint}</p> : null}
    </section>
  );
}

function TicketChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 shrink-0 rounded-lg px-3.5 text-sm font-medium transition-colors duration-150",
        active ? "bg-ink text-cream" : "text-muted-foreground hover:bg-canvas hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
