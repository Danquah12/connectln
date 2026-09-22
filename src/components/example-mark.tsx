import { cn } from "@/lib/utils";

export function ExampleMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full bg-ink/10 px-2 text-[10px] font-medium tracking-wide text-ink/70 uppercase",
        className,
      )}
    >
      Example
    </span>
  );
}
