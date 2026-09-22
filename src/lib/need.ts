import type { Trade } from "./types";

/** Default tickets a shop asks for when staffing that trade. */
export const TRADE_NEED: Record<Trade, string[]> = {
  Electrician: ["Journeyman Electrician", "OSHA 30", "NFPA 70E"],
  Plumber: ["Master Plumber", "Medical Gas"],
  HVAC: ["EPA 608", "OSHA 30"],
  Welder: ["AWS D1.1", "6G Pipe", "OSHA 10"],
  Carpenter: ["OSHA 30"],
  Ironworker: ["OSHA 30", "Subpart R"],
  Millwright: ["Millwright JW", "OSHA 30"],
  Solar: ["OSHA 10", "Fall protection"],
  Equipment: ["CDL", "OSHA 10"],
  Elevator: ["Elevator Mechanic", "OSHA 30"],
  Nurse: ["RN Compact", "ACLS", "BLS"],
  Physician: ["MD", "DEA", "ACLS"],
  Pharmacist: ["RPh", "BLS"],
  Teacher: ["State certificate"],
  Faculty: ["RN", "CNE"],
  Developer: ["React", "Postgres"],
  Realtor: ["Broker"],
  Agent: ["Real Estate Agent", "NAR"],
  Therapist: ["LCSW"],
  Dentist: ["DDS", "DEA", "BLS"],
  Advisor: ["CFP", "Series 66"],
};
