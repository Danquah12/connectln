import type { Trade } from "./types";
import { callingLibraries } from "./callings";

/** Paid library for a calling. A new trade does not compile until it has a seat here. */
export type PaidLibrary = {
  house: string;
  href: string;
  seat: string;
};

export const LIBRARIES = {
  Electrician: {
    house: "O'Reilly",
    href: "https://www.oreilly.com/search/?q=electrical%20code",
    seat: "Code, power, and the exam books",
  },
  Plumber: {
    house: "Interplay",
    href: "https://www.interplaylearning.com/",
    seat: "Plumbing systems, practiced on the simulator",
  },
  HVAC: {
    house: "SkillCat",
    href: "https://www.skillcat.com/",
    seat: "EPA 608 and the service calls",
  },
  Welder: {
    house: "AWS Learning",
    href: "https://www.aws.org/education",
    seat: "Procedure, position, and the test",
  },
  Carpenter: {
    house: "NCCER",
    href: "https://www.nccer.org/programs-crafts/",
    seat: "Craft levels and the performance test",
  },
  Ironworker: {
    house: "Iron Workers",
    href: "https://www.ironworkers.org/apprenticeship-training",
    seat: "The local apprenticeship and the rigging hours",
  },
  Millwright: {
    house: "NCCER",
    href: "https://www.nccer.org/programs-crafts/",
    seat: "Machinery, alignment, and the hours book",
  },
  Solar: {
    house: "NABCEP",
    href: "https://www.nabcep.org/certifications/",
    seat: "The specialty certificate on top of the electrical license",
  },
  Equipment: {
    house: "NCCCO",
    href: "https://www.nccco.org/",
    seat: "The card for the machine you will run",
  },
  Elevator: {
    house: "NEIEP",
    href: "https://www.neiep.org/",
    seat: "The apprenticeship. There is no shorter library.",
  },
  Nurse: {
    house: "Coursera",
    href: "https://www.coursera.org/search?query=nursing",
    seat: "Nursing courses and the certificates beside the license",
  },
  Physician: {
    house: "Coursera",
    href: "https://www.coursera.org/search?query=medicine",
    seat: "Medical courses beside the school and the boards",
  },
  Pharmacist: {
    house: "Coursera",
    href: "https://www.coursera.org/search?query=pharmacy",
    seat: "Pharmacy courses beside the NAPLEX",
  },
  Therapist: {
    house: "Coursera",
    href: "https://www.coursera.org/search?query=counseling",
    seat: "Counseling and clinical courses beside the state license",
  },
  Dentist: {
    house: "Coursera",
    href: "https://www.coursera.org/search?query=dentistry",
    seat: "Dental courses beside the national board",
  },
  Teacher: {
    house: "Coursera",
    href: "https://www.coursera.org/search?query=teaching",
    seat: "Teaching certificates beside the state exam",
  },
  Faculty: {
    house: "O'Reilly",
    href: "https://www.oreilly.com/search/?q=higher%20education",
    seat: "Research, teaching, and the professional library",
  },
  Developer: {
    house: "O'Reilly",
    href: "https://www.oreilly.com/",
    seat: "Books, courses, and labs. No license required.",
  },
  Realtor: {
    house: "NAR Education",
    href: "https://www.nar.realtor/education",
    seat: "The Code of Ethics and the association courses",
  },
  Agent: {
    house: "NAR Education",
    href: "https://www.nar.realtor/education",
    seat: "Pre-license and brokerage courses",
  },
  Advisor: {
    house: "O'Reilly",
    href: "https://www.oreilly.com/search/?q=finance",
    seat: "Finance library beside the SEC and FINRA record",
  },
  ...callingLibraries,
} as Record<Trade, PaidLibrary>;
