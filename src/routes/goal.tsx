import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mark } from "@/components/mark";
import { Portrait } from "@/components/portrait";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { blankPerson } from "@/lib/blank-person";
import { cardName, firstName } from "@/lib/format";
import { personById, useForge } from "@/lib/store";
import { careerTrack } from "@/lib/tracks";

export const Route = createFileRoute("/goal")({ component: GoalPage });

function GoalPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const bound = Boolean(user && you && you.id === user.id);
  const stored = useForge((s) => s.careerGoal);
  const setCareerGoal = useForge((s) => s.setCareerGoal);
  const confirmGoal = useForge((s) => s.confirmGoal);
  const track = bound && you ? careerTrack(you) : null;
  const suggested = stored || track?.next || "Fill the next ticket on the card";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(suggested);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if (!user || isPending) return;
    if (useForge.getState().youId === user.id) return;
    const name = user.displayName?.trim() || user.primaryEmail || "New member";
    const person = blankPerson({ id: user.id, name });
    if (user.profileImageUrl) person.photo = user.profileImageUrl;
    useForge.getState().bindSession({ userId: user.id, name, person, role: "member" });
  }, [user?.id, isPending]);

  useEffect(() => {
    const t = window.setTimeout(() => setWaited(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  function done() {
    confirmGoal();
    void navigate({ to: "/" });
  }

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="flex h-14 items-center border-b border-ink/10 bg-cream px-4">
        <Link to="/" className="flex items-center gap-2">
          <Mark className="size-7" />
          <span className="font-display text-[1.45rem] tracking-[0.06em]">ConnectLn</span>
        </Link>
      </header>
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-10 text-center">
        {isPending && !waited ? (
          <p className="text-sm text-muted-foreground">Pulling your card…</p>
        ) : !user ? (
          <p className="text-sm text-muted-foreground">
            <Link to="/login" search={{ seat: "member" }} className="text-brick hover:underline">
              Sign in
            </Link>{" "}
            so we know whose goal this is.
          </p>
        ) : you && bound ? (
          <>
            <p className="font-display text-4xl tracking-wide text-brick">
              {firstName(you)}, you're back.
            </p>
            <p className="max-w-md text-lg text-ink">
              Is this still the ticket you're after — or has the work changed?
            </p>

            <article className="w-full rounded-xl bg-cream p-5 text-left shadow-[var(--shadow-border)]">
              <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                On the card
              </p>
              <div className="mt-3 flex gap-3">
                <Portrait person={you} size="lg" link={false} />
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Name</p>
                  <p className="font-display text-2xl tracking-wide">{cardName(you)}</p>
                  <p className="text-sm text-muted-foreground">
                    {you.level} {you.trade}
                    {you.city ? ` · ${you.city}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-ink/10 pt-3">
                <p className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                  Next ticket / goal
                </p>
                {editing ? (
                  <Textarea className="mt-2" value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} />
                ) : (
                  <p className="mt-1 text-lg font-medium text-ink">{suggested}</p>
                )}
                {track ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {track.title} · {track.percent}% of the ladder
                  </p>
                ) : null}
              </div>
            </article>

            {editing ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="ink"
                  onClick={() => {
                    setCareerGoal(draft.trim() || suggested);
                    setEditing(false);
                    done();
                  }}
                >
                  Save this plan
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ink"
                  className="min-w-56"
                  onClick={() => {
                    setCareerGoal(suggested);
                    done();
                  }}
                >
                  Still the plan
                </Button>
                <Button variant="outline" className="min-w-56" onClick={() => setEditing(true)}>
                  Change the plan
                </Button>
                <button type="button" className="mt-1 text-sm text-muted-foreground hover:text-ink" onClick={done}>
                  Skip for now
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">Card is on the board. You can keep going.</p>
            <Button variant="ink" onClick={done}>
              Open shop talk
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
