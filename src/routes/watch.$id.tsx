import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { HOUSE, HOUSE_NAME } from "@/components/work-frame";
import { YoutubeStage } from "@/components/youtube-stage";
import { youtubeId, youtubeThumb } from "@/lib/youtube";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/watch/$id")({ component: WatchPage });

function WatchPage() {
  const { id } = Route.useParams();
  const people = useForge((s) => s.people);
  const posts = useForge((s) => s.posts);
  const extraReels = useForge((s) => s.extraReels);
  const frame = useRef<HTMLIFrameElement>(null);

  const clip = useMemo(() => {
    const yt = youtubeId(id);
    if (yt) return { youtube: yt, title: HOUSE_NAME, still: youtubeThumb(yt), video: "" };
    const person = personById(people, id);
    const post = posts.find((p) => p.authorId === id && (p.youtube || p.video));
    const reel = extraReels.find((r) => r.personId === id && (r.youtube || r.video));
    const youtube = youtubeId(post?.youtube || reel?.youtube);
    const video = post?.video || reel?.video || "";
    return {
      youtube,
      video,
      title: post?.headline || reel?.title || person?.trade || HOUSE_NAME,
      still: youtube ? youtubeThumb(youtube) : person?.photo || "",
    };
  }, [id, people, posts, extraReels]);

  return (
    <div className="-mx-4 -mt-4 flex min-h-[70vh] flex-col bg-ink text-cream sm:-mx-6">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="truncate text-[10px] font-medium tracking-[0.16em]">{HOUSE}</p>
        <Link to="/" className="text-xs text-cream/70 hover:text-cream">
          Back to the hall
        </Link>
      </div>
      <div className="relative aspect-video w-full bg-ink sm:aspect-auto sm:min-h-[28rem]">
        {clip.youtube ? (
          <YoutubeStage
            id={clip.youtube}
            title={clip.title}
            autoplay
            mute={false}
            still={clip.still}
            frameRef={frame}
          />
        ) : clip.video ? (
          <video
            src={clip.video}
            poster={clip.still}
            className="absolute inset-0 size-full object-contain bg-ink"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <div className="grid size-full place-items-center px-6 text-center text-sm text-cream/70">
            No clip on this plate yet.
          </div>
        )}
      </div>
      <div className="px-4 py-4">
        <p className="font-display text-3xl tracking-wide">{HOUSE_NAME}</p>
        <p className="mt-1 text-sm text-cream/70">{clip.title}</p>
      </div>
    </div>
  );
}
