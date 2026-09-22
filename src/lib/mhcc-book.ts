import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { MHCC_SAMPLE, parseMhccCsv, personFromMhcc, type MhccRow } from "./mhcc";
import type { Person } from "./types";

type DbRow = {
  id: string;
  license: string;
  first_name: string;
  last_name: string;
  profession: string;
  trade: string;
  status: string;
  city: string | null;
  county: string | null;
  state: string;
  zip: string | null;
  issued: string | null;
  expires: string | null;
  board: string | null;
  source: string;
  sample: boolean;
};

function asRow(r: DbRow): MhccRow {
  return {
    id: r.id,
    license: r.license,
    firstName: r.first_name,
    lastName: r.last_name,
    profession: r.profession,
    trade: r.trade as MhccRow["trade"],
    status: r.status,
    city: r.city ?? "",
    county: r.county ?? "",
    state: r.state,
    zip: r.zip ?? "",
    issued: r.issued ?? undefined,
    expires: r.expires ?? undefined,
    board: r.board ?? "Maryland Labor · MHCC",
    source: r.source,
    sample: Boolean(r.sample),
  };
}

async function requireDesk(userId: string) {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const me = await sql.query<{ role: string }>(`select role from profiles where user_id = $1`, [userId]);
  if (me[0]?.role !== "desk") throw new Error("Forbidden");
  return sql;
}

export const loadMhccBook = createServerFn({ method: "GET" }).handler(async (): Promise<Person[]> => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const count = await sql.query<{ n: number }>(`select count(*)::int as n from mhcc_book`);
  if ((count[0]?.n ?? 0) === 0) {
    for (const r of MHCC_SAMPLE) {
      await sql.query(
        `insert into mhcc_book
          (id, license, first_name, last_name, profession, trade, status, city, county, state, zip, issued, expires, board, source, sample)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         on conflict (id) do nothing`,
        [
          r.id,
          r.license,
          r.firstName,
          r.lastName,
          r.profession,
          r.trade,
          r.status,
          r.city,
          r.county,
          r.state,
          r.zip,
          r.issued ?? null,
          r.expires ?? null,
          r.board,
          r.source,
          r.sample,
        ],
      );
    }
  }
  const rows = await sql.query<DbRow>(
    `select id, license, first_name, last_name, profession, trade, status, city, county, state, zip, issued, expires, board, source, sample
     from mhcc_book order by last_name, first_name limit 4000`,
  );
  return rows.map((r) => personFromMhcc(asRow(r)));
});

export const importMhccCsv = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((csv: string) => csv)
  .handler(async ({ data, context }): Promise<{ added: number; skipped: number }> => {
    const sql = await requireDesk(context.userId);
    const rows = parseMhccCsv(data);
    let added = 0;
    let skipped = 0;
    for (const r of rows) {
      try {
        await sql.query(
          `insert into mhcc_book
            (id, license, first_name, last_name, profession, trade, status, city, county, state, zip, issued, expires, board, source, sample)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,false)
           on conflict (id) do update set
             license = excluded.license,
             first_name = excluded.first_name,
             last_name = excluded.last_name,
             profession = excluded.profession,
             trade = excluded.trade,
             status = excluded.status,
             city = excluded.city,
             county = excluded.county,
             state = excluded.state,
             zip = excluded.zip,
             issued = excluded.issued,
             expires = excluded.expires,
             board = excluded.board,
             source = excluded.source,
             sample = false`,
          [
            r.id,
            r.license,
            r.firstName,
            r.lastName,
            r.profession,
            r.trade,
            r.status,
            r.city,
            r.county,
            r.state,
            r.zip,
            r.issued ?? null,
            r.expires ?? null,
            r.board,
            r.source,
          ],
        );
        added += 1;
      } catch {
        skipped += 1;
      }
    }
    return { added, skipped: skipped + Math.max(0, parseMhccCsv(data).length - rows.length) };
  });
