import type { Trade } from "./types";

/** Directions are the path to the card. Guidelines are how the work is actually done. */
export type CallingBrief = {
  directions: string[];
  guidelines: string[];
};

export const BRIEFS: Record<Trade, CallingBrief> = {
  Electrician: {
    directions: [
      "Enter a registered apprenticeship or a state-approved trainee program.",
      "Log the required hours and classroom time. OSHA 10 or 30 is expected on most crews.",
      "Sit the state journeyman exam. The license comes from the electrical board.",
      "Master, contractor, or a specialty such as fire alarm is a later card, not a shortcut.",
    ],
    guidelines: [
      "Lock out, tag out, and prove the circuit dead before the cover comes off.",
      "Work to the adopted NEC and the job spec. A video does not replace either.",
      "Do not hold out as a journeyman on an apprentice card.",
    ],
  },
  Plumber: {
    directions: [
      "Apprentice under a licensed plumber and record the hours.",
      "Complete the school hours the state or NCCER sponsor requires.",
      "Sit the journeyman exam for the city or state where you will pull permits.",
      "Medical gas, backflow, and master are separate cards after the license.",
    ],
    guidelines: [
      "Test what you install. A pretty joint that fails the test is not done.",
      "Do not open medical gas or a backflow device without that specific card.",
      "The license on the wall is the one that matches the job address.",
    ],
  },
  HVAC: {
    directions: [
      "Start in an apprenticeship or a program that logs install and service hours.",
      "Earn EPA Section 608 before you open a refrigerant circuit. Universal covers every type.",
      "Get the state mechanical or contractor license if that state requires one.",
      "NATE or a manufacturer cert sits on top of the license. It does not replace it.",
    ],
    guidelines: [
      "Recover refrigerant. Venting it is not a service method.",
      "Read the pressures and the nameplate before you condemn a part.",
      "Lock out the disconnect. A rooftop unit is still live until you prove it is not.",
    ],
  },
  Welder: {
    directions: [
      "Get shop time on the process you will test: SMAW, GMAW, GTAW, or FCAW.",
      "Take a procedure test. Pipe work often means 6G.",
      "AWS records the test. The contractor still qualifies you on their procedure.",
      "Keep the card current. An expired test is not a current qualification.",
    ],
    guidelines: [
      "Weld the procedure you were given. Do not freelance the rod or the heat.",
      "Clean, fit, and inspect before you strike. Most failures start in the fit-up.",
      "A coupon that looks good and fails bend or x-ray is a failed test.",
    ],
  },
  Carpenter: {
    directions: [
      "Join a carpenters apprenticeship or an NCCER sponsor.",
      "Finish the classroom hours and the on-the-job hours together. One does not replace the other.",
      "Pass the performance checks for the level you claim.",
      "Foreman is hours plus a crew that will work under you, not a weekend class.",
    ],
    guidelines: [
      "Read the print before you cut. Measure twice is not a slogan on a stair.",
      "Fall protection and a guarded saw are part of the work, not extras.",
      "Do not sign framing you did not check for plumb, square, and bearing.",
    ],
  },
  Ironworker: {
    directions: [
      "Apply to the Iron Workers local apprenticeship.",
      "Learn structural, reinforcing, and rigging as the local teaches them.",
      "Log the hours in the air and on the deck. There is no public shortcut exam.",
      "Connect, bolt, and weld qualifications are separate from the apprenticeship book.",
    ],
    guidelines: [
      "Tie off the way the site requires. A shortcut at height is how people die.",
      "Never stand under a load, and never signal a crane you cannot see.",
      "If the connection is not complete, it is not safe to walk.",
    ],
  },
  Millwright: {
    directions: [
      "Enter a millwright apprenticeship or an NCCER machinery path.",
      "Learn layout, rigging, install, and precision alignment.",
      "Log the hours. The registry or the local book is the record.",
      "A specialty such as turbines or conveying is extra time on that equipment.",
    ],
    guidelines: [
      "Align to the tolerance on the print, not to what looks centered.",
      "Lock out every driver before you put a hand in the machine.",
      "A start-up without a rotation check and a soft foot check is not a start-up.",
    ],
  },
  Solar: {
    directions: [
      "Get the electrical apprenticeship if you will tie into a service.",
      "Learn PV layout, rapid shutdown, and the code articles that apply.",
      "Sit NABCEP only as the specialty on top of the electrical license.",
      "The state electrical board still licenses the person who terminates the service.",
    ],
    guidelines: [
      "Treat every array as live in the sun. Cover or isolate before you pull a connector.",
      "Do not skip rapid shutdown, grounding, or the labeling the inspector will look for.",
      "A sales certificate is not an electrical license.",
    ],
  },
  Equipment: {
    directions: [
      "Get seat time on the specific machine, with a qualified operator beside you.",
      "Earn the NCCCO or employer qualification that names that crane or machine.",
      "The card is for the machine written on it. It is not a general license.",
      "Renew on the schedule. An expired card means you do not run it.",
    ],
    guidelines: [
      "Use the hand signals the site agreed on. If you lose the signal person, you stop.",
      "Know the load chart for this configuration, not the one from the last job.",
      "Do not swing over people. Do not side-load a crane.",
    ],
  },
  Elevator: {
    directions: [
      "Enter the NEIEP apprenticeship through an Elevator Constructors local.",
      "Expect one of the longest apprenticeships on the hall. There is no shortcut exam.",
      "Learn construction, modernization, and service as separate skills.",
      "The mechanic card comes from the hours and the local, not from a public video.",
    ],
    guidelines: [
      "Lock out and verify before you enter a hoistway or a pit.",
      "Do not jump a safety to finish a call. A car that moves when it should not is a fatal defect.",
      "Leave the car the way the procedure says, not the way that gets you to the next ticket faster.",
    ],
  },
  Lineman: {
    directions: [
      "Finish a climbing school the utility or contractor accepts.",
      "Enter a line apprenticeship. Ground hand is the start, not the ticket.",
      "Log the hours in the air: distribution, transmission, or both, as the program states.",
      "The journeyman card is the hours plus the local or utility qualification.",
    ],
    guidelines: [
      "Rubber, cover-up, and minimum approach distance are not optional.",
      "Assume a line is hot until it is grounded and proven dead.",
      "Do not climb what you have not inspected. A bad pole is a reason to stop.",
    ],
  },
  Pipefitter: {
    directions: [
      "Start with NCCER core or a UA apprenticeship.",
      "Complete the pipefitting levels the sponsor requires.",
      "Log hours on steam, process, and welded pipe, not only hangers.",
      "The registry number or the local book is the record a turnaround will ask for.",
    ],
    guidelines: [
      "Fit to the iso. A joint that is forced into place will fail.",
      "Know the difference between a service test and a hydro before you sign it.",
      "Do not weld or bolt a system you are not qualified for.",
    ],
  },
  "Sheet metal": {
    directions: [
      "Enter a sheet metal apprenticeship.",
      "Learn layout, fabrication, and install. The shop wants all three.",
      "Log the hours. A weekend class does not replace them.",
      "Foreman means you can lay out the job, not only hang what someone else cut.",
    ],
    guidelines: [
      "Square the fitting before it leaves the bench.",
      "Seal and support to the spec. A leak in a hospital duct is not a punch-list item you hope they miss.",
      "Know when the work is TAB and when it is still yours.",
    ],
  },
  Mason: {
    directions: [
      "Get trowel time on brick, block, and the mortar the job uses.",
      "Enter a masonry apprenticeship. A helper year does not replace it.",
      "Learn leads, bond, and how to read a wall elevation.",
      "Restoration and refractory are extra skills after the journeyman book.",
    ],
    guidelines: [
      "Use the mortar specified. Type S is not a substitute for lime on a historic wall.",
      "Keep bond and joint size consistent. A wavy wall is a failed wall.",
      "Scaffold and fall protection stay up until the wall can stand without you on it.",
    ],
  },
  Roofer: {
    directions: [
      "Start on a crew and learn tear-off, dry-in, and the system you will install.",
      "Enter a roofing apprenticeship where the state or the union runs one.",
      "OSHA fall protection is required before you are useful at height.",
      "Manufacturer certificates for a membrane sit on top of the hours.",
    ],
    guidelines: [
      "Harness on, or you do not go up. No exceptions for a short tie-in.",
      "Do not mix systems. The warranty and the leak both follow the wrong product.",
      "A roof that ponds was not finished.",
    ],
  },
  "Sprinkler fitter": {
    directions: [
      "Enter a UA sprinkler-fitter apprenticeship.",
      "Learn wet, dry, and the hanging and bracing the code requires.",
      "Log the hours. NICET can come after, not instead.",
      "The fitter card is not a plumber card, and the reverse is also true.",
    ],
    guidelines: [
      "Do not leave a head, a brace, or a valve off the drawing.",
      "Hydro and the inspector’s walk are part of the job.",
      "Never close a valve on a live system without the impairment procedure.",
    ],
  },
  Machinist: {
    directions: [
      "Enter a shop apprenticeship or a certificate program with real machine time.",
      "Learn manual and CNC, and how to read a print with tolerances.",
      "Log the hours. The print is the boss, not the memory of the last part.",
      "A specialty such as five-axis or grinding is extra time on that machine.",
    ],
    guidelines: [
      "Hold the tolerance on the print. Close is scrap if the number says it is.",
      "Indicate, deburr, and check before the part leaves the vise.",
      "Do not run a program you have not proved.",
    ],
  },
  "Diesel technician": {
    directions: [
      "Get shop time on heavy trucks or equipment, not only passenger cars.",
      "Sit the ASE diesel tests for the systems you will sign.",
      "The employer still qualifies you on their fleet and their software.",
      "Aftertreatment, electrical, and brakes are separate skills. Claim the ones you have tested.",
    ],
    guidelines: [
      "Diagnose before you replace. A parts changer is not a technician.",
      "Follow the service procedure for high-pressure fuel and for the regen system.",
      "A truck that leaves with a warning lamp still on is not released.",
    ],
  },
  Chef: {
    directions: [
      "Complete a culinary program or an apprenticeship the kitchen respects.",
      "Hold a station through real service. The degree does not replace that.",
      "Learn food safety and the local health rules before you run a line.",
      "Sous and chef come from a crew that can work your board, not from the title.",
    ],
    guidelines: [
      "Temperatures, labels, and allergens are not optional.",
      "Taste and season in the pan, not after the plate has left.",
      "Do not send food you would not serve to the inspector standing in the door.",
    ],
  },
  "Truck driver": {
    directions: [
      "Finish an ELDT school the state accepts.",
      "Pass the knowledge tests, then the CDL skills test, for Class A or the class you need.",
      "Add endorsements only for the freight you will actually haul.",
      "The first miles are with a trainer or a company that will sign your record. A clean MVR is part of the hire.",
    ],
    guidelines: [
      "Hours of service are the law. A dispatcher’s request does not erase them.",
      "Pre-trip is a real inspection. A lamp, a brake, or a tire you skipped is your citation.",
      "If the load is over weight or the securement is wrong, you do not roll.",
    ],
  },
  Barber: {
    directions: [
      "Complete a state-approved barber program and the required hours.",
      "Sit the board’s written and practical exams.",
      "Hang the license in the shop before you take a paying client.",
      "A shop owner’s license, where the state requires one, is a second filing.",
    ],
    guidelines: [
      "Sanitize the tools between clients. The board looks for that first.",
      "Do not cut what the client did not ask for, and do not practice medicine on a scalp.",
      "Hours in a chair without a license are not a legal practice.",
    ],
  },
  Nurse: {
    directions: [
      "Finish an accredited nursing program.",
      "Pass the NCLEX.",
      "Take the license from the state board of nursing. A compact license is still a board license.",
      "BLS, ACLS, and a specialty such as CCRN come after you are licensed, for the unit that requires them.",
    ],
    guidelines: [
      "Practice inside your scope and your facility’s protocol.",
      "Chart what you did and what you saw. An uncharted task did not happen.",
      "Hand off so the next nurse can continue the care without guessing.",
    ],
  },
  Physician: {
    directions: [
      "Finish medical school.",
      "Pass the USMLE or COMLEX steps your degree requires.",
      "Complete residency, then take a license from the state medical board.",
      "Board certification and a DEA registration are separate from the license.",
    ],
    guidelines: [
      "Do not practice outside the license and the privileges the hospital granted.",
      "Consent, the note, and the order have to match.",
      "A training video is not a privilege to do the procedure.",
    ],
  },
  Pharmacist: {
    directions: [
      "Earn a PharmD from an accredited school.",
      "Pass the NAPLEX and the law exam the state requires.",
      "Take the license from the board of pharmacy. The school does not let you practice.",
      "A specialty such as BCPS is after licensure.",
    ],
    guidelines: [
      "Verify the drug, the dose, the patient, and the interaction before it leaves.",
      "Controlled substances follow the log. There is no informal exception.",
      "If the order is unsafe, you do not fill it because someone is in a hurry.",
    ],
  },
  Teacher: {
    directions: [
      "Complete a state-approved teacher preparation program.",
      "Pass that state’s content and pedagogy exams.",
      "Take the certificate from the state education agency.",
      "Endorsements and National Board are later. Veterans should ask the state about any remaining Troops to Teachers path.",
    ],
    guidelines: [
      "Teach the students in the room to the standard the district adopted.",
      "Keep the certificate current. An expired certificate means you are not assigned.",
      "Document the work. A lesson that cannot be explained to a parent or a principal is not finished.",
    ],
  },
  Faculty: {
    directions: [
      "Earn the graduate degree the department hires for.",
      "Build a record of teaching, research, or professional work the institution can read.",
      "The hire is the credential. A state teaching certificate is a different path.",
      "Promotion follows the institution’s file, not a public board.",
    ],
    guidelines: [
      "Credit the sources. Do not present someone else’s work as the lecture.",
      "Office hours, the syllabus, and the grade book are part of the job.",
      "Campus rules on research, students, and data apply even when the talk is public.",
    ],
  },
  Developer: {
    directions: [
      "Learn the stack by building. CS50 or an equivalent course is a clean start, not a license.",
      "Ship a project someone else can run.",
      "Put the work where it can be reviewed: a repo, a demo, a live product.",
      "A certificate you claim, such as a cloud or security exam, has to be a real passing record.",
    ],
    guidelines: [
      "Do not ship a secret, a key, or a customer’s data in the demo.",
      "Say what you built and what you did not. A dependency is not your invention.",
      "The proof is the running work, not the title on the profile.",
    ],
  },
  Realtor: {
    directions: [
      "Get the state real-estate license first.",
      "Join the local association. That enrolls you in the state association and NAR.",
      "Complete the Code of Ethics course.",
      "Realtor is the membership. It is not a second state license.",
    ],
    guidelines: [
      "Disclose what the law and the Code require. A surprise at closing is a failed file.",
      "Do not practice outside the brokerage that holds your license.",
      "Keep the license and the dues current or you are not a Realtor.",
    ],
  },
  Agent: {
    directions: [
      "Finish the pre-license hours your state sets.",
      "Pass the state exam.",
      "Activate the license under a broker. You cannot practice alone on a passing score.",
      "You may work as an agent without the Realtor title. The license is the legal part.",
    ],
    guidelines: [
      "Every contract goes through the broker’s file.",
      "Do not give legal, tax, or appraisal advice you are not licensed to give.",
      "Write what was said about the property. Memory is not a disclosure.",
    ],
  },
  Therapist: {
    directions: [
      "Finish the graduate degree the license requires.",
      "Complete the supervised clinical hours. The hour log is the record.",
      "Sit the exam and take the state license. The letters differ: LPC, LCSW, LMFT, or psychologist.",
      "Check the board in the state where the client sits, including telehealth.",
    ],
    guidelines: [
      "Stay inside the license. A counselor does not practice as a psychologist.",
      "Confidentiality has legal exceptions. Know them before you promise silence.",
      "Do not treat a crisis you are not trained for without the referral and the safety step.",
    ],
  },
  Dentist: {
    directions: [
      "Finish dental school.",
      "Pass the national board exams.",
      "Take the license from the state dental board.",
      "A specialty board and a DEA registration come after the license.",
    ],
    guidelines: [
      "Diagnose before you treat. A procedure the patient did not need is not care.",
      "Consent and the radiograph belong in the chart.",
      "Infection control is the whole room, not the instrument in your hand.",
    ],
  },
  Paramedic: {
    directions: [
      "Become an EMT first.",
      "Finish an accredited paramedic program.",
      "Pass the National Registry, then the state license.",
      "The ambulance ride is not the school. The card has to be current before you attend.",
    ],
    guidelines: [
      "Follow protocol. A skill you saw once is not a skill you may perform.",
      "Document the time, the finding, and the treatment.",
      "If the scene is not safe, you do not enter it to be useful.",
    ],
  },
  "Dental hygienist": {
    directions: [
      "Finish an accredited hygiene program.",
      "Pass the national board.",
      "Take the state license. You do not practice on a dentist’s license.",
      "Local anesthesia or another permit is extra where the state requires it.",
    ],
    guidelines: [
      "Assess and record what you see. A missed finding is part of the chart.",
      "Stay inside the hygiene scope. Diagnosis of treatment plans belongs to the dentist.",
      "Instruments are sterile or they are not used.",
    ],
  },
  Veterinarian: {
    directions: [
      "Finish veterinary school.",
      "Pass the national exam.",
      "Take the license from the state veterinary board.",
      "A DEA registration, if you will handle those drugs, is separate. A technician license is a different card.",
    ],
    guidelines: [
      "The patient cannot consent. The client has to understand the plan and the risk.",
      "Controlled drugs follow the log.",
      "Do not practice human medicine, and do not let a technician practice yours.",
    ],
  },
  Midwife: {
    directions: [
      "Become an RN if you are on the nurse-midwife path.",
      "Finish a graduate midwifery program.",
      "Take the certification, then the state license.",
      "The letters have to match the state where you attend. A doula certificate is not this license.",
    ],
    guidelines: [
      "Know the transfer line before the birth, not during it.",
      "Chart the labor as it happens.",
      "Stay inside the births and the settings your license and your privileges allow.",
    ],
  },
  "Respiratory therapist": {
    directions: [
      "Finish an accredited respiratory therapy program.",
      "Pass the NBRC exams. CRT and RRT are not the same card.",
      "Take the state license.",
      "A specialty such as neonatal or pulmonary function is additional.",
    ],
    guidelines: [
      "Check the order, the patient, and the ventilator settings before you leave the room.",
      "An alarm is a finding. Do not silence it and walk away.",
      "Do not perform a procedure the protocol does not give you.",
    ],
  },
  Firefighter: {
    directions: [
      "Complete a fire academy the state recognizes.",
      "Hold EMT at the level the department requires.",
      "Apply and pass that department’s hire, including the physical.",
      "The academy is the start. The badge is the department’s.",
    ],
    guidelines: [
      "Gear, SCBA, and accountability are on before the story you tell later.",
      "Follow the incident command. Freelance inside a fire kills crews.",
      "A lateral hire still meets that city’s seal, not only the last city’s.",
    ],
  },
  Inspector: {
    directions: [
      "Get the trade years first. Inspection is not an entry job.",
      "Sit the ICC or state exams for the disciplines you will sign.",
      "A general contractor card is not an inspector card.",
      "The local building department is who assigns the work.",
    ],
    guidelines: [
      "Cite the code section. “I don’t like it” is not a failed inspection.",
      "Inspect what you are certified to inspect.",
      "Write the correction so the crew can fix it without guessing.",
    ],
  },
  Appraiser: {
    directions: [
      "Complete the qualifying education for the credential you want.",
      "Log the supervisor hours. The log is the record.",
      "Take the state credential. An agent license is not an appraisal credential.",
      "Certified residential and certified general are different. Do not accept a file above the credential.",
    ],
    guidelines: [
      "Independence is the job. Do not appraise to a number someone needs.",
      "The workfile has to support the value.",
      "A trainee does not sign as the certified appraiser.",
    ],
  },
  Bookkeeper: {
    directions: [
      "Learn the books of a real shop: invoices, bills, payroll, and sales tax.",
      "A certificate is useful. It is not a CPA license.",
      "Reconcile every month. A book that is only entered is not closed.",
      "If you want to sign an audit or a tax opinion, that is the CPA path, separately.",
    ],
    guidelines: [
      "The bank statement wins an argument with the register.",
      "Do not book a draw, a loan, or a cash drop you cannot explain.",
      "Separate the client’s money from yours. Always.",
    ],
  },
  Advisor: {
    directions: [
      "Decide the seat. An investment adviser registers with the SEC or the state. A broker registers through FINRA.",
      "Pass the exams that seat requires. Series exams and a CFP are not the same thing.",
      "File the registration before you hold out. Advice without it is not a style. It is a violation.",
      "Check your own record on IAPD or BrokerCheck the way a client will.",
    ],
    guidelines: [
      "Say whether you are a fiduciary on that account. Do not blur broker and adviser.",
      "Disclose fees and conflicts before the money moves.",
      "Do not promise a return. The record is public for a reason.",
    ],
  },
};
