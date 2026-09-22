import { createFileRoute } from "@tanstack/react-router";
import { LegalSheet } from "@/components/legal-sheet";

export const Route = createFileRoute("/terms")({ component: () => <LegalSheet kind="terms" /> });
