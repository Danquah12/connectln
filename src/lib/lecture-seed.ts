import type { Lecture } from "./types";

export const seedLectures: Lecture[] = [
  {
    id: "talk-marcus",
    personId: "marcus-bell",
    title: "From 11B to a room that holds",
    duration: 300,
    video: "/reels/classroom.mp4",
    still: "/reels/classroom.jpg",
    chapters: [
      {
        t: 0,
        title: "The room",
        body: "I teach civics to one hundred and fifty teenagers. Before that I was eleven bravo. This talk is five minutes. I will not inspirationalize the uniform. If you cannot hold a room, the content does not matter. Holding a room is not yelling. Arrive before they do. Know who sat where yesterday. Start on time even when the announcement wrecks the first two minutes. The bell is the report. Start.",
      },
      {
        t: 45,
        title: "The card",
        body: "When I left the army, people wanted to translate eleven bravo into leadership skills. I refused. The kids can handle the truth. I carried a rifle. I now carry a seating chart. Both are tools. Put the MOS on the card. Do not let a recruiter turn it into a soft skill. The people who understand that here are other teachers, other vets, and nobody in talent acquisition.",
      },
      {
        t: 90,
        title: "What transferred",
        body: "Not grit posters. Three things. I can read a room for threat without treating children as threats. I can brief in under a minute — the objective is on the board before they sit. I do not need a student to like me on Monday for them to learn on Tuesday. Respect is the floor. Liking is optional.",
      },
      {
        t: 140,
        title: "What did not",
        body: "Nobody in my platoon needed a five-paragraph essay. These kids do. I had to learn writing from teachers who had been doing it twenty years. Denise Harper sat with me after school and tore up my first rubric. That is mentorship. Not a webinar. A person who will vouch that I can actually run a period.",
      },
      {
        t: 190,
        title: "The unit",
        body: "Two weeks on how a bill becomes a law. Then two weeks on who never gets in the room — veterans, tradespeople, night-shift nurses. I bring in a journeyman electrician and a compact RN. The kids ask better questions of them than of a textbook. That is civics. Not a simulation of Congress with powdered wigs.",
      },
      {
        t: 240,
        title: "Tickets and the ask",
        body: "Certificate current. If it lapses I am not in front of those kids — same rule as OSHA on a hospital job. Professors: use the five minutes. Tell me the unit, what the kids did, who will vouch you can hold a room. Full frame. Head in the shot. I am available to mentor a first-year who has the content and not the room. Vouch is not a button. Show up.",
      },
    ],
  },
  {
    id: "talk-denise",
    personId: "denise-harper",
    title: "A seating chart that actually works",
    duration: 300,
    video: "/reels/classroom.mp4",
    still: "/sites/classroom.jpg",
    chapters: [
      {
        t: 0,
        title: "First week",
        body: "One hundred and forty eight students. License current. National Board current. I do not have a thought-leadership newsletter. I have a seating chart that actually works. This is five minutes on how I run a room so the content can land.",
      },
      {
        t: 40,
        title: "The chart",
        body: "Names. IEPs. Who cannot sit by the window. Who will derail a partner. Who needs the aisle because of a knee. I build it before day one from last year's notes and the counselor. If you wait until week three, you have already lost the talkers to the back wall.",
      },
      {
        t: 90,
        title: "The first four minutes",
        body: "Start of class is a ritual, not a mood. Door open. Task on the board. Pencils out. I do not negotiate the first four minutes. New teachers want to be liked. I want the objective visible. Once the room is working, warmth is cheap. Warmth first is how you spend September on management and May on panic.",
      },
      {
        t: 150,
        title: "Proof of work",
        body: "Proof of work for teachers is not cute bulletin boards. It is a period another adult could walk into and recognize as teaching. I invite my chair twice a month. The vouch I want: she holds the room, the writing is real, the kids who struggle still produce. Not five stars.",
      },
      {
        t: 210,
        title: "Credentials",
        body: "Certificate on the card. Expiration on the card. If it is within sixty days I want the reminder — the same way an electrician wants OSHA. Professors, same rule. Compact license, teaching load, what you actually taught this term. Not your research brand.",
      },
      {
        t: 255,
        title: "The five-minute talk",
        body: "Post the talk. Five minutes. Full frame. Head in the shot. The room behind you. Explain the unit like you would to a colleague on Friday, not to a conference. If you cannot fill five minutes with what the kids did, you do not have a unit yet. I watch one period. I do not perform a demo for a camera. I tell you where the dead time is, who you are afraid of, and which two seats to swap tomorrow. That is an apprenticeship. Teaching has them. We just pretend we do not.",
      },
    ],
  },
];

export function lectureById(id: string) {
  return seedLectures.find((l) => l.id === id);
}

export function formatTalkTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
