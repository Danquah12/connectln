import { useEffect } from "react";
import { CLIP_PULL_MS, CLIP_PULL_REV } from "@/lib/clip-ingest";
import { scrubHallCopy } from "@/lib/hall-lang";
import { scrubYoutubeCopy } from "@/lib/clip-vet";
import { useForge } from "@/lib/store";

/** Pulls clips into Synced every 5 minutes. Desk vets before Shop talk. */
export function ClipPump() {
  const role = useForge((s) => s.sessionRole);

  useEffect(() => {
    const s = useForge.getState();
    const clean = scrubHallCopy(s.people, s.posts, s.extraReels);
    const youtube = scrubYoutubeCopy(clean.posts, clean.reels);
    if (
      youtube.posts.length !== s.posts.length ||
      clean.people.length !== s.people.length ||
      youtube.reels.length !== s.extraReels.length
    ) {
      useForge.setState({ people: clean.people, posts: youtube.posts, extraReels: youtube.reels });
    } else {
      useForge.setState({ posts: youtube.posts, extraReels: youtube.reels });
    }
  }, []);

  useEffect(() => {
    if (!role) return;
    let alive = true;
    function pull() {
      const s = useForge.getState();
      const last = s.clipIngestedAt ? Date.parse(s.clipIngestedAt) : 0;
      const bump = s.clipPullRev !== CLIP_PULL_REV;
      if (!bump && last && Date.now() - last < CLIP_PULL_MS) return;
      void fetch(bump ? "/api/clips?force=1" : "/api/clips")
        .then((r) => (r.ok ? r.json() : null))
        .then((batch) => {
          if (!alive || !batch) return;
          useForge.getState().ingestClips(batch);
        })
        .catch(() => {
          if (alive)
            useForge.getState().ingestClips({
              people: [],
              posts: [],
              reels: [],
              items: [],
              failed: [{ handle: "pump", reason: "Pull did not finish" }],
            });
        });
    }
    pull();
    const tick = window.setInterval(pull, CLIP_PULL_MS);
    return () => {
      alive = false;
      window.clearInterval(tick);
    };
  }, [role]);

  return null;
}