import { useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Mark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { COMMAND_HOME } from "@/lib/command";
import { writeSeat } from "@/lib/seat";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/admin/login")({
  component: CommandLogin,
});

function CommandLogin() {
  const { user } = useCurrentUserState();
  const role = useForge((s) => s.sessionRole);
  const youId = useForge((s) => s.youId);
  const people = useForge((s) => s.people);
  const you = personById(people, youId);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!authEnabled) return;
    setBusy(true);
    setError(null);
    writeSeat("desk");
    try {
      const { error: err } = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: COMMAND_HOME,
      });
      if (err) throw new Error(err.message || "Could not sign in.");
      window.location.href = COMMAND_HOME;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setBusy(false);
    }
  }

  if (user && (role === "desk" || user.isDevFallback)) {
    return <Navigate to="/admin" search={{ bay: "morning" }} />;
  }

  if (user && role === "member") {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink px-4 text-cream">
        <div className="w-full max-w-md">
          <Mark className="size-9" />
          <h1 className="mt-6 font-display text-4xl tracking-[0.06em]">Command is closed to this seat</h1>
          <p className="mt-3 text-sm leading-relaxed text-cream/65">
            {you?.name || user.displayName || "This account"} is on the hall as a member. Command is a
            separate board. A desk operator has to grant the seat.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex h-11 items-center rounded-full bg-cream px-5 text-sm font-medium text-ink"
          >
            Back to the hall
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ink text-cream" style={{ paddingTop: "var(--hall-safe-t)" }}>
      <header className="flex h-14 items-center justify-between px-5">
        <Link to="/admin/login" className="flex items-center gap-2.5">
          <Mark className="size-7" />
          <span className="font-display text-xl tracking-[0.1em]">Command</span>
        </Link>
        <Link to="/" className="text-xs tracking-wide text-cream/50 hover:text-cream">
          Hall
        </Link>
      </header>
      <main className="grid place-items-center px-4 py-16">
        <div className="w-full max-w-md">
          <p className="text-[11px] tracking-[0.22em] text-cream/40 uppercase">ConnectLn operators</p>
          <h1 className="mt-3 font-display text-5xl tracking-[0.04em]">Sign in to Command</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream/60">
            Separate from the hall. Tickets, synced video, seats, and the ledger live here. Members never
            see this board.
          </p>
          {authEnabled ? (
            <>
              <form className="mt-8 flex flex-col gap-4" onSubmit={onEmail}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cmd-email" className="text-cream/70">
                    Email
                  </Label>
                  <Input
                    id="cmd-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-cream/15 bg-cream/5 text-cream"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cmd-password" className="text-cream/70">
                      Password
                    </Label>
                    <button type="button" className="text-[11px] text-cream/50" onClick={() => setShowPw((v) => !v)}>
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  <Input
                    id="cmd-password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    className="h-12 border-cream/15 bg-cream/5 text-cream"
                    required
                  />
                </div>
                {error ? <p className="text-sm text-brick">{error}</p> : null}
                <Button type="submit" className="h-12 rounded-full bg-cream text-ink hover:bg-cream/90" disabled={busy}>
                  {busy ? "Opening…" : "Enter Command"}
                </Button>
              </form>
              <p className="my-6 text-center text-[11px] tracking-[0.18em] text-cream/35 uppercase">or</p>
              <div className="flex flex-col gap-2">
                {GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="outline"
                    className="h-12 border-cream/20 bg-transparent text-cream hover:bg-cream/10"
                    disabled={busy}
                    onClick={() => {
                      writeSeat("desk");
                      void signIn(p.providerId, { callbackURL: COMMAND_HOME, errorCallbackURL: "/admin/login" });
                    }}
                  >
                    Continue with {p.label}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-8 text-sm text-cream/55">Sign-in is off in this preview. Open Command from the hall as the operator.</p>
          )}
        </div>
      </main>
    </div>
  );
}
