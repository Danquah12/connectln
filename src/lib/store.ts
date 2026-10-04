import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  calls as seedCalls,
  people as seedPeople,
  posts as seedPosts,
  threads as seedThreads,
  vouches as seedVouches,
  YOU_ID,
} from "./seed";
import { enrichPeople } from "./enrich";
import { fitScore } from "./fit";
import { sharedJobSites } from "./loop";
import { checkBoard } from "./boards";
import { ticketStatus } from "./format";
import { seedInvites } from "./hall-seed";
import { withVouchKinds } from "./vouch";
import { defaultFlags, seedAudit } from "./command-seed";
import type { Report } from "./command-seed";
import { seedContracts } from "./contract-seed";
import { runLineAi, type CrmAction, type DealNote, type LineKind, type LineSession } from "./crm";
import { dispatchSmtp } from "./mail-dispatch";
import { hallAddress, seedMail } from "./mail";
import { smtpReady, EMPTY_SMTP, normalizeSmtp, type SmtpSettings } from "./smtp";
import { saveMyCard } from "./accounts";
import { isHallTheme, type HallTheme } from "./theme";
import { isHallLang } from "./lang";
import { CLIP_PULL_MS, CLIP_PULL_REV, type ClipPullReport } from "./clip-ingest";
import { isExample } from "./example";
import { scrubHallCopy, hallEnglish } from "./hall-lang";
import { scrubYoutubeCopy } from "./clip-vet";
import { TAKE, type LedgerLine } from "./money";
import { canShiftSwap } from "./sos";
import { toast } from "sonner";
import { publishApply, publishCall, publishLine, publishVouch, type HallPayload } from "./hall";
import { saveWatchNote } from "./watch-notes";
import type {
  Availability,
  CallPrefs,
  CredentialVerify,
  CrewCall,
  HallLetter,
  Person,
  Post,
  Thread,
  Ticket,
  Vouch,
  VouchKind,
} from "./types";

type WatchNote = {
  id: string;
  at: string;
  whoId: string;
  whoName?: string;
  email?: string;
  action: "like" | "unlike" | "comment" | "repost" | "unrepost" | "study" | "meaning" | "send" | "meet";
  target: string;
  detail?: string;
};

type ForgeState = {
  people: Person[];
  posts: Post[];
  calls: CrewCall[];
  threads: Thread[];
  vouches: Vouch[];
  likedPostIds: string[];
  watchNotes: WatchNote[];
  noteWatch: (action: WatchNote["action"], target: string, detail?: string) => void;
  savedCallIds: string[];
  appliedCallIds: string[];
  savedPersonIds: string[];
  savedPostIds: string[];
  starredThreadIds: string[];
  dockHiddenIds: string[];
  callPrefs: CallPrefs;
  toggleSavePerson: (id: string) => void;
  toggleSavePost: (id: string) => void;
  toggleStarThread: (id: string) => void;
  hideDock: (id: string) => void;
  setCallPrefs: (patch: Partial<CallPrefs>) => void;
  introDismissed: boolean;
  heardHall: boolean;
  openedCard: boolean;
  loopDismissed: boolean;
  youId: string;
  sessionEmail: string;
  hydrated: boolean;
  setHydrated: () => void;
  dismissIntro: () => void;
  markHeard: () => void;
  markCard: () => void;
  dismissLoop: () => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, body: string) => void;
  createPost: (body: string, kind?: Post["kind"], photo?: string, video?: string, parentId?: string) => void;
  boostedPostIds: string[];
  boostPost: (postId: string) => void;
  applyToCall: (callId: string) => void;
  hireOnCall: (callId: string, personId: string) => void;
  pingSos: (callId: string, personId: string) => void;
  offerShift: (callId: string) => void;
  takeShift: (swapId: string) => void;
  shiftOffers: { id: string; callId: string; fromId: string; at: string; takenBy?: string }[];
  callHands: Record<string, string[]>;
  callHires: Record<string, string[]>;
  referOnCall: (callId: string, personId: string) => void;
  postCall: (draft: {
    title: string;
    rate: string;
    start: string;
    duration: string;
    description: string;
    spots: number;
    tickets: string[];
    urgent?: boolean;
    apprentice?: boolean;
  }) => void;
  ingestWire: (rows: CrewCall[]) => void;
  toggleSaveCall: (callId: string) => void;
  addVouch: (toId: string, body: string, site: string, kinds?: VouchKind[]) => void;
  updateYou: (patch: Partial<Person>) => void;
  attachTicketDoc: (ticketId: string, document: string) => void;
  addTicket: (ticket: Omit<Ticket, "id">) => void;
  verifyTicket: (personId: string, ticketId: string, verify: CredentialVerify) => void;
  verifyMember: (personId: string) => void;
  pulseSeen: () => void;
  checkTicketFromBoard: (personId: string, ticketId: string) => import("./types").TicketSource | undefined;
  setAvailability: (availability: Availability) => void;
  sendMessage: (threadId: string, body: string) => void;
  startThread: (withId: string, body: string) => string;
  passedChallenges: string[];
  passChallenge: (id: string) => void;
  toggleDisaster: () => void;
  gigModes: import("./types").GigMode[];
  setGigModes: (modes: import("./types").GigMode[]) => void;
  menteeOf?: string;
  requestMentor: (id: string) => void;
  bumpMentorWeek: () => void;
  bids: { project: string; team: string[] }[];
  bidProject: (project: string) => void;
  intros: { throughId: string; toId: string }[];
  requestIntro: (throughId: string, toId: string) => void;
  battleWins: number;
  winBattle: () => void;
  bought: string[];
  buyListing: (id: string) => void;
  proposals: { id: string; target: string; body: string }[];
  propose: (target: string, body: string) => void;
  joinedCollab: string[];
  joinCollab: (id: string) => void;
  milestones: { id: string; label: string; done: boolean }[];
  toggleMilestone: (id: string) => void;
  invites: import("./types").HallInvite[];
  inviteStatus: Record<string, "pending" | "accepted" | "passed">;
  answerInvite: (id: string, status: "accepted" | "passed") => void;
  followedShopIds: string[];
  toggleFollowShop: (id: string) => void;
  rsvpIds: string[];
  toggleRsvp: (id: string) => void;
  satLessonIds: string[];
  satDays: string[];
  sitLesson: (id: string) => void;
  crewInvites: { name: string; trade: string; at: string }[];
  inviteCrew: (name: string, trade: string) => void;
  claimedFundIds: string[];
  claimFund: (id: string) => void;
  extraListings: import("./types").Listing[];
  publishListing: (listing: import("./types").Listing) => void;
  extraReels: import("./types").Reel[];
  likedReelIds: string[];
  postReel: (reel: import("./types").Reel) => void;
  toggleReelLike: (id: string) => void;
  wheelResume?: { itemId: string; seconds: number; youtube?: string };
  setWheelResume: (row?: { itemId: string; seconds: number; youtube?: string }) => void;
  clipIngestedAt?: string;
  clipPullRev?: number;
  clipReports: ClipPullReport[];
  clipStatus: Record<string, import("./clip-ingest").ClipStatus>;
  setClipStatus: (youtube: string, status: import("./clip-ingest").ClipStatus) => void;
  ingestClips: (batch: {
    people?: Person[];
    posts?: Post[];
    reels?: import("./types").Reel[];
    items?: import("./clip-ingest").ClipPullItem[];
    failed?: { handle: string; reason: string }[];
  }) => void;
  hallTheme: HallTheme;
  setHallTheme: (theme: HallTheme) => void;
  hallLang: import("./lang").HallLang;
  setHallLang: (lang: import("./lang").HallLang) => void;
  reportStatus: Record<string, "pending" | "kept" | "pulled">;
  reports: Report[];
  fileReport: (row: Omit<Report, "id">) => void;
  pulledPostIds: string[];
  resolveReport: (id: string, status: "kept" | "pulled") => void;
  boardStatus: Record<string, "active" | "restricted" | "suspended">;
  setBoardStatus: (id: string, status: "active" | "restricted" | "suspended") => void;
  flags: typeof import("./command-seed").defaultFlags;
  setFlag: (key: keyof typeof import("./command-seed").defaultFlags, on: boolean) => void;
  audit: { t: string; who: string; action: string }[];
  logAudit: (action: string) => void;
  pulledListings: string[];
  pullListing: (id: string) => void;
  contracts: import("./types").Contract[];
  setContractStage: (id: string, stage: import("./types").ContractStage) => void;
  toggleContractMile: (id: string, mileId: string) => void;
  staffContract: (id: string, personId: string) => void;
  careerGoal: string;
  goalConfirmedAt?: string;
  setCareerGoal: (goal: string) => void;
  confirmGoal: () => void;
  cardLayout: import("./types").CardLayout;
  setCardLayout: (layout: import("./types").CardLayout) => void;
  sessionRole: "member" | "desk" | null;
  dismissedNotices: string[];
  dismissNotice: (id: string) => void;
  bindSession: (data: { userId: string; name: string; person: Person; role?: "member" | "desk"; email?: string }) => void;
  clearSession: () => void;
  mergeHall: (hall: HallPayload) => void;
  mergeMhcc: (people: Person[]) => void;
  packageAsks: { id: string; pack: string; fromId: string; name: string; at: string }[];
  askPackage: (pack: string) => void;
  shopSeats: string[];
  grantShop: (personId: string) => void;
  buyShopSeat: () => LedgerLine | null;
  ledger: LedgerLine[];
  ticketSeats: string[];
  grantTicket: (personId: string) => void;
  coverTicket: (personId: string) => void;
  mail: HallLetter[];
  sendMail: (toId: string, subject: string, body: string) => void;
  markMailRead: (id: string) => void;
  smtp: SmtpSettings;
  setSmtp: (patch: Partial<SmtpSettings>) => void;
  lineSessions: LineSession[];
  crmActions: CrmAction[];
  dealNotes: DealNote[];
  liveLine: { personId: string; kind: LineKind } | null;
  openLine: (personId: string, kind: LineKind) => void;
  closeLine: () => void;
  logLine: (input: {
    withId: string;
    kind: LineKind;
    startedAt: string;
    transcript: string;
    audio?: string;
  }) => LineSession | null;
  toggleCrmAction: (id: string) => void;
  saveDeal: (note: Omit<DealNote, "id"> & { id?: string }) => void;
};

function nid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function mergeById<T extends { id: string }>(base: T[], extra: T[]): T[] {
  if (!extra.length) return base;
  const map = new Map(base.map((row) => [row.id, row]));
  for (const row of extra) map.set(row.id, row);
  return [...map.values()];
}

const SEED_POST_IDS = new Set(seedPosts.map((p) => p.id));
const SEED_CALL_IDS = new Set(seedCalls.map((c) => c.id));

function callFromLine(you: Person, post: Post): CrewCall {
  return {
    id: `call-${post.id}`,
    title: post.body.slice(0, 72),
    trade: you.trade,
    shop: you.name,
    city: you.city || "Open",
    state: you.state || "",
    rate: you.rate ?? "Shop scale",
    duration: "As posted",
    start: "This week",
    tickets: you.tickets.slice(0, 3).map((t) => t.name),
    union: Boolean(you.union),
    travel: you.travelMiles > 0,
    spots: 2,
    filled: 0,
    description: post.body,
    postedBy: you.id,
  };
}

function persistYou(get: () => ForgeState) {
  const s = get();
  if (!s.sessionRole) return;
  const you = s.people.find((p) => p.id === s.youId);
  if (!you) return;
  void saveMyCard({ data: you }).catch(() => undefined);
}

export const useForge = create<ForgeState>()(
  persist(
    (set, get) => ({
      people: enrichPeople(seedPeople),
      posts: seedPosts,
      calls: seedCalls,
      threads: seedThreads,
      vouches: seedVouches.map(withVouchKinds),
      likedPostIds: ["p2", "p6"],
      watchNotes: [],
      savedCallIds: ["call-aurora"],
      appliedCallIds: [],
      savedPersonIds: ["tomasz-kowalski"],
      savedPostIds: ["p2"],
      starredThreadIds: ["th-tomasz"],
      dockHiddenIds: [],
      callPrefs: { union: false, shift: false, city: false, sos: false },
      callHands: { "call-aurora": ["tomasz-kowalski", "keisha-owens"] },
      callHires: { "call-aurora": ["tomasz-kowalski"] },
      shiftOffers: [],
      introDismissed: false,
      heardHall: false,
      openedCard: false,
      loopDismissed: false,
      youId: YOU_ID,
      sessionEmail: "",
      hydrated: false,
      passedChallenges: [],
      gigModes: ["contract", "gigs"],
      menteeOf: undefined,
      bids: [],
      intros: [],
      battleWins: 0,
      bought: [],
      proposals: [],
      joinedCollab: [],
      milestones: [
        { id: "m-contract", label: "Contract", done: true },
        { id: "m-rough", label: "Rough-in", done: true },
        { id: "m-trim", label: "Trim / punch", done: false },
        { id: "m-pay", label: "Approval / pay", done: false },
      ],
      invites: seedInvites,
      inviteStatus: Object.fromEntries(seedInvites.map((i) => [i.id, "pending" as const])),
      followedShopIds: ["apex"],
      rsvpIds: [],
      satLessonIds: [],
      satDays: [],
      crewInvites: [],
      claimedFundIds: [],
      extraListings: [],
      extraReels: [],
      likedReelIds: [],
      wheelResume: undefined,
      clipIngestedAt: undefined,
      clipPullRev: undefined,
      clipReports: [],
      clipStatus: {},
      hallTheme: "shop",
      hallLang: "en",
      reportStatus: {},
      reports: [],
      pulledPostIds: [],
      boardStatus: {},
      flags: defaultFlags,
      audit: seedAudit,
      pulledListings: [],
      contracts: seedContracts,
      sessionRole: null,
      dismissedNotices: [],
      packageAsks: [],
      shopSeats: ["jordan-hale"],
      ticketSeats: ["jordan-hale"],
      ledger: [],
      mail: seedMail,
      smtp: EMPTY_SMTP,
      lineSessions: [],
      crmActions: [],
      dealNotes: [
        {
          id: "deal-elena",
          personId: "elena-vasquez",
          address: "2841 Larimer, Denver",
          stage: "showing",
          next: "Inspection window",
          notes: "VA buyer. The inspection that actually closes.",
        },
      ],
      liveLine: null,
      boostedPostIds: [],
      careerGoal: "",
      cardLayout: "shop",
      setHydrated: () => {
        if (get().hydrated) return;
        const clean = scrubHallCopy(get().people, get().posts, get().extraReels);
        set({ hydrated: true, people: clean.people, posts: clean.posts, extraReels: clean.reels });
      },
      dismissIntro: () => set({ introDismissed: true }),
      markHeard: () => {
        if (!get().heardHall) set({ heardHall: true });
      },
      markCard: () => {
        if (!get().openedCard) set({ openedCard: true });
      },
      dismissLoop: () => set({ loopDismissed: true }),
      noteWatch: (action, target, detail) => {
        void saveWatchNote({
          data: { action, target: target.slice(0, 160), detail: detail?.slice(0, 2000) },
        })
          .then((row) => {
            const note = { ...row, action } as WatchNote;
            set({ watchNotes: [note, ...(get().watchNotes ?? []).filter((n) => n.id !== note.id)].slice(0, 400) });
          })
          .catch(() => {
            toast("Sign in with your name. This is not kept in the browser.");
          });
      },
      dismissNotice: (id) => {
        if (get().dismissedNotices.includes(id)) return;
        set({ dismissedNotices: [...get().dismissedNotices, id] });
      },
      toggleLike: (postId) => {
        const liked = get().likedPostIds.includes(postId);
        get().noteWatch(liked ? "unlike" : "like", postId);
        set({
          likedPostIds: liked
            ? get().likedPostIds.filter((id) => id !== postId)
            : [...get().likedPostIds, postId],
          posts: get().posts.map((p) =>
            p.id === postId ? { ...p, likes: p.likes + (liked ? -1 : 1) } : p,
          ),
        });
      },
      addComment: (postId, body) => {
        const trimmed = body.trim();
        if (!trimmed) return;
        get().noteWatch("comment", postId, trimmed);
        set({
          posts: get().posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: [
                    ...p.comments,
                    {
                      id: nid("c"),
                      authorId: get().youId,
                      body: trimmed,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : p,
          ),
        });
      },
      createPost: (body, kind = "talk", photo, video, parentId) => {
        const trimmed = body.trim();
        if (!trimmed && !video) return;
        const post: Post = {
          id: nid("p"),
          authorId: get().youId,
          kind,
          body: trimmed || "Live from the hall.",
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: [],
          photo,
          video,
          parentId,
          boosts: 0,
        };
        const you = get().people.find((p) => p.id === get().youId);
        const call = kind === "call" && you ? callFromLine(you, post) : null;
        set({
          posts: [post, ...get().posts],
          calls: call ? [call, ...get().calls] : get().calls,
        });
        void publishLine({ data: { ...post, video: undefined } }).catch(() => undefined);
        if (call) void publishCall({ data: call }).catch(() => undefined);
      },
      boostPost: (postId) => {
        const on = get().boostedPostIds.includes(postId);
        get().noteWatch(on ? "unrepost" : "repost", postId);
        set({
          boostedPostIds: on
            ? get().boostedPostIds.filter((id) => id !== postId)
            : [...get().boostedPostIds, postId],
          posts: get().posts.map((p) =>
            p.id === postId ? { ...p, boosts: Math.max(0, (p.boosts ?? 0) + (on ? -1 : 1)) } : p,
          ),
        });
      },
      applyToCall: (callId) => {
        if (get().appliedCallIds.includes(callId)) return;
        const youId = get().youId;
        const call = get().calls.find((c) => c.id === callId);
        if (!call || call.postedBy === youId) return;
        const you = get().people.find((p) => p.id === youId);
        if (you) {
          const fit = fitScore(you, call, get().vouches);
          if (fit.blocked) return;
        }
        const hands = [...(get().callHands[callId] ?? [])];
        if (!hands.includes(youId)) hands.push(youId);
        set({
          appliedCallIds: [...get().appliedCallIds, callId],
          callHands: { ...get().callHands, [callId]: hands },
        });
        void publishApply({ data: { callId } }).catch(() => undefined);
        if (call.postedBy && call.postedBy !== youId) {
          get().startThread(
            call.postedBy,
            `Raised a hand on ${call.title}. Tickets on the card. ${hands.length} in the pile.`,
          );
        }
      },
      hireOnCall: (callId, personId) => {
        if (!get().shopSeats.includes(get().youId)) return;
        const call = get().calls.find((c) => c.id === callId);
        if (!call || call.postedBy !== get().youId) return;
        const hired = get().callHires[callId] ?? [];
        if (hired.includes(personId) || hired.length >= call.spots) return;
        const person = get().people.find((p) => p.id === personId);
        if (!person) return;
        const fit = fitScore(person, call, get().vouches);
        if (fit.hireBlocked) return;
        const next = [...hired, personId];
        const hands = get().callHands[callId] ?? [];
        const nextHands = hands.includes(personId) ? hands : [...hands, personId];
        const job = {
          id: `hire-${callId}`,
          name: call.title,
          role: `${person.level} · ${call.shop}`,
          when: call.start,
          city: call.city,
          duration: call.duration,
          crew: call.spots,
          skills: call.tickets,
          photos: call.photo ? [call.photo] : [],
          verified: true,
          teamIds: [get().youId, personId],
        };
        set({
          callHires: { ...get().callHires, [callId]: next },
          callHands: { ...get().callHands, [callId]: nextHands },
          calls: get().calls.map((c) => (c.id === callId ? { ...c, filled: next.length } : c)),
          people: get().people.map((p) => {
            if (p.id === personId) {
              const history = p.history.some((h) => h.id === job.id) ? p.history : [job, ...p.history];
              return { ...p, availability: "on-job" as const, history };
            }
            if (p.id === get().youId) {
              const history = p.history.some((h) => h.id === job.id)
                ? p.history
                : [
                    {
                      ...job,
                      role: `Shop · hired ${person.name}`,
                    },
                    ...p.history,
                  ];
              return { ...p, history };
            }
            return p;
          }),
        });
        persistYou(get);
        get().startThread(
          personId,
          `You're on ${call.title}. ${call.city}. ${call.start}. ${call.rate}. Show up with the tickets. It's on your passport.`,
        );
        const shopPerson = get().people.find((p) => p.id === get().youId);
        set({
          ledger: [
            {
              id: nid("take"),
              kind: "fill",
              at: new Date().toISOString(),
              shopId: get().youId,
              shop: shopPerson?.name ?? call.shop,
              label: `Fill · ${call.title} · ${person.name}`,
              gross: TAKE.fill,
              callId,
              personId,
            },
            ...get().ledger,
          ],
        });
        get().logAudit(`Hire · ${call.title} · ${person.name}`);
        get().logAudit(`Take · fill · $${TAKE.fill}`);
      },
      pingSos: (callId, personId) => {
        if (!get().shopSeats.includes(get().youId)) return;
        const call = get().calls.find((c) => c.id === callId);
        const who = get().people.find((p) => p.id === personId);
        if (!call?.urgent || !who || call.postedBy !== get().youId) return;
        const hands = get().callHands[callId] ?? [];
        if (!hands.includes(personId)) {
          set({ callHands: { ...get().callHands, [callId]: [...hands, personId] } });
        }
        get().startThread(
          personId,
          `SOS · ${call.title}. ${call.city}. ${call.start}. ${call.rate}. Tickets look like they hold. Can you go?`,
        );
        get().logAudit(`SOS ping · ${call.title} · ${who.name}`);
      },
      referOnCall: (callId, personId) => {
        const you = get().people.find((p) => p.id === get().youId);
        const call = get().calls.find((c) => c.id === callId);
        const who = get().people.find((p) => p.id === personId);
        if (!you || !call || !who || who.id === you.id) return;
        get().startThread(
          who.id,
          `Referred you to ${call.title} · ${call.shop} · ${call.city}. ${call.start}. ${call.rate}. Tickets look like they hold.`,
        );
        if (call.postedBy && call.postedBy !== you.id) {
          get().startThread(
            call.postedBy,
            `I referred ${who.name} to ${call.title}. Same trade. Tickets look like they hold.`,
          );
        }
        get().logAudit(`Refer · ${call.title} · ${who.name}`);
      },
      offerShift: (callId) => {
        const youId = get().youId;
        const call = get().calls.find((c) => c.id === callId);
        if (!call?.shift) return;
        const hired = get().callHires[callId] ?? [];
        if (!hired.includes(youId)) return;
        if (get().shiftOffers.some((s) => s.callId === callId && s.fromId === youId && !s.takenBy)) return;
        set({
          shiftOffers: [
            { id: nid("swap"), callId, fromId: youId, at: new Date().toISOString() },
            ...get().shiftOffers,
          ],
        });
        get().logAudit(`Shift offer · ${call.title}`);
      },
      takeShift: (swapId) => {
        const you = get().people.find((p) => p.id === get().youId);
        const offer = get().shiftOffers.find((s) => s.id === swapId && !s.takenBy);
        if (!you || !offer || offer.fromId === you.id) return;
        const call = get().calls.find((c) => c.id === offer.callId);
        const from = get().people.find((p) => p.id === offer.fromId);
        if (!call?.shift || !from) return;
        const check = canShiftSwap(from, you, call, call, get().vouches);
        if (!check.ok) return;
        const hired = (get().callHires[call.id] ?? []).filter((id) => id !== from.id);
        if (hired.includes(you.id) || hired.length >= call.spots) return;
        hired.push(you.id);
        set({
          callHires: { ...get().callHires, [call.id]: hired },
          shiftOffers: get().shiftOffers.map((s) => (s.id === swapId ? { ...s, takenBy: you.id } : s)),
          people: get().people.map((p) => {
            if (p.id === you.id) return { ...p, availability: "on-job" as const };
            if (p.id === from.id) return { ...p, availability: "open" as const };
            return p;
          }),
        });
        get().startThread(from.id, `I took your shift on ${call.title}. ${call.start}. ${call.city}.`);
        get().logAudit(`Shift swap · ${call.title} · ${from.name} → ${you.name}`);
      },
      postCall: (draft) => {
        const you = get().people.find((p) => p.id === get().youId);
        if (!you) return;
        if (!get().shopSeats.includes(you.id)) return;
        const title = draft.title.trim();
        if (!title) return;
        const call: CrewCall = {
          id: nid("call"),
          title,
          trade: you.trade,
          shop: you.name,
          city: you.city || "Open",
          state: you.state || "",
          rate: draft.rate.trim() || "Shop scale",
          duration: draft.duration.trim() || "As posted",
          start: draft.start.trim() || "This week",
          tickets: draft.tickets,
          union: Boolean(you.union),
          travel: you.travelMiles > 0,
          spots: Math.max(1, draft.spots),
          filled: 0,
          description: draft.description.trim() || title,
          urgent: draft.urgent,
          apprentice: draft.apprentice,
          postedBy: you.id,
        };
        set({ calls: [call, ...get().calls] });
        void publishCall({ data: call }).catch(() => undefined);
        get().createPost(`Call up: ${title}. ${call.city}. ${call.rate}.`, "talk");
        const listing = draft.urgent ? TAKE.urgent : TAKE.listing;
        set({
          ledger: [
            {
              id: nid("take"),
              kind: "listing",
              at: new Date().toISOString(),
              shopId: you.id,
              shop: you.name,
              label: `${draft.urgent ? "Urgent call" : "Call seat"} · ${title}`,
              gross: listing,
              callId: call.id,
            },
            ...get().ledger,
          ],
        });
        get().logAudit(`Take · listing · $${listing}`);
      },
      ingestWire: (rows) => {
        const kept = get().calls.filter((c) => !c.wire);
        const seen = new Set(kept.map((c) => `${c.shop}|${c.title}`.toLowerCase()));
        const fresh = rows.filter((row) => {
          if (!row.wire || !row.listingUrl) return false;
          const key = `${row.shop}|${row.title}`.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        if (!fresh.length && get().calls.some((c) => c.wire)) return;
        set({ calls: [...fresh, ...kept] });
      },
      toggleSaveCall: (callId) => {
        const saved = get().savedCallIds.includes(callId);
        set({
          savedCallIds: saved
            ? get().savedCallIds.filter((id) => id !== callId)
            : [...get().savedCallIds, callId],
        });
      },
      toggleSavePerson: (id) => {
        const on = get().savedPersonIds.includes(id);
        set({ savedPersonIds: on ? get().savedPersonIds.filter((x) => x !== id) : [id, ...get().savedPersonIds] });
      },
      toggleSavePost: (id) => {
        const on = get().savedPostIds.includes(id);
        set({ savedPostIds: on ? get().savedPostIds.filter((x) => x !== id) : [id, ...get().savedPostIds] });
      },
      toggleStarThread: (id) => {
        const on = get().starredThreadIds.includes(id);
        set({ starredThreadIds: on ? get().starredThreadIds.filter((x) => x !== id) : [id, ...get().starredThreadIds] });
      },
      hideDock: (id) => {
        if (get().dockHiddenIds.includes(id)) return;
        set({ dockHiddenIds: [id, ...get().dockHiddenIds] });
      },
      setCallPrefs: (patch) => {
        set({ callPrefs: { ...get().callPrefs, ...patch } });
      },
      addVouch: (toId, body, site, kinds) => {
        const trimmed = body.trim();
        const job = site.trim();
        if (!trimmed || !job) return;
        const fromId = get().youId;
        if (fromId === toId) return;
        const you = get().people.find((p) => p.id === fromId);
        const them = get().people.find((p) => p.id === toId);
        if (!you || !them) return;
        const jobs = sharedJobSites(you, them, { calls: get().calls, callHires: get().callHires });
        if (!jobs.includes(job)) return;
        if (get().vouches.some((v) => v.fromId === fromId && v.toId === toId && v.site === job)) return;
        const vouch: Vouch = {
          id: nid("v"),
          fromId,
          toId,
          body: trimmed,
          site: job,
          createdAt: new Date().toISOString(),
          kinds: kinds?.length ? kinds : undefined,
        };
        set({ vouches: [withVouchKinds(vouch), ...get().vouches] });
        void publishVouch({ data: vouch }).catch(() => undefined);
        get().startThread(
          toId,
          `Vouched you on ${job}${kinds?.length ? ` for ${kinds.join(", ")}` : ""}. ${trimmed}`,
        );
      },
      updateYou: (patch) => {
        const id = get().youId;
        set({
          people: get().people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        });
        persistYou(get);
      },
      attachTicketDoc: (ticketId, document) => {
        const id = get().youId;
        set({
          people: get().people.map((p) =>
            p.id !== id
              ? p
              : {
                  ...p,
                  tickets: p.tickets.map((t) =>
                    t.id === ticketId ? { ...t, document, verify: "pending" as const } : t,
                  ),
                },
          ),
        });
        persistYou(get);
      },
      addTicket: (ticket) => {
        const id = get().youId;
        const row: Ticket = {
          ...ticket,
          id: `t-${Date.now().toString(36)}`,
          verify: ticket.verify ?? "unverified",
        };
        set({
          people: get().people.map((p) =>
            p.id !== id ? p : { ...p, tickets: [row, ...p.tickets] },
          ),
        });
        persistYou(get);
      },
      verifyTicket: (personId, ticketId, verify) => {
        set({
          people: get().people.map((p) =>
            p.id !== personId
              ? p
              : {
                  ...p,
                  tickets: p.tickets.map((t) => (t.id === ticketId ? { ...t, verify } : t)),
                },
          ),
        });
      },
      verifyMember: (personId) => {
        set({
          people: get().people.map((p) => (p.id === personId ? { ...p, deskVerified: true, example: false } : p)),
        });
        get().logAudit(`Verified seat · ${personId}`);
      },
      pulseSeen: () => {
        const id = get().youId;
        const at = new Date().toISOString();
        set({
          people: get().people.map((p) => (p.id === id ? { ...p, lastSeen: at } : p)),
        });
      },
      checkTicketFromBoard: (personId, ticketId) => {
        let source: import("./types").TicketSource | undefined;
        set({
          people: get().people.map((p) => {
            if (p.id !== personId) return p;
            return {
              ...p,
              tickets: p.tickets.map((t) => {
                if (t.id !== ticketId) return t;
                const hit = checkBoard(t, p.name);
                source = hit.source;
                return { ...t, source: hit.source, verify: hit.verify };
              }),
            };
          }),
        });
        persistYou(get);
        return source;
      },
      setAvailability: (availability) => {
        get().updateYou({ availability });
      },
      sendMessage: (threadId, body) => {
        const trimmed = body.trim();
        if (!trimmed) return;
        set({
          threads: get().threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: [
                    ...t.messages,
                    {
                      id: nid("m"),
                      fromId: get().youId,
                      body: trimmed,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : t,
          ),
        });
      },
      startThread: (withId, body) => {
        const existing = get().threads.find((t) => t.withId === withId);
        if (existing) {
          if (body.trim()) get().sendMessage(existing.id, body);
          return existing.id;
        }
        const thread: Thread = {
          id: nid("th"),
          withId,
          messages: body.trim()
            ? [
                {
                  id: nid("m"),
                  fromId: get().youId,
                  body: body.trim(),
                  createdAt: new Date().toISOString(),
                },
              ]
            : [],
        };
        set({ threads: [thread, ...get().threads] });
        return thread.id;
      },
      passChallenge: (id) => {
        if (get().passedChallenges.includes(id)) return;
        set({ passedChallenges: [...get().passedChallenges, id] });
      },
      toggleDisaster: () => {
        const you = get().people.find((p) => p.id === get().youId);
        if (!you) return;
        get().updateYou({ disaster: !you.disaster });
      },
      setGigModes: (modes) => {
        set({ gigModes: modes });
        get().updateYou({ gigModes: modes });
      },
      requestMentor: (id) => {
        set({ menteeOf: id });
        get().updateYou({ menteeOf: id, seekingMentor: true, mentorWeeks: 1 });
      },
      bumpMentorWeek: () => {
        const you = get().people.find((p) => p.id === get().youId);
        const w = (you?.mentorWeeks ?? 0) + 1;
        get().updateYou({ mentorWeeks: w });
      },
      bidProject: (project) => {
        if (get().bids.some((b) => b.project === project)) return;
        set({ bids: [...get().bids, { project, team: [get().youId] }] });
      },
      requestIntro: (throughId, toId) => {
        if (get().intros.some((i) => i.toId === toId)) return;
        set({ intros: [...get().intros, { throughId, toId }] });
      },
      winBattle: () => set({ battleWins: get().battleWins + 1 }),
      buyListing: (id) => {
        if (get().bought.includes(id)) return;
        set({ bought: [...get().bought, id] });
      },
      propose: (target, body) => {
        const trimmed = body.trim();
        if (!trimmed) return;
        set({
          proposals: [{ id: nid("pr"), target, body: trimmed }, ...get().proposals],
        });
      },
      joinCollab: (id) => {
        if (get().joinedCollab.includes(id)) return;
        set({ joinedCollab: [...get().joinedCollab, id] });
      },
      toggleMilestone: (id) => {
        set({
          milestones: get().milestones.map((m) => (m.id === id ? { ...m, done: !m.done } : m)),
        });
      },
      answerInvite: (id, status) => {
        set({ inviteStatus: { ...get().inviteStatus, [id]: status } });
      },
      toggleFollowShop: (id) => {
        const has = get().followedShopIds.includes(id);
        set({
          followedShopIds: has
            ? get().followedShopIds.filter((x) => x !== id)
            : [...get().followedShopIds, id],
        });
      },
      toggleRsvp: (id) => {
        const has = get().rsvpIds.includes(id);
        set({
          rsvpIds: has ? get().rsvpIds.filter((x) => x !== id) : [...get().rsvpIds, id],
        });
      },
      sitLesson: (id) => {
        const day = new Date().toISOString().slice(0, 10);
        const satLessonIds = get().satLessonIds.includes(id) ? get().satLessonIds : [...get().satLessonIds, id];
        const satDays = get().satDays.includes(day) ? get().satDays : [...get().satDays, day];
        set({ satLessonIds, satDays });
      },
      inviteCrew: (name, trade) => {
        const n = name.trim();
        if (!n) return;
        set({
          crewInvites: [{ name: n, trade: trade.trim() || "Trade", at: new Date().toISOString() }, ...get().crewInvites],
        });
      },
      claimFund: (id) => {
        if (get().claimedFundIds.includes(id)) return;
        set({ claimedFundIds: [...get().claimedFundIds, id] });
      },
      publishListing: (listing) => {
        if (get().extraListings.some((l) => l.id === listing.id)) return;
        set({ extraListings: [listing, ...get().extraListings] });
      },
      postReel: (reel) => {
        set({ extraReels: [reel, ...get().extraReels] });
      },
      setWheelResume: (row) => set({ wheelResume: row }),
      setClipStatus: (youtube, status) => {
        if (!youtube) return;
        const clipStatus = { ...get().clipStatus, [youtube]: status };
        const posts =
          status === "killed" ? get().posts.filter((p) => p.youtube !== youtube) : get().posts;
        const extraReels =
          status === "killed" ? get().extraReels.filter((r) => r.youtube !== youtube) : get().extraReels;
        set({
          clipStatus,
          posts,
          extraReels,
          audit: [{ t: new Date().toISOString(), who: "desk", action: `clip ${status} ${youtube}` }, ...get().audit].slice(0, 80),
        });
      },
      ingestClips: (batch) => {
        const haveYt = new Set(get().posts.map((p) => p.youtube).filter(Boolean));
        const haveR = new Set(get().extraReels.map((r) => r.id));
        const blocked = get().clipStatus;
        const incomingPeople = (batch.people ?? []).filter((p) => hallEnglish(p.name, p.bio));
        const incoming = (batch.posts ?? []).filter(
          (p) =>
            p.youtube &&
            !haveYt.has(p.youtube) &&
            hallEnglish(p.body, p.headline) &&
            (blocked[p.youtube] ?? "pending") !== "killed",
        );
        const incomingReels = (batch.reels ?? []).filter(
          (r) =>
            !haveR.has(r.id) &&
            hallEnglish(r.caption, r.title) &&
            (r.youtube ? (blocked[r.youtube] ?? "pending") !== "killed" : true),
        );
        const items = (batch.items ?? incoming.map((p) => ({
          youtube: p.youtube ?? "",
          title: p.headline || p.body.slice(0, 72),
          author: get().people.find((x) => x.id === p.authorId)?.name || p.authorId,
          handle: "",
          trade: get().people.find((x) => x.id === p.authorId)?.trade || "",
          topic: p.kind,
        }))).map((it) => ({
          ...it,
          added: Boolean(it.youtube) && !haveYt.has(it.youtube) && hallEnglish(it.title, it.author),
        }));
        const added = items.filter((it) => it.added).length;
        const skipped = items.filter((it) => !it.added).length;
        const at = new Date().toISOString();
        const report: ClipPullReport = {
          id: nid("pull"),
          at,
          nextAt: new Date(Date.now() + CLIP_PULL_MS).toISOString(),
          added,
          skipped,
          failed: batch.failed ?? [],
          items,
        };
        const merged = scrubHallCopy(
          mergeById(get().people, incomingPeople),
          incoming.length ? [...incoming, ...get().posts] : get().posts,
          [...incomingReels, ...get().extraReels],
        );
        const youtube = scrubYoutubeCopy(merged.posts, merged.reels);
        const clipStatus = { ...get().clipStatus };
        for (const p of incoming) {
          if (p.youtube && !clipStatus[p.youtube]) clipStatus[p.youtube] = "live";
        }
        for (const r of incomingReels) {
          if (r.youtube && !clipStatus[r.youtube]) clipStatus[r.youtube] = "live";
        }
        set({
          people: merged.people,
          posts: youtube.posts,
          extraReels: youtube.reels,
          clipStatus,
          clipIngestedAt: at,
          clipPullRev: CLIP_PULL_REV,
          clipReports: [report, ...get().clipReports].slice(0, 60),
        });
      },
      setHallTheme: (theme) => {
        set({ hallTheme: theme });
        document.documentElement.dataset.theme = theme;
      },
      setHallLang: (lang) => set({ hallLang: lang }),
      toggleReelLike: (id) => {
        const has = get().likedReelIds.includes(id);
        set({
          likedReelIds: has
            ? get().likedReelIds.filter((x) => x !== id)
            : [...get().likedReelIds, id],
        });
      },
      fileReport: (row) => {
        const id = nid("q");
        set({ reports: [{ ...row, id }, ...get().reports] });
        get().logAudit(`Report · ${row.kind} · ${row.reason}`);
      },
      resolveReport: (id, status) => {
        const live = get().reports.find((r) => r.id === id);
        const pulledPostIds =
          status === "pulled" && live && (live.kind === "line" || live.kind === "post") && live.targetId
            ? [...new Set([...get().pulledPostIds, live.targetId])]
            : get().pulledPostIds;
        if (status === "pulled" && live?.kind === "person" && live.targetId) {
          get().setBoardStatus(live.targetId, "suspended");
        }
        set({
          reportStatus: { ...get().reportStatus, [id]: status },
          pulledPostIds,
          audit: [
            {
              t: "just now",
              who: "Desk",
              action: status === "pulled" ? `Pulled ${id}` : `Kept ${id}`,
            },
            ...get().audit,
          ],
        });
      },
      setBoardStatus: (id, status) => {
        set({
          boardStatus: { ...get().boardStatus, [id]: status },
          audit: [{ t: "just now", who: "Desk", action: `${status} · ${id}` }, ...get().audit],
        });
      },
      setFlag: (key, on) => {
        set({
          flags: { ...get().flags, [key]: on },
          audit: [
            { t: "just now", who: "Desk", action: `${key} ${on ? "on" : "off"}` },
            ...get().audit,
          ],
        });
      },
      logAudit: (action) => {
        set({ audit: [{ t: "just now", who: "Desk", action }, ...get().audit] });
      },
      pullListing: (id) => {
        if (get().pulledListings.includes(id)) return;
        set({
          pulledListings: [...get().pulledListings, id],
          audit: [
            { t: "just now", who: "Desk", action: `Listing pulled · ${id}` },
            ...get().audit,
          ],
        });
      },
      setContractStage: (id, stage) => {
        const contracts = get().contracts ?? seedContracts;
        set({
          contracts: contracts.map((c) => (c.id === id ? { ...c, stage } : c)),
          audit: [{ t: "just now", who: "Desk", action: `${id} → ${stage}` }, ...get().audit],
        });
      },
      toggleContractMile: (id, mileId) => {
        const contracts = get().contracts ?? seedContracts;
        set({
          contracts: contracts.map((c) =>
            c.id === id
              ? {
                  ...c,
                  milestones: c.milestones.map((m) =>
                    m.id === mileId ? { ...m, done: !m.done } : m,
                  ),
                }
              : c,
          ),
        });
      },
      staffContract: (id, personId) => {
        const contracts = get().contracts ?? seedContracts;
        set({
          contracts: contracts.map((c) =>
            c.id === id && !c.workerIds.includes(personId)
              ? {
                  ...c,
                  workerIds: [...c.workerIds, personId],
                  stage: c.stage === "open" ? "awarded" : c.stage,
                }
              : c,
          ),
        });
      },
      setCareerGoal: (careerGoal) => set({ careerGoal }),
      confirmGoal: () => set({ goalConfirmedAt: new Date().toISOString() }),
      setCardLayout: (cardLayout) => set({ cardLayout }),
      bindSession: (data) => {
        const email = data.email?.trim().toLowerCase();
        if (email && email !== get().sessionEmail) set({ sessionEmail: email });
        const role = data.role ?? "member";
        const existing = get().people.find((p) => p.id === data.userId);
        const name = data.name || existing?.name || "New member";
        const photo = data.person.photo || existing?.photo || "/portraits/member.jpg";
        if (
          get().youId === data.userId &&
          get().sessionRole === role &&
          existing &&
          existing.name === name &&
          existing.photo === photo
        ) {
          return;
        }
        const person: Person = existing
          ? { ...existing, ...data.person, id: data.userId, name, photo, example: false, lastSeen: new Date().toISOString() }
          : { ...data.person, id: data.userId, name, photo, example: false, lastSeen: new Date().toISOString() };
        set({
          youId: data.userId,
          sessionEmail: data.email?.trim().toLowerCase() || get().sessionEmail,
          sessionRole: role,
          people: existing
            ? get().people.map((p) => (p.id === data.userId ? person : p))
            : [person, ...get().people],
        });
      },
      clearSession: () => {
        if (get().sessionRole === null && get().youId === YOU_ID) return;
        set({ youId: YOU_ID, sessionEmail: "", sessionRole: null });
      },
      mergeHall: (hall) => {
        if (!hall) return;
        const people = mergeById(
          get().people,
          hall.people.map((p) => {
            const cur = get().people.find((x) => x.id === p.id);
            const keep =
              cur?.lastSeen &&
              p.lastSeen &&
              Date.parse(cur.lastSeen) > Date.parse(p.lastSeen)
                ? cur.lastSeen
                : p.lastSeen || cur?.lastSeen;
            return { ...p, example: false, lastSeen: keep };
          }),
        );
        const posts = mergeById(get().posts, hall.posts).sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        );
        const calls = mergeById(get().calls, hall.calls);
        const vouches = mergeById(get().vouches, hall.vouches);
        set({ people, posts, calls, vouches });
      },
      mergeMhcc: (incoming) => {
        if (!incoming.length) return;
        const rest = get().people.filter((p) => p.book !== "mhcc" && !String(p.id).startsWith("mhcc-"));
        set({ people: mergeById(rest, incoming) });
      },
      askPackage: (pack) => {
        const s = get();
        const you = s.people.find((p) => p.id === s.youId);
        if (!you) return;
        if (s.packageAsks.some((a) => a.pack === pack && a.fromId === you.id)) return;
        set({
          packageAsks: [
            {
              id: nid("ask"),
              pack,
              fromId: you.id,
              name: you.name,
              at: new Date().toISOString(),
            },
            ...s.packageAsks,
          ],
        });
        s.logAudit(`Ask · ${pack} · ${you.name}`);
      },
      grantShop: (personId) => {
        if (get().shopSeats.includes(personId)) return;
        const who = get().people.find((p) => p.id === personId);
        set({
          shopSeats: [...get().shopSeats, personId],
          packageAsks: get().packageAsks.filter((a) => !(a.pack === "shop" && a.fromId === personId)),
        });
        get().logAudit(`Grant · shop · ${who?.name ?? personId}`);
      },
      buyShopSeat: () => {
        const you = get().people.find((p) => p.id === get().youId);
        if (!you) return null;
        if (!get().shopSeats.includes(you.id)) get().grantShop(you.id);
        const line: LedgerLine = {
          id: nid("take"),
          kind: "shop",
          at: new Date().toISOString(),
          shopId: you.id,
          shop: you.name,
          label: "Shop board · month",
          gross: TAKE.shop,
        };
        set({ ledger: [line, ...get().ledger] });
        get().logAudit(`Take · shop · $${TAKE.shop}`);
        return line;
      },
      grantTicket: (personId) => {
        if (get().ticketSeats.includes(personId)) return;
        const who = get().people.find((p) => p.id === personId);
        set({
          ticketSeats: [...get().ticketSeats, personId],
          packageAsks: get().packageAsks.filter((a) => !(a.pack === "ticket" && a.fromId === personId)),
        });
        get().logAudit(`Grant · ticket · ${who?.name ?? personId}`);
      },
      coverTicket: (personId) => {
        if (!get().shopSeats.includes(get().youId)) return;
        get().grantTicket(personId);
        const who = get().people.find((p) => p.id === personId);
        const shop = get().people.find((p) => p.id === get().youId);
        if (shop) {
          set({
            ledger: [
              {
                id: nid("take"),
                kind: "ticket",
                at: new Date().toISOString(),
                shopId: shop.id,
                shop: shop.name,
                label: `Ticket check · ${who?.name ?? personId}`,
                gross: TAKE.ticket,
                personId,
              },
              ...get().ledger,
            ],
          });
        }
        set({
          people: get().people.map((p) =>
            p.id !== personId
              ? p
              : {
                  ...p,
                  tickets: p.tickets.map((t) => {
                    const life = ticketStatus(t);
                    if (life === "lapsed") return t;
                    if (t.verify === "unverified" || t.verify === "pending") {
                      return { ...t, verify: "verified" as const };
                    }
                    return t;
                  }),
                },
          ),
        });
        if (who) {
          get().startThread(
            personId,
            `Shop covered Ticket check ($12). Current tickets that weren't lapsed are verified on the card.`,
          );
        }
        get().logAudit(`Cover ticket · ${who?.name ?? personId}`);
      },
      sendMail: (toId, subject, body) => {
        const fromId = get().youId;
        const sub = subject.trim();
        const text = body.trim();
        if (!fromId || fromId === toId || !sub || !text) return;
        const letter: HallLetter = {
          id: nid("mail"),
          fromId,
          toId,
          subject: sub,
          body: text,
          createdAt: new Date().toISOString(),
          read: false,
        };
        set({ mail: [letter, ...get().mail] });
        get().startThread(toId, `Hall mail · ${sub}\n\n${text}`);
        get().logAudit(`Mail · ${sub} · ${toId}`);
        const from = get().people.find((p) => p.id === fromId);
        const to = get().people.find((p) => p.id === toId);
        const outside = to?.reachEmail?.trim();
        if (outside && smtpReady(get().smtp)) {
          void dispatchSmtp({
            data: {
              to: outside,
              subject: sub,
              text: `${text}\n\n— ${from?.name ?? "A card"} · ${from ? hallAddress(from) : ""}\nConnectLn hall mail`,
              replyTo: from?.reachEmail,
              settings: get().smtp,
            },
          }).catch(() => undefined);
        }
      },
      markMailRead: (id) => {
        set({
          mail: get().mail.map((m) => (m.id === id ? { ...m, read: true } : m)),
        });
      },
      setSmtp: (patch) => {
        set({ smtp: normalizeSmtp({ ...get().smtp, ...patch }) });
        get().logAudit("SMTP relay saved");
      },
      openLine: (personId, kind) => set({ liveLine: { personId, kind } }),
      closeLine: () => set({ liveLine: null }),
      logLine: (input) => {
        const you = get().people.find((p) => p.id === get().youId);
        const them = get().people.find((p) => p.id === input.withId);
        if (!you || !them) return null;
        const ai = runLineAi({ you, them, kind: input.kind, transcript: input.transcript });
        const session: LineSession = {
          id: nid("line"),
          withId: them.id,
          kind: input.kind,
          startedAt: input.startedAt,
          endedAt: new Date().toISOString(),
          transcript: ai.transcript,
          summary: ai.summary,
          followSubject: ai.followSubject,
          followBody: ai.followBody,
          audio: input.audio,
        };
        if (input.kind === "meet" || input.kind === "call") {
          const said = [input.transcript, ai.summary].filter(Boolean).join(" — ");
          get().noteWatch("meet", them.name, said || `Room with ${them.name}`);
        }
        const actions: CrmAction[] = ai.actions.map((title) => ({
          id: nid("act"),
          personId: them.id,
          title,
          done: false,
          fromSession: session.id,
        }));
        const deals = [...get().dealNotes];
        if (ai.dealNote) {
          const existing = deals.find((d) => d.personId === them.id);
          if (existing) {
            deals.splice(
              deals.indexOf(existing),
              1,
              { ...existing, notes: existing.notes, ai: ai.dealNote, next: ai.actions[1] ?? existing.next },
            );
          } else {
            deals.unshift({
              id: nid("deal"),
              personId: them.id,
              address: `${them.city}, ${them.state}`,
              stage: "lead",
              next: ai.actions[1] ?? "Showing",
              notes: "",
              ai: ai.dealNote,
            });
          }
        }
        set({
          lineSessions: [session, ...get().lineSessions],
          crmActions: [...actions, ...get().crmActions],
          dealNotes: deals,
        });
        get().startThread(them.id, `Line AI · ${ai.summary}`);
        get().logAudit(`Line · ${input.kind} · ${them.name}`);
        return session;
      },
      toggleCrmAction: (id) => {
        set({
          crmActions: get().crmActions.map((a) => (a.id === id ? { ...a, done: !a.done } : a)),
        });
      },
      saveDeal: (note) => {
        const id = note.id ?? nid("deal");
        const rest = get().dealNotes.filter((d) => d.id !== id && d.personId !== note.personId);
        set({ dealNotes: [{ ...note, id }, ...rest] });
      },
    }),
    {
      name: "connectln-v32",
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<typeof current>;
        const clean = scrubHallCopy(
          mergeById(current.people, p.people ?? []),
          mergeById(current.posts, p.posts ?? []),
          mergeById(current.extraReels, p.extraReels ?? []),
        );
        return {
          ...current,
          ...p,
          people: clean.people,
          posts: clean.posts,
          calls: mergeById(current.calls, p.calls ?? []),
          threads: mergeById(current.threads, p.threads ?? []),
          extraReels: clean.reels,
          wheelResume: p.wheelResume ?? current.wheelResume,
          clipIngestedAt: (p.extraReels ?? []).some((r) => r.youtube)
            ? (p.clipIngestedAt ?? current.clipIngestedAt)
            : undefined,
          youId: current.youId,
          sessionEmail: p.sessionEmail ?? current.sessionEmail,
          watchNotes: current.watchNotes,
          sessionRole: current.sessionRole,
          hydrated: current.hydrated,
          contracts: p.contracts ?? current.contracts,
          careerGoal: p.careerGoal ?? current.careerGoal,
          cardLayout: p.cardLayout ?? current.cardLayout,
          dismissedNotices: p.dismissedNotices ?? current.dismissedNotices,
          pulledListings: p.pulledListings ?? current.pulledListings,
          boostedPostIds: p.boostedPostIds ?? current.boostedPostIds,
          packageAsks: p.packageAsks ?? current.packageAsks,
          shopSeats: [...new Set([...(p.shopSeats ?? []), "jordan-hale"])],
          ticketSeats: [...new Set([...(p.ticketSeats ?? []), "jordan-hale"])],
          ledger: p.ledger ?? current.ledger,
          mail: p.mail?.length ? p.mail : current.mail,
          smtp: normalizeSmtp({ ...current.smtp, ...(p.smtp ?? {}) }),
          lineSessions: p.lineSessions ?? current.lineSessions,
          crmActions: p.crmActions ?? current.crmActions,
          dealNotes: p.dealNotes ?? current.dealNotes,
          callHands: p.callHands ?? current.callHands,
          callHires:
            p.callHires && Object.keys(p.callHires).length ? p.callHires : current.callHires,
          shiftOffers: p.shiftOffers ?? current.shiftOffers,
          satLessonIds: p.satLessonIds ?? current.satLessonIds,
          satDays: p.satDays ?? current.satDays,
          crewInvites: p.crewInvites ?? current.crewInvites,
          claimedFundIds: p.claimedFundIds ?? current.claimedFundIds,
          clipReports: p.clipReports?.length ? p.clipReports : current.clipReports,
          clipStatus: p.clipStatus ?? current.clipStatus,
          hallTheme: isHallTheme(p.hallTheme) ? p.hallTheme : current.hallTheme,
          hallLang: isHallLang(p.hallLang) ? p.hallLang : current.hallLang,
          reports: p.reports ?? current.reports,
          pulledPostIds: p.pulledPostIds ?? current.pulledPostIds,
          savedPersonIds: p.savedPersonIds ?? current.savedPersonIds,
          savedPostIds: p.savedPostIds ?? current.savedPostIds,
          starredThreadIds: p.starredThreadIds ?? current.starredThreadIds,
          dockHiddenIds: p.dockHiddenIds ?? current.dockHiddenIds,
          callPrefs: { ...current.callPrefs, ...(p.callPrefs ?? {}) },
        };
      },
      partialize: (s) => ({
        people: s.people.filter(
          (p) =>
            p.book !== "mhcc" &&
            !String(p.id).startsWith("mhcc-") &&
            (!isExample(p) ||
              p.id === s.youId ||
              String(p.id).startsWith("in-") ||
              p.tickets.some((t) => /expedite/i.test(t.issuer ?? ""))),
        ),
        posts: s.posts
          .filter((p) => {
            if (SEED_POST_IDS.has(p.id)) return false;
            if (p.youtube && String(p.id).startsWith("in-")) return true;
            return !p.youtube;
          })
          .slice(0, 200)
          .map((p) => (p.video?.startsWith("blob:") ? { ...p, video: undefined } : p)),
        calls: s.calls.filter((c) => !SEED_CALL_IDS.has(c.id) && !c.wire),
        threads: s.threads,
        vouches: s.vouches,
        likedPostIds: s.likedPostIds,
        sessionEmail: s.sessionEmail,
        boostedPostIds: s.boostedPostIds,
        savedCallIds: s.savedCallIds,
        appliedCallIds: s.appliedCallIds,
        savedPersonIds: s.savedPersonIds,
        savedPostIds: s.savedPostIds,
        starredThreadIds: s.starredThreadIds,
        dockHiddenIds: s.dockHiddenIds,
        callPrefs: s.callPrefs,
        callHands: s.callHands,
        callHires: s.callHires,
        shiftOffers: s.shiftOffers,
        introDismissed: s.introDismissed,
        heardHall: s.heardHall,
        openedCard: s.openedCard,
        loopDismissed: s.loopDismissed,
        passedChallenges: s.passedChallenges,
        gigModes: s.gigModes,
        menteeOf: s.menteeOf,
        bids: s.bids,
        intros: s.intros,
        battleWins: s.battleWins,
        bought: s.bought,
        proposals: s.proposals,
        joinedCollab: s.joinedCollab,
        milestones: s.milestones,
        inviteStatus: s.inviteStatus,
        invites: s.invites,
        followedShopIds: s.followedShopIds,
        rsvpIds: s.rsvpIds,
        satLessonIds: s.satLessonIds,
        satDays: s.satDays,
        crewInvites: s.crewInvites,
        claimedFundIds: s.claimedFundIds,
        extraListings: s.extraListings,
        extraReels: s.extraReels
          .filter((r) => !r.video?.startsWith("blob:"))
          .slice(0, 120),
        wheelResume: s.wheelResume,
        clipIngestedAt: s.clipIngestedAt,
        clipPullRev: s.clipPullRev,
        clipReports: s.clipReports.slice(0, 3),
        clipStatus: s.clipStatus,
        hallTheme: s.hallTheme,
        hallLang: s.hallLang,
        likedReelIds: s.likedReelIds,
        reportStatus: s.reportStatus,
        reports: s.reports,
        pulledPostIds: s.pulledPostIds,
        boardStatus: s.boardStatus,
        flags: s.flags,
        audit: s.audit,
        pulledListings: s.pulledListings,
        contracts: s.contracts,
        careerGoal: s.careerGoal,
        goalConfirmedAt: s.goalConfirmedAt,
        cardLayout: s.cardLayout,
        dismissedNotices: s.dismissedNotices,
        packageAsks: s.packageAsks,
        shopSeats: s.shopSeats,
        ticketSeats: s.ticketSeats,
        ledger: s.ledger.slice(0, 80),
        mail: s.mail,
        smtp: s.smtp,
        lineSessions: s.lineSessions.map((x) => (x.audio ? { ...x, audio: undefined } : x)),
        crmActions: s.crmActions,
        dealNotes: s.dealNotes,
      }),
    },
  ),
);

export function personById(people: Person[], id: string) {
  return people.find((p) => p.id === id);
}
