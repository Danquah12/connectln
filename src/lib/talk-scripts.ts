import type { Trade } from "./types";

/** What each person says on the wheel — short enough to speak in ~8 seconds. */
export const TALK_SCRIPTS: Record<string, string> = {
  "camila-ruiz":
    "I'm Camila. Travel ICU. Compact license, nights, the ugly vents. I chart like someone audits it at four in the morning.",
  "priya-shah":
    "I'm Priya Shah. Hospitalist. VA and locums. I take the census and write my own notes. That's the work.",
  "imani-cole":
    "I'm Imani Cole. Hospital pharmacist. Med-rec at five, the Pyxis, the call from the floor. I post what cleared the pump.",
  "marcus-bell":
    "Marcus Bell. High school civics. Army infantry first. I can get a sixteen-year-old to care about the Fourteenth Amendment.",
  "denise-harper":
    "Denise Harper. The classroom is the job. The kids, the lesson, the hours. Not a feed.",
  "ruth-alvarez":
    "Ruth Alvarez. Faculty. I teach adults who already have a night shift. The ticket on the wall is the point.",
  "jordan-hale":
    "Jordan Hale. Journeyman electrician. Hospital panels, EMT pipe, honest hours. No heroics on live gear.",
  "tomasz-kowalski":
    "Tomasz Kowalski. Master electrician. I sign off the shop. The ticket is on the wall because I earned it.",
  "keisha-owens":
    "Keisha Owens. Third-year apprentice. Hours, pipe, the journeyman exam. That's the ladder.",
  "marisol-vega":
    "Marisol Vega. Master plumber. Medical-gas, my crew, my shop. We show up.",
  "deshawn-brooks":
    "DeShawn Brooks. Welder. A six-G coupon, same morning. That's what a pass looks like.",
  "patty-nguyen":
    "Patty Nguyen. HVAC. Occupied clinic. If you set the box, you stay when it fires.",
  "hank-okafor":
    "Hank Okafor. Ironworker. The steel either fits or it doesn't. Bolt-up. That's the job.",
  "riley-mccabe":
    "Riley McCabe. Carpenter. Layout, framing, a crew that shows. The wall either plumbs or it doesn't.",
  "aisha-rahman":
    "Aisha Rahman. Solar. Rooftop arrays. The lockout is not optional.",
  "luis-ortega":
    "Luis Ortega. Equipment. Grade, the machine, a clean pass. That's the work.",
  "sam-park":
    "Sam Park. Millwright. Align the gearbox. A shutdown that held.",
  "nora-ellison":
    "Nora Ellison. Elevator mechanic. Hoistway. A car that runs true. No drama in the shaft.",
  "elena-vasquez":
    "Elena Vasquez. Broker. Listings, VA buyers, the inspection that actually closes. The license number is on the card.",
  "nia-brooks":
    "Nia Brooks. Buyer's agent. First-time, VA, the showing that isn't a circus. License current.",
  "linh-phan":
    "Linh Phan. LCSW. Adults, trauma, the hour that ends. The license is on the card. Not a wellness quote.",
  "omar-haddad":
    "Omar Haddad. Dentist. The chair, Medicaid Thursday, a license and a DEA. I don't sell whitening as a personality.",
  "grace-okonkwo":
    "Grace Okonkwo. CFP. Fiduciary. Teachers, veterans, small shops. Series 7, 66, the number on the card. No yacht photos.",
  "lena-cho":
    "Lena Cho. I build tools shops open on Monday. License wallets, call boards. The demo runs.",
  "andre-voss":
    "Andre Voss. 25B. I write software for people who still carry a license in a van. Shift boards, OSHA drills. No pitch.",
};

export const TALK_AUDIO: Record<string, string> = {
  "camila-ruiz": "/reels/voice-camila.mp3",
  "priya-shah": "/reels/voice-priya.mp3",
  "imani-cole": "/reels/voice-imani.mp3",
  "marcus-bell": "/reels/voice-marcus.mp3",
  "denise-harper": "/reels/voice-denise.mp3",
  "ruth-alvarez": "/reels/voice-ruth.mp3",
  "jordan-hale": "/reels/voice-jordan.mp3",
  "tomasz-kowalski": "/reels/voice-tomasz.mp3",
  "keisha-owens": "/reels/voice-keisha.mp3",
  "marisol-vega": "/reels/voice-marisol.mp3",
  "deshawn-brooks": "/reels/voice-deshawn.mp3",
  "patty-nguyen": "/reels/voice-patty.mp3",
  "hank-okafor": "/reels/voice-hank.mp3",
  "riley-mccabe": "/reels/voice-riley.mp3",
  "aisha-rahman": "/reels/voice-aisha.mp3",
  "luis-ortega": "/reels/voice-luis.mp3",
  "sam-park": "/reels/voice-sam.mp3",
  "nora-ellison": "/reels/voice-nora.mp3",
  "elena-vasquez": "/reels/voice-elena.mp3",
  "nia-brooks": "/reels/voice-nia.mp3",
  "linh-phan": "/reels/voice-linh.mp3",
  "omar-haddad": "/reels/voice-omar.mp3",
  "grace-okonkwo": "/reels/voice-grace.mp3",
  "lena-cho": "/reels/voice-lena.mp3",
  "andre-voss": "/reels/voice-andre.mp3",
};

/** Recorded hall voices — never speech-synthesis. */
const TRADE_VOICE: Partial<Record<Trade, string>> = {
  Electrician: "/reels/voice-jordan.mp3",
  Plumber: "/reels/voice-marisol.mp3",
  HVAC: "/reels/voice-patty.mp3",
  Welder: "/reels/voice-deshawn.mp3",
  Carpenter: "/reels/voice-riley.mp3",
  Ironworker: "/reels/voice-hank.mp3",
  Millwright: "/reels/voice-sam.mp3",
  Solar: "/reels/voice-aisha.mp3",
  Equipment: "/reels/voice-luis.mp3",
  Elevator: "/reels/voice-nora.mp3",
  Nurse: "/reels/voice-camila.mp3",
  Physician: "/reels/voice-priya.mp3",
  Pharmacist: "/reels/voice-imani.mp3",
  Teacher: "/reels/voice-denise.mp3",
  Faculty: "/reels/voice-ruth.mp3",
  Developer: "/reels/voice-lena.mp3",
  Realtor: "/reels/voice-elena.mp3",
  Agent: "/reels/voice-nia.mp3",
  Therapist: "/reels/voice-linh.mp3",
  Dentist: "/reels/voice-omar.mp3",
  Advisor: "/reels/voice-grace.mp3",
};

export function talkScript(personId: string) {
  return TALK_SCRIPTS[personId] ?? "";
}

export function talkAudio(personId: string) {
  return TALK_AUDIO[personId] ?? "";
}

/** Human mp3 for this person, or the hall voice for their trade. Never empty, never TTS. */
export function hallVoice(personId: string, trade?: Trade) {
  return TALK_AUDIO[personId] || (trade ? TRADE_VOICE[trade] : "") || "/reels/voice-panel.mp3";
}

