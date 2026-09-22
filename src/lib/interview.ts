import type { Person } from "./types";

export type InterviewQ = { q: string; keys: string[] };

export function interviewQs(person: Person): InterviewQ[] {
  if (person.trade === "Electrician") {
    return [
      { q: "A circuit trips under load. Walk me through it.", keys: ["load", "breaker", "trace", "open", "short", "megger"] },
      { q: "Hospital job. What's different about the pipe?", keys: ["emt", "rigid", "isolation", "redundant", "nec", "517"] },
      { q: "Apprentice bends a 1-1/4 wrong. What do you do?", keys: ["show", "cut", "teach", "not send", "coffee"] },
    ];
  }
  if (person.trade === "Nurse") {
    return [
      { q: "Census is ugly and a resident is new. First move?", keys: ["triage", "charge", "rapid", "handoff", "vitals"] },
      { q: "You're asked to float off your ticket. What do you say?", keys: ["scope", "compact", "unit", "refuse", "unsafe"] },
    ];
  }
  return [
    { q: "Tell me about a job that went wrong and what you did.", keys: ["showed", "called", "fixed", "safety"] },
    { q: "Why this shop, not the one that posted 'passionate'?", keys: ["rate", "hours", "ticket", "start"] },
  ];
}

export function scoreAnswer(answer: string, keys: string[]) {
  const a = answer.toLowerCase();
  const hits = keys.filter((k) => a.includes(k)).length;
  const tech = Math.min(99, 55 + hits * 12 + Math.min(answer.length / 12, 20));
  const talk = Math.min(99, 50 + Math.min(answer.split(" ").length, 40));
  const solve = Math.min(99, 48 + hits * 14);
  return { tech: Math.round(tech), talk: Math.round(talk), solve: Math.round(solve) };
}
