import { createFileRoute } from "@tanstack/react-router";
import { pullClips } from "@/lib/clip-ingest";

export const Route = createFileRoute("/api/clips")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const force = new URL(request.url).searchParams.get("force") === "1";
          const batch = await pullClips({ force });
          return Response.json(batch);
        } catch {
          return Response.json({ people: [], posts: [], reels: [], items: [], failed: [] });
        }
      },
    },
  },
});
