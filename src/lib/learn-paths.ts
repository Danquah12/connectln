import type { Trade } from "./types";
import { callingPaths } from "./callings";

export type LearnPath = {
  trade: Trade;
  steps: string;
  house: string;
  href: string;
  youtube?: string;
  clip?: string;
};

/** How a person actually earns the calling. One presentation each, embedded, not copied. */
export const LEARN_PATHS: LearnPath[] = [
  {
    trade: "Electrician",
    steps: "Registered apprenticeship, then the state journeyman exam. OSHA 10 or 30 is required on most crews. The license comes from the state board, not from a class video.",
    house: "State electrical board · JATC or NCCER · OSHA Outreach",
    href: "https://www.apprenticeship.gov/",
    youtube: "yMF7CLtAPkw",
    clip: "Lock out before the panel is open",
  },
  {
    trade: "Plumber",
    steps: "Apprenticeship hours under a licensed plumber, then the state or city journeyman exam. NCCER levels track the school hours. They do not replace the license.",
    house: "State plumbing board · NCCER",
    href: "https://www.nccer.org/programs-crafts/apprenticeship-assistance/",
    youtube: "UdefgRjgiCI",
    clip: "How an NCCER apprenticeship is built",
  },
  {
    trade: "HVAC",
    steps: "Apprenticeship, then EPA Section 608 before you open a refrigerant circuit. Universal covers every appliance type. Type I, II, and III are narrower.",
    house: "EPA Section 608 · an EPA-approved certifier",
    href: "https://www.epa.gov/section608",
    youtube: "zltAGxk-qSU",
    clip: "How a rooftop unit works",
  },
  {
    trade: "Welder",
    steps: "Shop time, then a procedure test (often 6G for pipe). AWS certificates the test. The contractor still has to qualify you on their procedure.",
    house: "AWS · the contractor’s procedure",
    href: "https://www.aws.org/certification",
    youtube: "Zu2glUXqeUo",
    clip: "6G pipe, carbon TIG",
  },
  {
    trade: "Carpenter",
    steps: "Apprenticeship with a union or an NCCER sponsor: classroom hours plus on-the-job hours. The ticket is the hours and the performance test, not a weekend video.",
    house: "Carpenters apprenticeship · NCCER",
    href: "https://www.apprenticeship.gov/",
    youtube: "lRgDCwb8cvI",
    clip: "Training for a career in carpentry",
  },
  {
    trade: "Ironworker",
    steps: "Iron Workers apprenticeship: structural, reinforcing, and rigging. You get in through the local, not through a public board listing.",
    house: "Iron Workers local apprenticeship",
    href: "https://www.apprenticeship.gov/",
    youtube: "JBD48cvEcvc",
    clip: "The ironworker apprenticeship",
  },
  {
    trade: "Millwright",
    steps: "Apprenticeship on machinery install and alignment. NCCER or a millwright local keeps the record of hours.",
    house: "Millwright apprenticeship · NCCER",
    href: "https://www.nccer.org/programs-crafts/apprenticeship-assistance/",
    youtube: "PgeKasBfPPw",
    clip: "Shaft alignment, the millwright’s job",
  },
  {
    trade: "Solar",
    steps: "Electrical apprenticeship first if you are tying into a service. NABCEP is the specialty certificate on top of that, not a substitute for the electrical license.",
    house: "State electrical board · NABCEP",
    href: "https://www.nabcep.org/",
    youtube: "Yxt72aDjFgY",
    clip: "How a solar panel makes power",
  },
  {
    trade: "Equipment",
    steps: "Seat time, then NCCCO or the employer’s qualification for the crane or the machine you will run. The card names the machine. It is not a general license.",
    house: "NCCCO · the employer’s qualification",
    href: "https://www.nccco.org/",
    youtube: "nCFSzlxCuqY",
    clip: "OSHA crane hand signals",
  },
  {
    trade: "Elevator",
    steps: "NEIEP apprenticeship through the local. It is one of the longest apprenticeships on the hall. There is no shortcut exam.",
    house: "NEIEP · Elevator Constructors local",
    href: "https://www.neiep.org/",
    youtube: "rKp4pe92ljg",
    clip: "How an elevator works",
  },
  {
    trade: "Nurse",
    steps: "Accredited nursing program, then the NCLEX, then a license from the state board of nursing. A compact license is still a board license.",
    house: "State board of nursing · NCSBN",
    href: "https://www.ncsbn.org/",
    youtube: "G8PJvIVbk6g",
    clip: "Your license to practice",
  },
  {
    trade: "Physician",
    steps: "Medical school, USMLE, residency, then a license from the state medical board. Board certification is separate from the license.",
    house: "State medical board · USMLE",
    href: "https://www.usmle.org/",
    youtube: "zZ_qJ41TgdM",
    clip: "Paths into medical school",
  },
  {
    trade: "Pharmacist",
    steps: "PharmD from an accredited school, NAPLEX, and a license from the state board of pharmacy. The board, not the school, lets you practice.",
    house: "State board of pharmacy · NABP",
    href: "https://nabp.pharmacy/",
    youtube: "kqlOs2eBNgY",
    clip: "How to apply for the NAPLEX",
  },
  {
    trade: "Therapist",
    steps: "A graduate degree, supervised clinical hours, then the state license (the letters differ by state: LPC, LCSW, LMFT, psychologist). Check the board where you will sit.",
    house: "State behavioral-health board",
    href: "https://www.counseling.org/",
    youtube: "vKZbKGxzo-g",
    clip: "Why the license is the gate",
  },
  {
    trade: "Dentist",
    steps: "Dental school, the national board exam, then a license from the state dental board. Specialty boards come after the license.",
    house: "State dental board · JCNDE",
    href: "https://jcnde.ada.org/",
    youtube: "67eWOLuomBo",
    clip: "Career paths in dentistry",
  },
  {
    trade: "Teacher",
    steps: "A state-approved program, the state content exams, then the teaching certificate from that state’s education agency. Veterans can start through Troops to Teachers where the state still funds it.",
    house: "State education agency",
    href: "https://www.ed.gov/",
    youtube: "FOJjjEBbzcg",
    clip: "From the service to a classroom",
  },
  {
    trade: "Faculty",
    steps: "A graduate degree and a hire by the institution. The college, not a state license, is the credential. Campus presentations live with the school.",
    house: "The hiring institution",
    href: "https://www.umd.edu/",
    youtube: "vPh8w0zOLu4",
    clip: "McKeldin Mall",
  },
  {
    trade: "Developer",
    steps: "No license. The proof is the work: a course such as CS50, a project, and a public record of what you shipped. The hall treats the project as the credential.",
    house: "CS50 · the work itself",
    href: "https://cs50.harvard.edu/x/",
    youtube: "8mAITcNt710",
    clip: "Harvard CS50",
  },
  {
    trade: "Realtor",
    steps: "State real-estate license first. Realtor is the next step: join the local association, which enrolls you in the state association and NAR, and take the Code of Ethics.",
    house: "State real-estate commission · NAR",
    href: "https://www.nar.realtor/membership/how-to-become-a-realtor",
    youtube: "-ZZPlWdHrI4",
    clip: "The license, before the association",
  },
  {
    trade: "Agent",
    steps: "Pre-license hours set by the state, the state exam, then the license activated under a broker. You can practice as an agent without the Realtor title.",
    house: "State real-estate commission",
    href: "https://www.nar.realtor/membership/how-to-become-a-realtor",
    youtube: "-ZZPlWdHrI4",
    clip: "Five steps to the state license",
  },
  {
    trade: "Advisor",
    steps: "Investment advice is a registration, not a nickname. An adviser registers with the SEC or the state. A broker registers through FINRA. Check the record before you hire or before you hold out.",
    house: "SEC IAPD · FINRA BrokerCheck",
    href: "https://www.investor.gov/",
    youtube: "FZNCce1spHQ",
    clip: "Broker or adviser",
  },
  ...callingPaths,
];
