import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ensureMyAccount, touchPresence } from "@/lib/accounts";
import { blankPerson } from "@/lib/blank-person";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useForge } from "@/lib/store";

/** One login → one card. Jordan stays on the board; he is not "you". */
export function SessionBinder() {
  const { user, isPending } = useCurrentUserState();
  const boundId = useRef<string | null>(null);
  const onCommand = useRouterState({
    select: (s) => s.location.pathname.startsWith("/admin"),
  });

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      boundId.current = null;
      const s = useForge.getState();
      if (s.sessionRole !== null) s.clearSession();
      return;
    }

    const name = user.displayName?.trim() || user.primaryEmail || "New member";
    const fallback = blankPerson({ id: user.id, name });
    if (user.profileImageUrl) fallback.photo = user.profileImageUrl;
    const wantDesk = Boolean(onCommand || user.isDevFallback);
    const already = boundId.current === user.id && useForge.getState().youId === user.id;
    if (!already) {
      boundId.current = user.id;
      useForge.getState().bindSession({
        userId: user.id,
        name,
        person: fallback,
        role: wantDesk ? "desk" : "member",
      });
    } else if (wantDesk && useForge.getState().sessionRole !== "desk") {
      useForge.getState().bindSession({
        userId: user.id,
        name: useForge.getState().people.find((p) => p.id === user.id)?.name || name,
        person: useForge.getState().people.find((p) => p.id === user.id) ?? fallback,
        role: "desk",
      });
    }

    void ensureMyAccount({ data: { requestedSeat: wantDesk ? "desk" : "member" } })
      .then((acc) => {
        if (boundId.current !== acc.userId) return;
        useForge.getState().bindSession({
          userId: acc.userId,
          name: acc.name?.trim() || name,
          person: { ...acc.person, name: acc.person.name?.trim() || acc.name?.trim() || name },
          role: wantDesk ? "desk" : acc.role,
        });
        useForge.getState().pulseSeen();
      })
      .catch(() => {
        useForge.getState().pulseSeen();
      });
  }, [user?.id, isPending, onCommand]);

  useEffect(() => {
    if (isPending || !user) return;
    const pulse = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      useForge.getState().pulseSeen();
      void touchPresence().catch(() => undefined);
    };
    pulse();
    const tick = window.setInterval(pulse, 25000);
    const onVis = () => {
      if (document.visibilityState === "visible") pulse();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user?.id, isPending]);

  return null;
}
