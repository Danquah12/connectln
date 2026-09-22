import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { blankPerson } from "@/lib/blank-person";
import type { CrewCall, Person, Post, Vouch } from "@/lib/types";

export type HallPayload = {
  people: Person[];
  posts: Post[];
  calls: CrewCall[];
  vouches: Vouch[];
};

function asPerson(raw: string, id: string, name: string): Person | null {
  try {
    const parsed = JSON.parse(raw) as Partial<Person>;
    if (!parsed || typeof parsed !== "object") return blankPerson({ id, name });
    return { ...blankPerson({ id, name }), ...parsed, id, example: false };
  } catch {
    return blankPerson({ id, name });
  }
}

function asPost(row: {
  id: string;
  author_id: string;
  kind: string;
  body: string;
  photo: string | null;
  parent_id: string | null;
  likes: number;
  boosts: number;
  created_at: string;
}): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    kind: (row.kind as Post["kind"]) || "talk",
    body: row.body,
    photo: row.photo || undefined,
    parentId: row.parent_id || undefined,
    likes: Number(row.likes) || 0,
    boosts: Number(row.boosts) || 0,
    createdAt: row.created_at,
    comments: [],
  };
}

function asCall(raw: string, id: string): CrewCall | null {
  try {
    const parsed = JSON.parse(raw) as CrewCall;
    if (!parsed?.title || !parsed.trade) return null;
    return { ...parsed, id: parsed.id || id };
  } catch {
    return null;
  }
}

function asVouch(row: {
  id: string;
  from_id: string;
  to_id: string;
  site: string;
  body: string;
  kinds: string | null;
  created_at: string;
}): Vouch {
  let kinds: Vouch["kinds"];
  try {
    kinds = row.kinds ? (JSON.parse(row.kinds) as Vouch["kinds"]) : undefined;
  } catch {
    kinds = undefined;
  }
  return {
    id: row.id,
    fromId: row.from_id,
    toId: row.to_id,
    site: row.site,
    body: row.body,
    kinds,
    createdAt: row.created_at,
  };
}

export const loadHall = createServerFn({ method: "GET" }).handler(async (): Promise<HallPayload> => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();

  const profileRows = await sql.query<{ user_id: string; name: string; person: string; last_seen: string }>(
    `select user_id, name, person, last_seen::text as last_seen from profiles where status = 'active'`,
  );
  const postRows = await sql.query<{
    id: string;
    author_id: string;
    kind: string;
    body: string;
    photo: string | null;
    parent_id: string | null;
    likes: number;
    boosts: number;
    created_at: string;
  }>(
    `select id, author_id, kind, body, photo, parent_id, likes, boosts, created_at::text as created_at
     from hall_posts order by created_at desc limit 200`,
  );
  const callRows = await sql.query<{ id: string; payload: string }>(
    `select id, payload from hall_calls order by created_at desc limit 100`,
  );
  const vouchRows = await sql.query<{
    id: string;
    from_id: string;
    to_id: string;
    site: string;
    body: string;
    kinds: string | null;
    created_at: string;
  }>(
    `select id, from_id, to_id, site, body, kinds, created_at::text as created_at
     from hall_vouches order by created_at desc limit 400`,
  );

  const appRows = await sql.query<{ call_id: string; n: number }>(
    `select call_id, count(*)::int as n from hall_call_apps group by call_id`,
  );
  const filledBy = Object.fromEntries(appRows.map((r) => [r.call_id, r.n]));

  const people = profileRows
    .map((r) => {
      const p = asPerson(r.person, r.user_id, r.name);
      if (!p) return null;
      const at = Date.parse(r.last_seen);
      if (!Number.isNaN(at)) p.lastSeen = new Date(at).toISOString();
      return p;
    })
    .filter((p): p is Person => Boolean(p?.name));

  return {
    people,
    posts: postRows.map(asPost),
    calls: callRows
      .map((r) => asCall(r.payload, r.id))
      .filter((c): c is CrewCall => Boolean(c))
      .map((c) => ({ ...c, filled: Math.max(c.filled, filledBy[c.id] ?? 0) })),
    vouches: vouchRows.map(asVouch),
  };
});

export const publishLine = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((post: Post) => post)
  .handler(async ({ context, data: post }) => {
    if (post.authorId !== context.userId) throw new Error("Forbidden");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql.query(
      `insert into hall_posts (id, author_id, kind, body, photo, parent_id, likes, boosts, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       on conflict (id) do update set body = excluded.body, photo = excluded.photo, likes = excluded.likes, boosts = excluded.boosts`,
      [
        post.id,
        context.userId,
        post.kind,
        post.body,
        post.photo ?? null,
        post.parentId ?? null,
        post.likes ?? 0,
        post.boosts ?? 0,
        post.createdAt,
      ],
    );
  });

export const publishCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((call: CrewCall) => call)
  .handler(async ({ context, data: call }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql.query(
      `insert into hall_calls (id, author_id, payload)
       values ($1, $2, $3)
       on conflict (id) do update set payload = excluded.payload`,
      [call.id, context.userId, JSON.stringify(call)],
    );
  });

export const publishVouch = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((vouch: Vouch) => vouch)
  .handler(async ({ context, data: vouch }) => {
    if (vouch.fromId !== context.userId) throw new Error("Forbidden");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql.query(
      `insert into hall_vouches (id, from_id, to_id, site, body, kinds, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (from_id, to_id) do nothing`,
      [
        vouch.id,
        context.userId,
        vouch.toId,
        vouch.site,
        vouch.body,
        vouch.kinds ? JSON.stringify(vouch.kinds) : null,
        vouch.createdAt,
      ],
    );
  });

export const publishApply = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { callId: string }) => data)
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql.query(
      `insert into hall_call_apps (call_id, user_id) values ($1, $2) on conflict do nothing`,
      [data.callId, context.userId],
    );
  });
