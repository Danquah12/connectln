import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Portrait } from "@/components/portrait";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { personById, useForge } from "@/lib/store";
import type { Contract, ContractStage } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contracts")({ component: ContractsPage });

const STAGES: { id: ContractStage; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "awarded", label: "Awarded" },
  { id: "on-job", label: "On the job" },
  { id: "punch", label: "Punch" },
  { id: "paid", label: "Paid" },
  { id: "closed", label: "Closed" },
  { id: "dispute", label: "Dispute" },
];

function ContractsPage() {
  const contracts = useForge((s) => s.contracts);
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const setContractStage = useForge((s) => s.setContractStage);
  const toggleContractMile = useForge((s) => s.toggleContractMile);
  const staffContract = useForge((s) => s.staffContract);
  const [filter, setFilter] = useState<ContractStage | "all" | "mine">("all");
  const [openId, setOpenId] = useState<string | null>(contracts[0]?.id ?? null);

  const visible = useMemo(() => {
    if (filter === "mine") return contracts.filter((c) => c.workerIds.includes(youId));
    if (filter === "all") return contracts;
    return contracts.filter((c) => c.stage === filter);
  }, [contracts, filter, youId]);

  const current = contracts.find((c) => c.id === openId) ?? visible[0];

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Contracts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Award → crew → milestones → pay. Search finds the call. This jacket runs the job.
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          All {contracts.length}
        </Chip>
        <Chip active={filter === "mine"} onClick={() => setFilter("mine")}>
          Mine
        </Chip>
        {STAGES.map((s) => (
          <Chip key={s.id} active={filter === s.id} onClick={() => setFilter(s.id)}>
            {s.label} {contracts.filter((c) => c.stage === s.id).length || ""}
          </Chip>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <ul className="flex flex-col gap-2">
          {visible.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setOpenId(c.id)}
                className={cn(
                  "w-full rounded-xl bg-cream p-3 text-left shadow-[var(--shadow-border)]",
                  current?.id === c.id && "ring-1 ring-ink",
                )}
              >
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {c.shop} · {c.city}
                </p>
                <Badge variant={c.stage === "dispute" ? "brick" : c.stage === "closed" ? "muted" : "ok"} className="mt-2">
                  {c.stage}
                </Badge>
              </button>
            </li>
          ))}
        </ul>

        {current ? (
          <Jacket
            contract={current}
            people={people}
            youId={youId}
            onStage={(s) => {
              setContractStage(current.id, s);
              toast(`${current.title} → ${s}`);
            }}
            onMile={(m) => toggleContractMile(current.id, m)}
            onStaff={() => {
              staffContract(current.id, youId);
              toast("You're on this jacket.");
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No jackets in this column.</p>
        )}
      </div>
    </div>
  );
}

function Jacket({
  contract,
  people,
  youId,
  onStage,
  onMile,
  onStaff,
}: {
  contract: Contract;
  people: ReturnType<typeof useForge.getState>["people"];
  youId: string;
  onStage: (s: ContractStage) => void;
  onMile: (id: string) => void;
  onStaff: () => void;
}) {
  const onIt = contract.workerIds.includes(youId);
  const done = contract.milestones.filter((m) => m.done).length;
  return (
    <article className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{contract.shop}</p>
      <h2 className="font-display text-3xl tracking-wide">{contract.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {contract.city} · {contract.rate} · {contract.tickets.join(" · ")}
      </p>
      <p className="mt-3 text-sm">{contract.notes}</p>

      <div className="mt-4">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">Crew</p>
        <ul className="mt-2 flex flex-wrap gap-3">
          {contract.workerIds.map((id) => {
            const p = personById(people, id);
            if (!p) return null;
            return (
              <li key={id}>
                <Link to="/p/$id" params={{ id }} className="flex items-center gap-2">
                  <Portrait person={p} size="sm" link={false} />
                  <span className="text-sm">{p.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {!onIt && contract.stage !== "closed" ? (
          <Button className="mt-3" size="sm" variant="outline" onClick={onStaff}>
            Put me on this jacket
          </Button>
        ) : null}
      </div>

      <div className="mt-5">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Milestones · {done}/{contract.milestones.length}
        </p>
        <ul className="mt-2 space-y-2">
          {contract.milestones.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onMile(m.id)}
                className="flex w-full items-center gap-2 rounded-lg bg-canvas px-3 py-2 text-left text-sm"
              >
                <span className={cn("size-2.5 rounded-full", m.done ? "bg-ok" : "bg-ink/20")} />
                {m.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {STAGES.map((s) => (
          <Button
            key={s.id}
            size="sm"
            variant={contract.stage === s.id ? "ink" : "outline"}
            onClick={() => onStage(s.id)}
          >
            {s.label}
          </Button>
        ))}
      </div>
      {contract.callId ? (
        <p className="mt-4 text-xs">
          <Link to="/calls" hash={contract.callId} className="text-brick hover:underline">
            Original call
          </Link>
        </p>
      ) : null}
    </article>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-3.5 text-sm font-medium",
        active ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
