import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { hallAddress } from "@/lib/mail";
import { hallContact } from "@/lib/contact";
import { personById, useForge } from "@/lib/store";
import type { Person } from "@/lib/types";

export function MailCompose({
  person,
  compact,
  onSent,
}: {
  person: Person;
  compact?: boolean;
  onSent?: () => void;
}) {
  const youId = useForge((s) => s.youId);
  const you = personById(useForge((s) => s.people), youId);
  const sendMail = useForge((s) => s.sendMail);
  const c = hallContact(person);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(`Call — ${person.trade} · ${person.city}`);
  const [body, setBody] = useState(c.ask);

  if (person.id === youId) return null;

  return (
    <div>
      <Button
        variant={compact ? "outline" : "ink"}
        size={compact ? "sm" : "default"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close mail" : "Email"}
      </Button>
      {open ? (
        <form
          className="mt-3 flex flex-col gap-2 rounded-lg bg-canvas p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!you) {
              toast("Sign in so hall mail knows who sent it.");
              return;
            }
            sendMail(person.id, subject, body);
            toast(`Sent on hall mail. ${hallAddress(person)}`);
            setOpen(false);
            onSent?.();
          }}
        >
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
            ConnectLn hall mail
          </p>
          <p className="text-xs text-muted-foreground">
            From {you ? hallAddress(you) : "you"} → {hallAddress(person)}. Stays on this hall. Not Gmail.
          </p>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            aria-label="Subject"
            required
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={compact ? 3 : 5}
            required
          />
          <Button type="submit" variant="ink" size="sm">
            Send hall mail
          </Button>
        </form>
      ) : null}
    </div>
  );
}
