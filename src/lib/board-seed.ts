import type { Lesson, RepEvent, SkillDemo, Training, Visitor } from "./types";

export const skillDemos: SkillDemo[] = [
  {
    id: "d1",
    personId: "deshawn-brooks",
    title: "TIG aluminum pipe — 6G coupon",
    stills: ["/sites/weld.jpg"],
    reviewerId: "hank-okafor",
    score: 4.8,
  },
  {
    id: "d2",
    personId: "jordan-hale",
    title: "Hospital panel — before / after",
    stills: ["/sites/panel.jpg", "/sites/hall.jpg"],
    reviewerId: "tomasz-kowalski",
    score: 4.7,
  },
  {
    id: "d3",
    personId: "patty-nguyen",
    title: "RTU start-up readings",
    stills: ["/sites/hvac.jpg"],
    reviewerId: "marisol-vega",
    score: 4.9,
  },
];

export const lessons: Lesson[] = [
  {
    id: "l1",
    authorId: "tomasz-kowalski",
    title: "How to troubleshoot a three-phase motor",
    minutes: 15,
    topic: "Electrical",
  },
  {
    id: "l2",
    authorId: "camila-ruiz",
    title: "Night-shift handoff that survives audit",
    minutes: 12,
    topic: "Nursing",
  },
  {
    id: "l3",
    authorId: "marcus-bell",
    title: "From 11B to a classroom that holds",
    minutes: 18,
    topic: "Veterans",
  },
];

export const trainings: Training[] = [
  {
    id: "tr1",
    title: "OSHA 30 — weekend class",
    place: "Denver JATC",
    when: "Oct 3–4",
    tickets: ["OSHA 30"],
  },
  {
    id: "tr2",
    title: "Colorado journeyman exam prep",
    place: "Local 68",
    when: "6 weeks, nights",
    tickets: ["Journeyman Electrician"],
  },
  {
    id: "tr3",
    title: "Welding cert — 6G pipe",
    place: "UA 597 school",
    when: "6 weeks",
    tickets: ["6G Pipe"],
  },
];

export const visitors: Visitor[] = [
  {
    id: "vis1",
    shop: "Apex Electric",
    looking: "Journeyman electricians, Denver, union calls",
    city: "Denver",
    when: "today",
  },
  {
    id: "vis2",
    shop: "St. Joseph facilities",
    looking: "Hospital electricians, current OSHA 30",
    city: "Denver",
    when: "yesterday",
  },
  {
    id: "vis3",
    shop: "Aurora Public Schools",
    looking: "Night work, school tickets",
    city: "Aurora",
    when: "this week",
  },
];

export const events: RepEvent[] = [
  { id: "e1", personId: "jordan-hale", label: "Project completed — St. Joseph TI", when: "2026-06" },
  { id: "e2", personId: "jordan-hale", label: "Vouch from Tomasz Kowalski", when: "2026-06" },
  { id: "e3", personId: "jordan-hale", label: "OSHA 30 on file", when: "2023-11" },
  { id: "e4", personId: "jordan-hale", label: "Mentored a third-year on pipe", when: "2026-07" },
  { id: "e5", personId: "keisha-owens", label: "Hours logged — 2,800", when: "2026-09" },
];
