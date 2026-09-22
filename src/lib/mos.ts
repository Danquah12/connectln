export type MosMap = {
  code: string;
  title: string;
  skills: string[];
  careers: string[];
};

const MAP: MosMap[] = [
  {
    code: "11B",
    title: "Infantryman",
    skills: [
      "Leadership under pressure",
      "Team management",
      "Emergency response",
      "Field operations",
      "Security operations",
      "Equipment maintenance",
    ],
    careers: [
      "Security supervisor",
      "Operations manager",
      "Emergency management",
      "Logistics coordinator",
      "Classroom leadership (JROTC / civics)",
    ],
  },
  {
    code: "HM",
    title: "Hospital Corpsman",
    skills: [
      "Trauma and emergency care",
      "Charting under audit",
      "Triage",
      "Patient movement",
      "Shipboard / field medicine",
      "Teaching juniors on the floor",
    ],
    careers: [
      "Travel / staff RN",
      "Emergency department",
      "ICU",
      "Clinical instructor",
      "Occupational health",
    ],
  },
  {
    code: "3531",
    title: "Motor Vehicle Operator",
    skills: [
      "Heavy equipment",
      "Convoy / site logistics",
      "Preventive maintenance",
      "CDL-ready discipline",
      "Crew as a fireteam",
    ],
    careers: [
      "Heavy equipment operator",
      "Site superintendent (earthwork)",
      "Fleet supervisor",
      "Highway / DOT work",
    ],
  },
  {
    code: "25B",
    title: "IT specialist",
    skills: [
      "Network and systems",
      "Security discipline",
      "Help desk under fire",
      "Field comms",
      "Documentation that survives audit",
    ],
    careers: [
      "Developer for shops / units",
      "Systems administrator",
      "Cyber / Security+",
      "GovCloud contractor",
    ],
  },
];

export function translateMos(mos: string): MosMap | null {
  const upper = mos.toUpperCase();
  return (
    MAP.find((m) => upper.includes(m.code) || upper.includes(m.title.toUpperCase())) ?? null
  );
}
