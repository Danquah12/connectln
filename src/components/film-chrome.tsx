import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Heart, MessageCircle, Music, Plus, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { Portrait } from "@/components/portrait";
import { personById, useForge } from "@/lib/store";
import { seedReels } from "@/lib/reel-seed";
import { cn } from "@/lib/utils";
import type { Person } from "@/lib/types";

function tally(n?: number) {
  if (n == null) return "";
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`.replace(".0M", "M");
  if (n >= 1_000) return `${Math.round(n / 100) / 10}K`.replace(".0K", "K");
  return String(n);
}

function handleOf(person?: Person | null) {
  const raw = (person?.name || "hall").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `@${raw || "hall"}`;
}

export function FilmChrome({
  person,
  caption,
  likes,
  comments,
  liked,
  onLike,
  onWrite,
  onRepost,
  clipId,
}: {
  person?: Person | null;
  caption?: string;
  likes?: number;
  comments?: number;
  liked?: boolean;
  onLike?: () => void;
  onWrite?: (body: string) => void;
  onRepost?: () => void;
  clipId?: string;
}) {
  const youId = useForge((s) => s.youId);
  const people = useForge((s) => s.people);
  const posts = useForge((s) => s.posts);
  const extraReels = useForge((s) => s.extraReels);
  const likedIds = useForge((s) => s.likedPostIds);
  const toggleLike = useForge((s) => s.toggleLike);
  const addComment = useForge((s) => s.addComment);
  const boostPost = useForge((s) => s.boostPost);
  const savedPeople = useForge((s) => s.savedPersonIds);
  const savedPosts = useForge((s) => s.savedPostIds);
  const toggleSavePerson = useForge((s) => s.toggleSavePerson);
  const toggleSavePost = useForge((s) => s.toggleSavePost);
  const noteWatch = useForge((s) => s.noteWatch);
  const post = clipId ? posts.find((p) => p.youtube === clipId || p.id === clipId) : undefined;
  const reel = clipId ? [...extraReels, ...seedReels].find((r) => r.youtube === clipId || r.id === clipId) : undefined;
  const face = person ?? personById(people, post?.authorId || reel?.personId || "");
  const you = personById(people, youId);
  const line = caption || post?.body || post?.headline || reel?.caption || reel?.title;
  const likeCount = likes ?? post?.likes ?? reel?.likes;
  const commentCount = comments ?? post?.comments.length;
  const heartOn = liked ?? (post ? likedIds.includes(post.id) : false);
  const [box, setBox] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState("");
  const saveId = clipId || face?.id || "";
  const saved = saveId ? savedPosts.includes(saveId) : false;
  const followed = face ? savedPeople.includes(face.id) : false;

  function like() {
    if (onLike) onLike();
    else if (post) toggleLike(post.id);
  }

  function note(text: string) {
    if (onWrite) onWrite(text);
    else if (post) addComment(post.id, text);
  }

  function repost() {
    if (onRepost) onRepost();
    else if (post) boostPost(post.id);
  }

  function filmUrl() {
    if (clipId) return `${window.location.origin}/watch/${clipId}`;
    return window.location.href;
  }

  function share(kind: "linkedin" | "facebook" | "whatsapp") {
    const url = filmUrl();
    const text = caption?.slice(0, 140) || "ConnectLn";
    noteWatch("repost", text, kind);
    repost();
    const encoded = encodeURIComponent(url);
    if (kind === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, "_blank", "noopener,noreferrer");
      return;
    }
    if (kind === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, "_blank", "noopener,noreferrer");
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener,noreferrer");
  }

  function sendNote(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    note(text);
    noteWatch("comment", caption || "film", text);
    setDraft("");
    setBox(false);
    toast(you ? `Noted, ${you.name.split(" ")[0]}.` : "Noted.");
  }

  const icon = "drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]";

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[6] bg-gradient-to-b from-black/55 to-transparent px-3 pt-3 pb-8 text-white">
        <div className="flex items-center">
          <div className="flex flex-1 items-end justify-center gap-5 text-[15px] font-semibold">
            <Link to="/calls" search={{}} className="pointer-events-auto opacity-80">
              Live
            </Link>
            <Link to="/people" search={{ q: undefined }} className="pointer-events-auto opacity-80">
              Following
            </Link>
            <span className="border-b-2 border-white pb-1">ConnectLn</span>
          </div>
          <Link to="/search" search={{}} className="pointer-events-auto grid size-9 place-items-center" aria-label="Search">
            <Search className={cn("size-5", icon)} />
          </Link>
        </div>
      </div>

      <div className="absolute right-2 bottom-28 z-[5] flex flex-col items-center gap-4 text-white">
        {face ? (
          <div className="relative">
            <Link
              to="/p/$id"
              params={{ id: face.id }}
              className="block size-11 overflow-hidden rounded-full ring-2 ring-white"
            >
              <Portrait person={face} size="md" link={false} presence={false} className="size-11" />
            </Link>
            <button
              type="button"
              aria-label={followed ? "Following" : "Follow"}
              onClick={() => toggleSavePerson(face.id)}
              className="absolute -bottom-1.5 left-1/2 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-brick text-white"
            >
              <Plus className="size-3" strokeWidth={3} />
            </button>
          </div>
        ) : null}
        <button type="button" className="grid place-items-center" onClick={like} aria-label="Like">
          <Heart className={cn("size-8", icon, heartOn && "fill-brick text-brick")} />
          {likeCount != null ? <span className="mt-1 text-xs font-semibold">{tally(likeCount)}</span> : null}
        </button>
        <button
          type="button"
          className="grid place-items-center"
          onClick={() => setBox((v) => !v)}
          aria-label="Comment"
        >
          <MessageCircle className={cn("size-8", icon)} />
          {commentCount != null ? <span className="mt-1 text-xs font-semibold">{tally(commentCount)}</span> : null}
        </button>
        <button
          type="button"
          className="grid place-items-center"
          aria-label="Save"
          onClick={() => saveId && toggleSavePost(saveId)}
        >
          <Bookmark className={cn("size-7", icon, saved && "fill-white")} />
        </button>
        <button type="button" className="grid place-items-center" onClick={() => setSheet((v) => !v)} aria-label="Share">
          <Send className={cn("size-7", icon)} />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pt-16 pr-16 pb-4 text-white">
        <p className="text-[15px] font-semibold">{handleOf(face)}</p>
        {line ? <p className="mt-1 line-clamp-2 text-sm leading-snug">{line}</p> : null}
        <p className="mt-2 flex items-center gap-2 text-xs">
          <Music className="size-3.5" />
          <span className="truncate">{face ? `${face.trade} · ${face.name}` : "ConnectLn"}</span>
        </p>
      </div>

      {box ? (
        <form
          className="absolute inset-x-2 bottom-2 z-[6] flex gap-2 rounded-xl bg-cream p-2 text-ink"
          onSubmit={sendNote}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Comment"
            className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
          />
          <button type="submit" className="h-10 rounded-full bg-ink px-3 text-xs font-medium text-cream">
            Send
          </button>
        </form>
      ) : null}
      {sheet ? (
        <div className="absolute inset-x-2 bottom-2 z-[6] flex flex-wrap gap-1.5 rounded-xl bg-cream p-2">
          {(
            [
              ["linkedin", "LinkedIn"],
              ["facebook", "Facebook"],
              ["whatsapp", "WhatsApp"],
            ] as const
          ).map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              className="h-9 rounded-full bg-ink px-3 text-xs font-medium text-cream"
              onClick={() => share(kind)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
