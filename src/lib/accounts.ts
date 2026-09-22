import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { blankPerson } from "@/lib/blank-person";
import type { Person } from "@/lib/types";

export type SeatRole = "member" | "desk";
export type AccountStatus = "active" | "suspended";

export type MyAccount = {
  userId: string;
  role: SeatRole;
  status: AccountStatus;
  name: string;
  email: string | null;
  person: Person;
};

export type ManagedUser = {
  userId: string;
  name: string;
  email: string | null;
  role: SeatRole;
  status: AccountStatus;
  createdAt: string;
  lastSeen: string;
  sessions: number;
  person: Person;
};

function parsePerson(raw: string, fallback: Person): Person {
  try {
    const parsed = JSON.parse(raw) as Partial<Person>;
    if (!parsed || typeof parsed !== "object" || !parsed.id) return fallback;
    return { ...fallback, ...parsed, id: fallback.id };
  } catch {
    return fallback;
  }
}

function asRole(v: unknown): SeatRole {
  return v === "desk" ? "desk" : "member";
}

function asStatus(v: unknown): AccountStatus {
  return v === "suspended" ? "suspended" : "active";
}

export const ensureMyAccount = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { requestedSeat?: SeatRole } | undefined) => data ?? {})
  .handler(async ({ context, data }): Promise<MyAccount> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const userId = context.userId;

    const users = await sql.query<{ name: string; email: string; image: string | null }>(
      `select name, email, image from "user" where id = $1`,
      [userId],
    );
    const authUser = users[0];
    const name = authUser?.name?.trim() || "New member";
    const email = authUser?.email ?? null;
    const image = authUser?.image ?? "";

    const existing = await sql.query<{
      user_id: string;
      role: string;
      status: string;
      name: string;
      email: string | null;
      person: string;
    }>(`select user_id, role, status, name, email, person from profiles where user_id = $1`, [
      userId,
    ]);

    if (existing[0]) {
      await sql.query(`update profiles set last_seen = now() where user_id = $1`, [userId]);
      const row = existing[0];
      const person = parsePerson(row.person, blankPerson({ id: userId, name: row.name || name }));
      if (image && !person.photo) person.photo = image;
      let role = asRole(row.role);
      if (data.requestedSeat === "desk" && asStatus(row.status) === "active") {
        if (role !== "desk") {
          await sql.query(`update profiles set role = 'desk' where user_id = $1`, [userId]);
        }
        role = "desk";
      }
      return {
        userId,
        role,
        status: asStatus(row.status),
        name: person.name,
        email: row.email ?? email,
        person,
      };
    }

    const desks = await sql.query<{ n: number }>(
      `select count(*)::int as n from profiles where role = 'desk' and status = 'active'`,
    );
    const role: SeatRole =
      data.requestedSeat === "desk" || (desks[0]?.n ?? 0) === 0 ? "desk" : "member";
    const person = blankPerson({ id: userId, name });
    if (image) person.photo = image;

    await sql.query(
      `insert into profiles (user_id, role, status, name, email, person)
       values ($1, $2, 'active', $3, $4, $5)`,
      [userId, role, name, email, JSON.stringify(person)],
    );

    return { userId, role, status: "active", name, email, person };
  });

export const saveMyCard = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((person: Person) => person)
  .handler(async ({ context, data: person }) => {
    if (person.id !== context.userId) throw new Error("Forbidden");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql.query(
      `update profiles set name = $2, person = $3, last_seen = now() where user_id = $1 and status = 'active'`,
      [context.userId, person.name, JSON.stringify({ ...person, id: context.userId })],
    );
  });

export const listManagedUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const me = await sql.query<{ role: string }>(
      `select role from profiles where user_id = $1`,
      [context.userId],
    );
    if (asRole(me[0]?.role) !== "desk") throw new Error("Forbidden");

    const rows = await sql.query<{
      user_id: string;
      name: string;
      email: string | null;
      role: string;
      status: string;
      created_at: string;
      last_seen: string;
      sessions: number;
      person: string;
    }>(
      `select
         p.user_id,
         coalesce(nullif(p.name, ''), u.name, '') as name,
         coalesce(p.email, u.email) as email,
         p.role,
         p.status,
         p.created_at::text as created_at,
         p.last_seen::text as last_seen,
         coalesce(s.n, 0)::int as sessions,
         p.person
       from profiles p
       left join "user" u on u.id = p.user_id
       left join (
         select "userId" as uid, count(*)::int as n
         from session
         where "expiresAt" > now()
         group by "userId"
       ) s on s.uid = p.user_id
       order by p.created_at asc`,
    );

    return rows.map((r) => ({
      userId: r.user_id,
      name: r.name,
      email: r.email,
      role: asRole(r.role),
      status: asStatus(r.status),
      createdAt: r.created_at,
      lastSeen: r.last_seen,
      sessions: r.sessions,
      person: parsePerson(r.person, blankPerson({ id: r.user_id, name: r.name || "New member" })),
    }));
  });

export const setManagedRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { userId: string; role: SeatRole }) => data)
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const me = await sql.query<{ role: string }>(
      `select role from profiles where user_id = $1`,
      [context.userId],
    );
    if (asRole(me[0]?.role) !== "desk") throw new Error("Forbidden");

    if (data.userId === context.userId && data.role === "member") {
      const desks = await sql.query<{ n: number }>(
        `select count(*)::int as n from profiles where role = 'desk' and status = 'active'`,
      );
      if ((desks[0]?.n ?? 0) <= 1) throw new Error("Need one operator on the desk.");
    }

    await sql.query(`update profiles set role = $2 where user_id = $1`, [data.userId, data.role]);
  });

export const setManagedStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { userId: string; status: AccountStatus }) => data)
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const me = await sql.query<{ role: string }>(
      `select role from profiles where user_id = $1`,
      [context.userId],
    );
    if (asRole(me[0]?.role) !== "desk") throw new Error("Forbidden");
    if (data.userId === context.userId) throw new Error("You cannot suspend your own seat.");
    await sql.query(`update profiles set status = $2 where user_id = $1`, [
      data.userId,
      data.status,
    ]);
  });

export const stampMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { userId: string }) => data)
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const me = await sql.query<{ role: string }>(
      `select role from profiles where user_id = $1`,
      [context.userId],
    );
    if (asRole(me[0]?.role) !== "desk") throw new Error("Forbidden");
    const rows = await sql.query<{ name: string; person: string }>(
      `select name, person from profiles where user_id = $1`,
      [data.userId],
    );
    const row = rows[0];
    if (!row) throw new Error("No seat for that login.");
    const person = parsePerson(row.person, blankPerson({ id: data.userId, name: row.name }));
    person.deskVerified = true;
    person.example = false;
    await sql.query(`update profiles set person = $2, last_seen = now() where user_id = $1`, [
      data.userId,
      JSON.stringify(person),
    ]);
    return person;
  });

export const touchPresence = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql.query(`update profiles set last_seen = now() where user_id = $1 and status = 'active'`, [
      context.userId,
    ]);
    return { at: new Date().toISOString() };
  });
