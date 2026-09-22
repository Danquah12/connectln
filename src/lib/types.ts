export type Trade =
  | "Electrician"
  | "Plumber"
  | "HVAC"
  | "Welder"
  | "Carpenter"
  | "Ironworker"
  | "Millwright"
  | "Solar"
  | "Equipment"
  | "Elevator"
  | "Nurse"
  | "Physician"
  | "Pharmacist"
  | "Teacher"
  | "Faculty"
  | "Developer"
  | "Realtor"
  | "Agent"
  | "Therapist"
  | "Dentist"
  | "Advisor";

export type FieldGroup = "trades" | "care" | "classroom" | "build" | "homes" | "money";

export type Level =
  | "Apprentice"
  | "Journeyman"
  | "Foreman"
  | "Master"
  | "Owner"
  | "Charge"
  | "Staff"
  | "Attending"
  | "Adjunct";

export type Availability = "open" | "booked" | "on-job" | "not-looking";

export type GigMode =
  | "full-time"
  | "contract"
  | "part-time"
  | "gigs"
  | "emergency"
  | "seasonal";

export type PostKind = "talk" | "call" | "safety" | "work" | "ask" | "brief";

export type CredentialVerify = "verified" | "pending" | "unverified";

export type BoardResult =
  | "match"
  | "no-record"
  | "no-lookup"
  | "needs-number"
  | "needs-paper"
  | "stale"
  | "unconfirmed";

export type TicketSource = {
  board: string;
  url?: string;
  checkedAt: string;
  result: BoardResult;
  protocol?: "dora" | "nursys" | "osha" | "other";
  holder?: string;
  status?: string;
  compact?: string;
  discipline?: boolean;
};

export type OshaIndustry = "construction" | "general" | "maritime" | "disaster";

export type OshaCard = {
  kind: "student" | "trainer";
  hours?: 10 | 30;
  industry: OshaIndustry;
  completed?: string;
  trainer?: string;
  trainerId?: string;
  ato?: string;
  qr?: boolean;
  recencyYears?: number;
};

export type Ticket = {
  id: string;
  name: string;
  issuer: string;
  expires?: string;
  issued?: string;
  number?: string;
  verify?: CredentialVerify;
  document?: string;
  source?: TicketSource;
  osha?: OshaCard;
};

export type OpenTo = {
  looking: string;
  locations: string;
  when: string;
  minRate: string;
  travel: string;
  shift: string;
  employment: string;
};

export type JobSite = {
  id: string;
  name: string;
  role: string;
  when: string;
  city: string;
  duration?: string;
  crew?: number;
  skills?: string[];
  photos?: string[];
  verified?: boolean;
  teamIds?: string[];
};

export type Veteran = {
  branch: string;
  mos: string;
  years: number;
  discharge?: string;
  clearance?: string;
  poly?: boolean;
};

export type Person = {
  id: string;
  name: string;
  trade: Trade;
  level: Level;
  city: string;
  state: string;
  years: number;
  rate?: string;
  travelMiles: number;
  availability: Availability;
  union?: string;
  bio: string;
  photo: string;
  cover: string;
  specialties: string[];
  tickets: Ticket[];
  history: JobSite[];
  veteran?: Veteran;
  hours?: number;
  mentoring?: boolean;
  seekingMentor?: boolean;
  cohortIds?: string[];
  tools?: string[];
  software?: string[];
  openTo?: OpenTo;
  disaster?: boolean;
  education?: string[];
  intro?: string;
  gigModes?: GigMode[];
  menteeOf?: string;
  mentorWeeks?: number;
  xHandle?: string;
  /** What they will do. What they need. Not a headline. */
  offers?: string[];
  needs?: string[];
  /** Outside address hall mail can SMTP to. Hall address stays @hall.connectln. */
  reachEmail?: string;
  /** Seed card so the hall isn't empty. Not a real member. */
  example?: boolean;
  /** Desk looked at the seat and stamped the card. */
  deskVerified?: boolean;
  /** ISO time they last pulsed. Live members from the hall; examples are derived. */
  lastSeen?: string;
  /** Maryland Labor / MHCC purchased book. */
  book?: "mhcc";
};

export type CallPrefs = {
  union: boolean;
  shift: boolean;
  city: boolean;
  sos: boolean;
};

export type Comment = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type Post = {
  id: string;
  authorId: string;
  kind: PostKind;
  body: string;
  photo?: string;
  video?: string;
  youtube?: string;
  headline?: string;
  sitTo?: string;
  createdAt: string;
  likes: number;
  comments: Comment[];
  parentId?: string;
  boosts?: number;
};

export type CrewCall = {
  id: string;
  title: string;
  trade: Trade;
  shop: string;
  city: string;
  state: string;
  rate: string;
  duration: string;
  start: string;
  tickets: string[];
  union: boolean;
  travel: boolean;
  spots: number;
  filled: number;
  description: string;
  photo?: string;
  perDiem?: string;
  shift?: boolean;
  urgent?: boolean;
  apprentice?: boolean;
  postedBy?: string;
};

export type VouchKind =
  | "quality"
  | "troubleshooting"
  | "leadership"
  | "reliability"
  | "safety"
  | "teaching";

export type Vouch = {
  id: string;
  fromId: string;
  toId: string;
  site: string;
  createdAt: string;
  body: string;
  kinds?: VouchKind[];
};

export type ThreadMessage = {
  id: string;
  fromId: string;
  body: string;
  createdAt: string;
};

export type Thread = {
  id: string;
  withId: string;
  messages: ThreadMessage[];
};

export type HallLetter = {
  id: string;
  fromId: string;
  toId: string;
  subject: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type Guild = {
  id: string;
  name: string;
  blurb: string;
  memberIds: string[];
};

export type Cohort = {
  id: string;
  name: string;
  kind: "apprenticeship" | "unit" | "program" | "school";
  year: string;
  place: string;
  memberIds: string[];
};

export type ShopRatings = {
  pay: number;
  safety: number;
  management: number;
  overtime: number;
  equipment: number;
  training: number;
  balance: number;
};

export type Shop = {
  id: string;
  name: string;
  city: string;
  state: string;
  trade: Trade;
  staffIds: string[];
  projectIds: string[];
  ratings?: ShopRatings;
  url?: string;
  partner?: boolean;
};

export type Project = {
  id: string;
  name: string;
  shop: string;
  city: string;
  when: string;
  photo: string;
  memberIds: string[];
};

export type ListingKind = "software" | "course" | "guide" | "physical" | "service";

export type ListingReview = { by: string; stars: number; body: string };

export type Listing = {
  id: string;
  title: string;
  kind: ListingKind;
  sellerId: string;
  price: string;
  photo: string;
  blurb: string;
  rating: number;
  demo?: boolean;
  views?: number;
  downloads?: number;
  stack?: string[];
  screenshots?: string[];
  docs?: string;
  reviews?: ListingReview[];
  liveUrl?: string;
};

export type ShowcaseItem = {
  id: string;
  personId: string;
  title: string;
  kind: "demo" | "walkthrough" | "pitch" | "research";
  still: string;
  blurb: string;
  rating: number;
  views: number;
};

export type ReelKind = "work" | "demo" | "safety" | "classroom" | "care";

export type Reel = {
  id: string;
  personId: string;
  title: string;
  caption: string;
  script?: string;
  kind: ReelKind;
  video?: string;
  youtube?: string;
  still: string;
  createdAt: string;
  likes: number;
};

export type LectureChapter = {
  t: number;
  title: string;
  body: string;
};

export type Lecture = {
  id: string;
  personId: string;
  title: string;
  duration: number;
  video: string;
  still: string;
  chapters: LectureChapter[];
};

export type CollabNeed = {
  id: string;
  title: string;
  city: string;
  need: string[];
  authorId: string;
};

export type ShopStage = "idea" | "prototype" | "crew" | "shop";

export type CardLayout = "shop" | "plate" | "ticket";

export type ContractStage = "open" | "awarded" | "on-job" | "punch" | "paid" | "closed" | "dispute";

export type Contract = {
  id: string;
  callId: string;
  title: string;
  shop: string;
  city: string;
  workerIds: string[];
  rate: string;
  stage: ContractStage;
  tickets: string[];
  milestones: { id: string; label: string; done: boolean }[];
  notes: string;
};

export type HallInviteKind = "crew" | "intro" | "event" | "vouch";

export type HallInvite = {
  id: string;
  fromId: string;
  kind: HallInviteKind;
  body: string;
  why: string;
};

export type Meet = {
  id: string;
  title: string;
  place: string;
  when: string;
  kind: string;
  trades?: Trade[];
  blurb?: string;
};

export type Fund = {
  id: string;
  title: string;
  who: string;
  blurb: string;
  kind: "gi-bill" | "apprentice" | "ce" | "grant";
  trades: Trade[];
};

export type Lesson = {
  id: string;
  authorId: string;
  title: string;
  minutes: number;
  topic: string;
};

export type Training = {
  id: string;
  title: string;
  place: string;
  when: string;
  tickets: string[];
};

export type SkillDemo = {
  id: string;
  personId: string;
  title: string;
  stills: string[];
  reviewerId: string;
  score: number;
};

export type Visitor = {
  id: string;
  shop: string;
  looking: string;
  city: string;
  when: string;
};

export type RepEvent = {
  id: string;
  personId: string;
  label: string;
  when: string;
};
