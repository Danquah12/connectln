import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { IdentityCard } from "@/components/identity-card";
import { NeedOffer, ProofStrip } from "@/components/proof-strip";
import { ExampleMark } from "@/components/example-mark";
import { ContactDesk } from "@/components/contact-desk";
import { LineCompose } from "@/components/line-compose";
import { ReportControl } from "@/components/report-control";
import { Portrait } from "@/components/portrait";
import { SkillsRadar } from "@/components/radar";
import { TicketPlate } from "@/components/ticket-plate";
import { ReelStage, workSerial } from "@/components/work-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { skillDemos } from "@/lib/board-seed";
import { isExample } from "@/lib/example";
import {
  availabilityLabel,
  cardName,
  clearanceLabel,
  isTrades,
  rankLabel,
  relTime,
  veteranLabel,
  yearsLabel,
} from "@/lib/format";
import { presenceLabel, presenceOf } from "@/lib/presence";
import { listings as seedListings } from "@/lib/market-seed";
import { seedReels } from "@/lib/reel-seed";
import { translateMos } from "@/lib/mos";
import { reputation } from "@/lib/reputation";
import { cohorts, projects } from "@/lib/seed";
import { personById, useForge } from "@/lib/store";
import { careerTrack } from "@/lib/tracks";
import { fraudFlags, trustLabel, trustTier } from "@/lib/trust";
import { cn } from "@/lib/utils";
import { sharedJobSites } from "@/lib/loop";
import { VOUCH_KINDS, vouchKindLabel } from "@/lib/vouch";
import type { VouchKind } from "@/lib/types";

export const Route = createFileRoute("/p/$id")({ component: ProfilePage });

function ProfilePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const people = useForge((s) => s.people);
  const vouches = useForge((s) => s.vouches);
  const youId = useForge((s) => s.youId);
  const startThread = useForge((s) => s.startThread);
  const addVouch = useForge((s) => s.addVouch);
  const requestMentor = useForge((s) => s.requestMentor);
  const requestIntro = useForge((s) => s.requestIntro);
  const menteeOf = useForge((s) => s.menteeOf);
  const intros = useForge((s) => s.intros);
  const gigModes = useForge((s) => s.gigModes);
  const extra = useForge((s) => s.extraListings);
  const extraReels = useForge((s) => s.extraReels);
  const posts = useForge((s) => s.posts);
  const calls = useForge((s) => s.calls);
  const callHires = useForge((s) => s.callHires);
  const person = personById(people, id);
  const you = personById(people, youId);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [site, setSite] = useState("");
  const [kinds, setKinds] = useState<VouchKind[]>(["quality", "reliability"]);
  const [lineOpen, setLineOpen] = useState(false);
  const savedPersonIds = useForge((s) => s.savedPersonIds);
  const toggleSavePerson = useForge((s) => s.toggleSavePerson);

  useEffect(() => {
    if (!id || id === youId) return;
    useForge.getState().markCard();
  }, [id, youId]);

  if (!person) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Nobody by that name on the board.</p>;
  }

  const mine = person.id === youId;
  const received = vouches.filter((v) => v.toId === person.id);
  const already = vouches.some((v) => v.fromId === youId && v.toId === person.id);
  const score = reputation(person, vouches);
  const track = careerTrack(person);
  const mos = person.veteran ? translateMos(person.veteran.mos) : null;
  const personCohorts = cohorts.filter((c) => (person.cohortIds ?? []).includes(c.id));
  const through =
    !mine && you
      ? people.find(
          (p) =>
            p.id !== you.id &&
            p.id !== person.id &&
            person.history.some((h) => (h.teamIds ?? []).includes(p.id)) &&
            you.history.some((h) => (h.teamIds ?? []).includes(p.id)),
        )
      : undefined;
  const sharedJobs =
    you && person && !mine ? sharedJobSites(you, person, { calls, callHires }) : [];
  const onMarket = [...extra, ...seedListings].filter((l) => l.sellerId === person.id);
  const postedLines = posts.filter((p) => p.authorId === person.id && (p.youtube || p.video));
  const postedReels = [...extraReels, ...seedReels].filter((r) => r.personId === person.id && (r.youtube || r.video));
  const coworkerIds = [
    ...new Set(
      [
        ...person.history.flatMap((h) => h.teamIds ?? []),
        ...projects.filter((pr) => pr.memberIds.includes(person.id)).flatMap((pr) => pr.memberIds),
      ].filter((i) => i !== person.id),
    ),
  ];

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-cream shadow-[var(--shadow-border)]">
        <div className="h-36 overflow-hidden rounded-t-xl sm:h-44">
          <img
            src={person.cover || "/sites/panel.jpg"}
            alt=""
            className="size-full object-cover object-top"
            crossOrigin="anonymous"
          />
        </div>
        <div className="px-4 pb-5 sm:px-6">
          <div className="-mt-12 w-fit">
            <Portrait person={person} size="xl" link={false} className="ring-4 ring-cream" />
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-4xl tracking-wide text-ink">
                {cardName(person)}
                {isExample(person) ? <ExampleMark className="ml-3 align-middle" /> : null}
              </h1>
              {isExample(person) ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Example card so the hall isn't empty. Not a real member. These peel off as
                  people in {person.trade.toLowerCase()} join.
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {rankLabel(person.level, person.trade)}
                {person.city ? ` · ${person.city}, ${person.state}` : " · add your city on the card"}
              </p>
              <p
                className={cn(
                  "mt-1 text-xs",
                  presenceOf(person) === "online" ? "text-ok" : "text-muted-foreground",
                )}
              >
                {presenceLabel(person)}
                {mine ? " · that's you" : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{trustLabel(trustTier(person, vouches))}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {mine ? (
                <Button asChild variant="ink">
                  <Link to="/you">Edit your card</Link>
                </Button>
              ) : (
                <>
                  <Button
                    variant="ink"
                    onClick={() => {
                      startThread(person.id, "");
                      navigate({ to: "/messages" });
                    }}
                  >
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toggleSavePerson(person.id)}
                  >
                    {savedPersonIds.includes(person.id) ? "Saved" : "Save card"}
                  </Button>
                  <Button variant="outline" onClick={() => setLineOpen(true)}>
                    Send a line
                  </Button>
                  <Button variant="outline" disabled={already} onClick={() => setOpen(true)}>
                    {already ? "Vouched" : "Vouch"}
                  </Button>
                  <ReportControl kind="person" targetId={person.id} target={cardName(person)} />
                  {person.mentoring ? (
                    <Button
                      variant="outline"
                      disabled={menteeOf === person.id}
                      onClick={() => {
                        requestMentor(person.id);
                        toast(`Asked ${person.name.split(" ")[0]} to take you on.`);
                      }}
                    >
                      {menteeOf === person.id ? "Mentee" : "Learn from them"}
                    </Button>
                  ) : null}
                  {through ? (
                    <Button
                      variant="outline"
                      disabled={intros.some((i) => i.toId === person.id)}
                      onClick={() => {
                        requestIntro(through.id, person.id);
                        toast(`Asked ${through.name.split(" ")[0]} to introduce you.`);
                      }}
                    >
                      Ask {through.name.split(" ")[0]} to intro
                    </Button>
                  ) : null}
                </>
              )}
              {mine ? (
                <Button variant="outline" onClick={() => setLineOpen(true)}>
                  Send a line
                </Button>
              ) : null}
              <Button variant="outline" asChild>
                <Link to="/card/$id" params={{ id: person.id }}>
                  Card
                </Link>
              </Button>
              {mine ? (
                <Button variant="outline" asChild>
                  <Link to="/passport">Passport</Link>
                </Button>
              ) : null}
              <Button variant="outline" asChild>
                <Link to="/become">What can I become?</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/legacy/$id" params={{ id: person.id }}>
                  Legacy
                </Link>
              </Button>
              {person.level === "Apprentice" ? (
                <Button variant="outline" asChild>
                  <Link to="/student/$id" params={{ id: person.id }}>
                    Student card
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              variant={
                person.availability === "open" ? "ok" : person.availability === "on-job" ? "warn" : "muted"
              }
            >
              {availabilityLabel(person.availability)}
            </Badge>
            {person.union ? (
              <Badge variant="default">{person.union}</Badge>
            ) : isTrades(person.trade) ? (
              <Badge>Open shop</Badge>
            ) : null}
            <Badge variant="outline">{yearsLabel(person)}</Badge>
            {person.rate ? <Badge variant="outline">{person.rate}</Badge> : null}
            <Badge variant="outline">{person.travelMiles} mi travel</Badge>
            {person.mentoring ? <Badge variant="outline">Mentor</Badge> : null}
            {person.seekingMentor ? <Badge variant="outline">Looking for a mentor</Badge> : null}
            {veteranLabel(person) ? <Badge variant="brick">{veteranLabel(person)}</Badge> : null}
            {(mine ? gigModes : person.gigModes)?.map((g) => (
              <Badge key={g} variant="ok">
                {g}
              </Badge>
            ))}
          </div>
          {fraudFlags(person).length ? (
            <p className="mt-3 text-xs text-warn">{fraudFlags(person).join(" · ")}</p>
          ) : null}
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed">{person.bio}</p>
          <div className="mt-3">
            <ProofStrip person={person} vouches={vouches} />
          </div>
          <div className="mt-3">
            <NeedOffer person={person} />
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {person.specialties.map((s) => (
              <Badge key={s} variant="muted">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {!mine ? (
        <ContactDesk
          person={person}
          onJobAsk={(body) => {
            startThread(person.id, body);
            navigate({ to: "/messages" });
          }}
        />
      ) : (
        <ContactDesk
          person={person}
          onJobAsk={() => navigate({ to: "/you" })}
        />
      )}

      {person.openTo && person.availability === "open" ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
          <h2 className="font-display text-2xl tracking-wide">Open to calls</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[11px] text-muted-foreground">Looking</dt>
              <dd>{person.openTo.looking}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Where</dt>
              <dd>{person.openTo.locations}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">When / min</dt>
              <dd>
                {person.openTo.when} · {person.openTo.minRate}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Travel / shift</dt>
              <dd>
                {person.openTo.travel} · {person.openTo.shift}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
        <p className="text-xs text-muted-foreground">
          Credentials, time on the tools, vouches, proof of work, reliability. Not a follower count.
        </p>
        <p className="mt-2 font-display text-5xl tabular-nums tracking-wide">{score.overall}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
          {(
            [
              ["Credentials", score.credentials],
              ["Experience", score.experience],
              ["Vouches", score.vouches],
              ["Work", score.work],
              ["Reliability", score.reliability],
            ] as const
          ).map(([label, n]) => (
            <div key={label}>
              <dt className="text-[11px] text-muted-foreground">{label}</dt>
              <dd className="font-medium tabular-nums">{n}</dd>
              <div className="mt-1 h-1 rounded-full bg-canvas">
                <div className="h-1 rounded-full bg-brick" style={{ width: `${n}%` }} />
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
        <h2 className="font-display text-2xl tracking-wide">Skills radar</h2>
        <SkillsRadar person={person} vouches={vouches} />
      </section>

      {person.tools?.length ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
          <h2 className="font-display text-2xl tracking-wide">Tool belt</h2>
          <p className="mt-2 text-sm">{person.tools.join(" · ")}</p>
          {person.software?.length ? (
            <p className="mt-1 text-xs text-muted-foreground">{person.software.join(" · ")}</p>
          ) : null}
        </section>
      ) : null}

      {person.veteran ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
          <h2 className="font-display text-2xl tracking-wide">Service</h2>
          <p className="text-xs text-muted-foreground">
            MOS stays on the card. Civilian language is a translation, not a replacement.
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-4">
            <div>
              <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">Branch</dt>
              <dd className="mt-0.5 text-sm font-medium">{person.veteran.branch}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">MOS</dt>
              <dd className="mt-0.5 text-sm font-medium">{person.veteran.mos}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">Years</dt>
              <dd className="mt-0.5 text-sm font-medium tabular-nums">{person.veteran.years}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">Clearance</dt>
              <dd className="mt-0.5 text-sm font-medium">{clearanceLabel(person) ?? "None on file"}</dd>
            </div>
          </dl>
          {mos ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Civilian skills</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {mos.skills.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] tracking-wide text-muted-foreground uppercase">You may qualify for</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {mos.careers.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
        <h2 className="font-display text-2xl tracking-wide">Credential wallet</h2>
        <p className="text-xs text-muted-foreground">
          Verified, pending, or unverified. Issuer, number, issued, expiry. Not a PDF resume.
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {person.tickets.map((t) => (
            <TicketPlate key={t.id} ticket={t} />
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
        <h2 className="font-display text-2xl tracking-wide">Career progress</h2>
        <p className="text-xs text-muted-foreground">{track.title}</p>
        <p className="mt-2 font-display text-4xl tabular-nums">{track.percent}%</p>
        <p className="text-sm text-muted-foreground">Next: {track.next}</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {track.steps.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <span className={s.done ? "text-ok" : "text-muted-foreground"}>{s.done ? "✓" : "⬜"}</span>
              {s.label}
            </li>
          ))}
        </ul>
      </section>

      {postedLines.length || postedReels.length ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
          <h2 className="font-display text-2xl tracking-wide">Posted this work</h2>
          <p className="text-xs text-muted-foreground">
            {person.name.split(" ")[0]} put these on shop talk and reels. House mark: Expedite Consults LLC.
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {postedLines.map((p) => (
              <li key={p.id}>
                <Link to="/" hash={p.id} className="block overflow-hidden rounded-lg bg-canvas">
                  {p.photo ? (
                    <img src={p.photo} alt="" className="aspect-video w-full object-cover" />
                  ) : null}
                  <span className="block p-2 text-xs font-medium">{p.headline || p.body.slice(0, 48)}</span>
                </Link>
              </li>
            ))}
            {postedReels.map((r) => (
              <li key={r.id}>
                <Link to="/reels" search={{ id: r.id }} className="block">
                  <ReelStage serial={workSerial(r.id)} stamp="Reel">
                    <img src={r.still} alt="" className="size-full object-cover object-[center_18%]" />
                  </ReelStage>
                  <span className="mt-1 block text-xs font-medium">{r.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
        <h2 className="font-display text-2xl tracking-wide">Proof of work</h2>
        <p className="text-xs text-muted-foreground">
          Not just the shop name. What you did, with whom, and who will stand next to it.
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {person.history.map((h) => (
            <li key={h.id} className="overflow-hidden rounded-lg bg-canvas">
              {h.photos?.length ? (
                <div className={h.photos.length > 1 ? "grid grid-cols-3" : ""}>
                  {h.photos.slice(0, 3).map((src, i) => (
                    <div key={src} className="relative">
                      <img src={src} alt="" className="aspect-[4/3] w-full object-cover" crossOrigin="anonymous" />
                      {h.photos && h.photos.length > 1 ? (
                        <span className="absolute bottom-1 left-1 rounded bg-ink/70 px-1.5 text-[10px] text-cream">
                          {["Before", "During", "After"][i] ?? "Still"}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="p-3">
                <p className="text-sm font-medium">{h.name}</p>
                <p className="text-xs text-muted-foreground">
                  {h.city} · {h.when}
                  {h.duration ? ` · ${h.duration}` : ""}
                  {h.crew ? ` · ${h.crew}-person crew` : ""}
                  {h.verified ? " · Employer verified" : ""}
                </p>
                <p className="mt-1 text-sm">{h.role}</p>
                {h.skills?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {h.skills.map((s) => (
                      <Badge key={s} variant="muted">
                        {s}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {vouches
                  .filter((v) => v.toId === person.id && v.site === h.name)
                  .map((v) => {
                    const who = personById(people, v.fromId);
                    return (
                      <div key={v.id} className="mt-2 flex items-start gap-2">
                        {who ? <Portrait person={who} size="sm" link={false} /> : null}
                        <div className="min-w-0">
                          <p className="text-xs font-medium">
                            {who ? who.name : "Crew"} · {v.kinds?.map(vouchKindLabel).join(" · ")}
                          </p>
                          <p className="text-xs text-muted-foreground">{v.body}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {coworkerIds.length ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
          <h2 className="font-display text-2xl tracking-wide">Worked with</h2>
          <p className="text-xs text-muted-foreground">Same jobsite. Not a suggestion engine.</p>
          <ul className="mt-3 flex flex-col gap-2">
            {coworkerIds.slice(0, 8).map((cid) => {
              const c = personById(people, cid);
              if (!c) return null;
              return (
                <li key={cid}>
                  <Link to="/p/$id" params={{ id: c.id }} className="flex items-center gap-2">
                    <Portrait person={c} size="sm" link={false} />
                    <span className="text-sm">
                      {c.name} · {c.trade}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {skillDemos.filter((d) => d.personId === person.id).length ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
          <h2 className="font-display text-2xl tracking-wide">Skill proofs</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {skillDemos
              .filter((d) => d.personId === person.id)
              .map((d) => (
                <li key={d.id}>
                  {d.title} · {d.score.toFixed(1)} ·{" "}
                  <Link to="/challenges" className="text-brick hover:underline">
                    library
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      {onMarket.length ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
          <h2 className="font-display text-2xl tracking-wide">On the market</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {onMarket.map((l) => (
              <li key={l.id}>
                <Link to="/listing/$id" params={{ id: l.id }} className="text-brick hover:underline">
                  {l.title}
                </Link>{" "}
                · {l.price}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
        <h2 className="font-display text-2xl tracking-wide">Vouches</h2>
        <p className="text-xs text-muted-foreground">
          Each vouch names a shared call, crew, or job. No shared work, no vouch.
        </p>
        <p className="text-xs text-muted-foreground">
          Who worked with them, and what they will actually stand behind.
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {received.map((v) => {
            const from = personById(people, v.fromId);
            if (!from) return null;
            return (
              <li key={v.id} className="rounded-lg bg-canvas p-3">
                <div className="flex items-center gap-2">
                  <Portrait person={from} size="sm" />
                  <div>
                    <Link to="/p/$id" params={{ id: from.id }} className="text-sm font-medium hover:underline">
                      {from.name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {rankLabel(from.level, from.trade)} · {v.site} · {relTime(v.createdAt)}
                    </p>
                  </div>
                </div>
                {v.kinds?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {v.kinds.map((k) => (
                      <Badge key={k} variant="ok">
                        {vouchKindLabel(k)}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <p className="mt-2 text-sm leading-relaxed">{v.body}</p>
              </li>
            );
          })}
          {received.length === 0 ? <li className="text-sm text-muted-foreground">No vouches yet.</li> : null}
        </ul>
      </section>

      {personCohorts.length > 0 ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
          <h2 className="font-display text-2xl tracking-wide">Cohorts</h2>
          <p className="text-xs text-muted-foreground">
            Apprenticeship, unit, nursing program, teacher prep. People who were actually there.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {personCohorts.map((c) => (
              <li key={c.id}>
                <Link
                  to="/c/$id"
                  params={{ id: c.id }}
                  className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2.5 hover:bg-accent"
                >
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{c.memberIds.length} members</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <IdentityCard person={person} vouches={vouches} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vouch for {person.name.split(" ")[0]}</DialogTitle>
            <DialogDescription>
              Name the jobsite you were both on. Pick what you will stand behind. Skip the adjectives.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!site.trim()) return;
              addVouch(person.id, body, site, kinds);
              setOpen(false);
              setBody("");
              setSite("");
              toast(`Vouch is on ${person.name.split(" ")[0]}'s card, and in their inbox.`);
            }}
          >
            {sharedJobs.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {sharedJobs.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSite(name)}
                    className={cn(
                      "h-8 rounded-full px-3 text-xs",
                      site === name ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No shared job on the board. Hire together or work a crew before you vouch.
              </p>
            )}
            <Input
              value={site}
              onChange={(e) => setSite(e.target.value)}
              placeholder="Pick a shared jobsite"
              required
              readOnly
            />
            <div className="flex flex-wrap gap-1.5">
              {VOUCH_KINDS.map((k) => {
                const on = kinds.includes(k.id);
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() =>
                      setKinds((prev) => (on ? prev.filter((x) => x !== k.id) : [...prev, k.id]))
                    }
                    className={cn(
                      "h-8 rounded-full px-3 text-xs",
                      on ? "bg-ok/15 text-ok" : "bg-canvas text-muted-foreground",
                    )}
                  >
                    {k.label}
                  </button>
                );
              })}
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Worked with them on… showed up… I'd take them again because…"
            />
            <Button type="submit" disabled={!body.trim() || !sharedJobs.includes(site) || kinds.length === 0}>
              Post vouch
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <LineCompose open={lineOpen} onOpenChange={setLineOpen} to={person} />
    </div>
  );
}
