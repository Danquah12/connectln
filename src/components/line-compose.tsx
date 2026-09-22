import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PenLine } from "lucide-react";
import { Portrait } from "@/components/portrait";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { handleOf, LINE_INTENTS, LINE_LIMIT, lineForPerson, lineStarters, shareOut } from "@/lib/line-starters";
import { personById, useForge } from "@/lib/store";
import { toast } from "sonner";
import type { Person, Post, PostKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LineTrigger({
  variant = "header",
}: {
  variant?: "header" | "nav" | "fab" | "bar";
}) {
  const [open, setOpen] = useState(false);
  const btn =
    variant === "fab" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hall-float fixed right-3 z-50 flex h-12 items-center gap-2 rounded-full bg-brick px-4 text-sm font-medium text-cream shadow-[var(--shadow-border)] sm:right-4 sm:h-14 sm:px-5 lg:hidden"
      >
        <PenLine className="size-5" strokeWidth={1.75} />
        Line
      </button>
    ) : variant === "nav" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center gap-3 rounded-lg bg-brick px-3 text-sm font-medium text-cream"
      >
        <PenLine className="size-4" strokeWidth={1.75} />
        Line
      </button>
    ) : variant === "bar" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brick px-3 text-sm text-cream"
      >
        <PenLine className="size-3.5" strokeWidth={1.75} />
        Line
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brick px-3 text-sm font-medium text-cream"
      >
        <PenLine className="size-4" strokeWidth={1.75} />
        Line
      </button>
    );

  return (
    <>
      {btn}
      <LineCompose open={open} onOpenChange={setOpen} />
    </>
  );
}

export function LineButton() {
  return <LineTrigger variant="fab" />;
}

export function LineCompose({
  open,
  onOpenChange,
  quote,
  to,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote?: Post;
  to?: Person;
}) {
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const createPost = useForge((s) => s.createPost);
  const startThread = useForge((s) => s.startThread);
  const you = personById(people, youId);
  const [kind, setKind] = useState<PostKind>(to ? "talk" : quote ? "talk" : "work");
  const [body, setBody] = useState(to ? lineForPerson(to) : "");
  const [dest, setDest] = useState<"hall" | "out" | "both">("hall");
  const [tagged, setTagged] = useState<Person[]>(to ? [to] : []);

  const starters = useMemo(() => (you ? lineStarters(you) : []), [you]);
  const hall = useMemo(
    () => people.filter((p) => p.id !== youId && you && p.trade === you.trade).slice(0, 8),
    [people, you, youId],
  );
  const quoted = quote ? personById(people, quote.authorId) : null;
  const left = LINE_LIMIT - body.length;
  const canSend = body.trim().length > 0 && left >= 0;

  function tag(person: Person) {
    const token = `@${handleOf(person)} `;
    setTagged((list) => (list.some((p) => p.id === person.id) ? list : [...list, person]));
    setBody((b) => (b.includes(`@${handleOf(person)}`) || b.includes(`@${person.name}`) ? b : `${b}${b && !b.endsWith(" ") ? " " : ""}${token}`.slice(0, LINE_LIMIT)));
  }

  function send(where: "hall" | "out" | "both" = dest) {
    if (!canSend) return;
    if (where === "hall" || where === "both") {
      createPost(body, kind, undefined, undefined, quote?.id);
      for (const person of tagged) {
        if (person.id !== youId) startThread(person.id, body);
      }
      toast(
        tagged.length
          ? "On the hall, and in their inbox."
          : "On the hall.",
      );
    }
    if (where === "out" || where === "both") {
      void shareOut(body, tagged);
    }
    setBody(to ? lineForPerson(to) : "");
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next && to) {
          setBody(lineForPerson(to));
          setTagged([to]);
          setDest("hall");
        }
      }}
    >
      <DialogContent className="max-w-md p-5">
        <DialogHeader className="mb-3">
          <DialogTitle>{to ? `Line @${handleOf(to)}` : "Send a line"}</DialogTitle>
          <DialogDescription>
            A line is ours. The hall sees it. Public sends it out of ConnectLn — your phone, your list.
          </DialogDescription>
        </DialogHeader>

        {quoted && quote ? (
          <blockquote className="mb-3 rounded-lg bg-canvas px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">{quoted.name}</p>
            <p className="line-clamp-3">{quote.body}</p>
          </blockquote>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {LINE_INTENTS.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => setKind(i.id)}
              className={cn(
                "h-9 rounded-full px-3 text-sm",
                kind === i.id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
              )}
            >
              {i.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {LINE_INTENTS.find((i) => i.id === kind)?.hint}
        </p>

        <div className="mt-3 flex gap-3">
          {you ? <Portrait person={you} size="sm" link={false} /> : null}
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, LINE_LIMIT))}
            placeholder={
              kind === "call"
                ? "Need two HVAC techs. Occupied clinic. Tomorrow. Rate on the card."
                : "What's the line."
            }
            className="min-h-28 bg-canvas"
            autoFocus
          />
        </div>
        <p className={cn("mt-1 text-right text-xs tabular-nums", left < 20 ? "text-brick" : "text-muted-foreground")}>
          {left}
        </p>

        {!quote && !to && starters.length ? (
          <div className="mt-2 flex flex-col gap-1.5">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">From your card</p>
            {starters.map((s) => (
              <button
                key={s.text}
                type="button"
                onClick={() => {
                  setKind(s.kind);
                  setBody(s.text);
                }}
                className="rounded-lg bg-canvas px-3 py-2 text-left text-sm leading-snug hover:bg-accent"
              >
                {s.text}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-3">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Tag people on this line
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(to ? [to, ...hall.filter((p) => p.id !== to.id)] : hall).map((p) => {
              const on = tagged.some((t) => t.id === p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => tag(p)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-xs",
                    on ? "bg-ink text-cream" : "bg-canvas",
                  )}
                >
                  <Portrait person={p} size="sm" link={false} />
                  @{handleOf(p)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Where it goes</p>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {([
              ["hall", "Hall"],
              ["out", "Public"],
              ["both", "Hall + public"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setDest(id)}
                className={cn(
                  "h-10 rounded-lg text-sm",
                  dest === id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={!canSend} onClick={() => send("out")}>
            Send out
          </Button>
          <Button type="button" disabled={!canSend} onClick={() => send(dest)}>
            {dest === "out" ? "Send out" : dest === "hall" ? "Send to hall" : "Send both"}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Hiring lines also land on{" "}
          <Link to="/calls" className="underline">
            Calls
          </Link>
          . Public uses your device share sheet — not another network's name.
        </p>
      </DialogContent>
    </Dialog>
  );
}
