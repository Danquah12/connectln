import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export type WatchRow = {
  id: string;
  at: string;
  whoId: string;
  whoName: string;
  email?: string;
  action: string;
  target: string;
  detail?: string;
};

function mapRow(r: {
  id: string;
  at: string;
  who_id: string;
  who_name: string;
  email: string;
  action: string;
  target: string;
  detail: string | null;
}): WatchRow {
  return {
    id: r.id,
    at: r.at,
    whoId: r.who_id,
    whoName: r.who_name,
    email: r.email || undefined,
    action: r.action,
    target: r.target,
    detail: r.detail || undefined,
  };
}

export const loadWatchNotes = createServerFn({ method: "GET" }).handler(async (): Promise<WatchRow[]> => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql.query<{
    id: string;
    at: string;
    who_id: string;
    who_name: string;
    email: string;
    action: string;
    target: string;
    detail: string | null;
  }>(
    `select id, at::text as at, who_id, who_name, email, action, target, detail
     from hall_watch_notes
     order by at desc
     limit 400`,
  );
  return rows.map(mapRow);
});

export const loadMyWatchNotes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<WatchRow[]> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      at: string;
      who_id: string;
      who_name: string;
      email: string;
      action: string;
      target: string;
      detail: string | null;
    }>(
      `select id, at::text as at, who_id, who_name, email, action, target, detail
       from hall_watch_notes
       where who_id = $1
       order by at desc
       limit 200`,
      [context.userId],
    );
    return rows.map(mapRow);
  });

export const saveWatchNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { action: string; target: string; detail?: string }) => ({
    action: data.action,
    target: data.target.slice(0, 160),
    detail: data.detail?.slice(0, 2000),
  }))
  .handler(async ({ context, data }): Promise<WatchRow> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const users = await sql.query<{ name: string; email: string }>(
      `select name, email from "user" where id = $1`,
      [context.userId],
    );
    const account = users[0];
    if (!account) throw new Error("Sign in with your name.");
    const email = (account.email || "").trim().toLowerCase();
    const whoName = account.name?.trim() || email || "New member";
    const id = `wn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const at = new Date().toISOString();
    await sql.query(
      `insert into hall_watch_notes (id, at, who_id, who_name, email, action, target, detail)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do nothing`,
      [id, at, context.userId, whoName, email, data.action, data.target, data.detail ?? null],
    );
    return {
      id,
      at,
      whoId: context.userId,
      whoName,
      email: email || undefined,
      action: data.action,
      target: data.target,
      detail: data.detail,
    };
  });
