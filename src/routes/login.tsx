import { useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Mark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { seatHome, writeSeat, type Seat } from "@/lib/seat";

type LoginSearch = { seat: Seat };

export const Route = createFileRoute("/login")({
  validateSearch: (raw: Record<string, unknown>): LoginSearch => ({
    seat: raw.seat === "desk" ? "desk" : "member",
  }),
  component: LoginPage,
});

function LoginPage() {
  const { seat: initialSeat } = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "join">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const home = seatHome("member");

  if (initialSeat === "desk") {
    return <Navigate to="/admin/login" />;
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!authEnabled) return;
    setBusy(true);
    setError(null);
    writeSeat("member");
    try {
      if (mode === "join") {
        if (!agreed) throw new Error("Agree to terms and privacy to join.");
        const { error: err } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.trim(),
          callbackURL: home,
        });
        if (err) throw new Error(err.message || "Could not join.");
      } else {
        const { error: err } = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: home,
        });
        if (err) throw new Error(err.message || "Could not sign in.");
      }
      window.location.href = home;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setBusy(false);
    }
  }

  if (isPending) {
    return (
      <div className="min-h-dvh bg-canvas text-ink">
        <header className="flex h-14 items-center border-b border-ink/10 bg-cream px-4">
          <Link to="/" className="flex items-center gap-2">
            <Mark className="size-7" />
            <span className="font-display text-xl tracking-[0.06em]">ConnectLn</span>
          </Link>
        </header>
        <main className="grid place-items-center px-4 py-12">
          <div className="h-80 w-full max-w-md animate-pulse rounded-2xl bg-cream" />
        </main>
      </div>
    );
  }

  if (user) {
    return <SignedInChooser name={user.displayName ?? user.primaryEmail ?? "You"} />;
  }

  return (
    <div className="min-h-dvh bg-canvas text-ink" style={{ paddingTop: "var(--hall-safe-t)", paddingBottom: "var(--hall-safe-b)" }}>
      <header className="flex min-h-12 items-center justify-between gap-3 border-b border-ink/10 bg-cream px-3 py-2 sm:h-14 sm:px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <Mark className="size-7" />
          <span className="font-display text-xl tracking-[0.06em]">ConnectLn</span>
        </Link>
        <button
          type="button"
          className="max-w-[55%] text-right text-xs text-muted-foreground hover:text-ink sm:text-sm"
          onClick={() => {
            setMode(mode === "in" ? "join" : "in");
            setError(null);
          }}
        >
          {mode === "in" ? (
            <>
              New to ConnectLn?{" "}
              <span className="font-medium text-brick">Join now</span>
            </>
          ) : (
            <>
              Already on the board?{" "}
              <span className="font-medium text-brick">Sign in</span>
            </>
          )}
        </button>
      </header>

      <main className="grid place-items-center px-3 py-8 sm:px-4 sm:py-12">
        <div className="w-full max-w-md rounded-2xl bg-cream p-5 shadow-[var(--shadow-border)] sm:p-8">
          <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
            {mode === "in" ? "Sign in" : "Join"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            On the tools — tickets, vouches, and real work.
          </p>

          {authEnabled ? (
            <>
              <form className="mt-5 flex flex-col gap-3" onSubmit={onEmail}>
                {mode === "join" ? (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                ) : null}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@shop.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      className="text-[11px] font-medium text-brick"
                      onClick={() => setShowPw((v) => !v)}
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete={mode === "join" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                {error ? <p className="text-sm text-brick">{error}</p> : null}
                {mode === "join" ? (
                  <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      required
                    />
                    <span>
                      I agree to the{" "}
                      <Link to="/terms" className="text-brick hover:underline">
                        terms
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-brick hover:underline">
                        privacy
                      </Link>
                      . Photos, tickets, and vouches go on the card. The desk can pull a line.
                    </span>
                  </label>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    By continuing you agree to the{" "}
                    <Link to="/terms" className="text-brick hover:underline">
                      terms
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-brick hover:underline">
                      privacy
                    </Link>
                    .
                  </p>
                )}
                <Button type="submit" variant="ink" disabled={busy || (mode === "join" && !agreed)}>
                  {busy ? "Working…" : mode === "join" ? "Join the board" : "Sign in"}
                </Button>
              </form>

              <p className="my-4 text-center text-[11px] tracking-wide text-muted-foreground uppercase">
                or sign in with
              </p>

              <div className="flex flex-col gap-2">
                {GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      if (mode === "join" && !agreed) {
                        setError("Agree to terms and privacy to join.");
                        return;
                      }
                      writeSeat("member");
                      void signIn(p.providerId, { callbackURL: home, errorCallbackURL: "/login" });
                    }}
                  >
                    Continue with {p.label}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">Sign-in is disabled.</p>
          )}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Desk operator?{" "}
            <Link to="/admin/login" className="text-brick hover:underline">
              Command
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function SignedInChooser({ name }: { name: string }) {
  return (
    <div className="min-h-dvh bg-canvas text-ink" style={{ paddingTop: "var(--hall-safe-t)", paddingBottom: "var(--hall-safe-b)" }}>
      <header className="flex h-12 items-center justify-between border-b border-ink/10 bg-cream px-3 sm:h-14 sm:px-4">
        <Link to="/" className="flex items-center gap-2">
          <Mark className="size-7" />
          <span className="font-display text-xl tracking-[0.06em]">ConnectLn</span>
        </Link>
        <UserButton />
      </header>
      <main className="grid place-items-center px-3 py-8 sm:px-4 sm:py-12">
        <div className="w-full max-w-md rounded-2xl bg-cream p-5 shadow-[var(--shadow-border)] sm:p-8">
          <h1 className="font-display text-3xl tracking-wide sm:text-4xl">You&rsquo;re in</h1>
          <p className="mt-1 text-sm text-muted-foreground">{name}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            This is the hall — your card, shop talk, calls. Operators use Command, a separate board.
          </p>
          <Button variant="ink" className="mt-5 w-full" asChild>
            <Link to="/">Go to shop talk</Link>
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Desk operator?{" "}
            <Link to="/admin/login" className="text-brick hover:underline">
              Sign in to Command
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}