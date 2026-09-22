import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { LoopStrip } from "@/components/loop-strip";
import { MailCompose } from "@/components/mail-compose";
import { Portrait } from "@/components/portrait";
import { Button } from "@/components/ui/button";
import { runMailAi } from "@/lib/crm";
import { hallAddress } from "@/lib/mail";
import { relTime } from "@/lib/format";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mail")({
  validateSearch: (raw: Record<string, unknown>) => ({
    to: typeof raw.to === "string" ? raw.to : undefined,
  }),
  component: MailPage,
});

function MailPage() {
  const { to } = Route.useSearch();
  const mail = useForge((s) => s.mail);
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const markMailRead = useForge((s) => s.markMailRead);
  const logLine = useForge((s) => s.logLine);
  const sendMail = useForge((s) => s.sendMail);
  const lineSessions = useForge((s) => s.lineSessions);
  const [tab, setTab] = useState<"in" | "out">(to ? "out" : "in");
  const [openId, setOpenId] = useState<string | null>(null);
  const composeTo = to ? personById(people, to) : undefined;

  const inbox = useMemo(() => mail.filter((m) => m.toId === youId), [mail, youId]);
  const sent = useMemo(() => mail.filter((m) => m.fromId === youId), [mail, youId]);
  const list = tab === "in" ? inbox : sent;
  const unread = inbox.filter((m) => !m.read).length;

  if (!you) return null;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Hall mail</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hallAddress(you)}. Letters stay on ConnectLn. The desk can see the log. Not an outside inbox.
        </p>
      </header>

      {composeTo ? <MailCompose person={composeTo} /> : null}

      <div className="flex gap-1.5">
        {(
          [
            ["in", `In${unread ? ` · ${unread}` : ""}`],
            ["out", "Sent"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "h-9 rounded-full px-3 text-sm",
              tab === id ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {list.map((letter) => {
          const otherId = tab === "in" ? letter.fromId : letter.toId;
          const other = personById(people, otherId);
          const open = openId === letter.id;
          return (
            <li key={letter.id} className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
              <button
                type="button"
                className="flex w-full items-start gap-3 text-left"
                onClick={() => {
                  setOpenId(open ? null : letter.id);
                  if (tab === "in" && !letter.read) markMailRead(letter.id);
                }}
              >
                {other ? <Portrait person={other} size="sm" link={false} /> : null}
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={cn("truncate text-sm", !letter.read && tab === "in" && "font-medium")}>
                      {other?.name ?? otherId} · {letter.subject}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{relTime(letter.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {hallAddress({ id: otherId })} · {letter.body}
                  </span>
                </span>
              </button>
              {open ? (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{letter.body}</p>
                  {other && you ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="ink"
                        onClick={() => {
                          const thread = mail.filter(
                            (m) =>
                              (m.fromId === other.id && m.toId === youId) ||
                              (m.fromId === youId && m.toId === other.id),
                          );
                          const session = logLine({
                            withId: other.id,
                            kind: "mail",
                            startedAt: letter.createdAt,
                            transcript: thread.map((m) => `${m.subject}. ${m.body}`).join(" "),
                          });
                          toast(session ? "Mail summary and actions on their card." : "Could not run desk AI.");
                        }}
                      >
                        Smart summary
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const thread = mail.filter(
                            (m) =>
                              (m.fromId === other.id && m.toId === youId) ||
                              (m.fromId === youId && m.toId === other.id),
                          );
                          const follow = runMailAi({ you, them: other, letters: thread });
                          sendMail(other.id, follow.followSubject, follow.followBody);
                          toast("Follow-up on hall mail.");
                        }}
                      >
                        Follow-up AI
                      </Button>
                      <MailCompose person={other} compact />
                      </div>
                      <LoopStrip
                        person={other}
                        session={lineSessions.find((x) => x.withId === other.id)}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Empty. Open a card and hit Email.{" "}
          <Link to="/people" search={{ q: undefined }} className="text-brick hover:underline">
            People
          </Link>
        </p>
      ) : null}
    </div>
  );
}
