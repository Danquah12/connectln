export const HALL_LANGS = [
  { id: "en", native: "English", name: "English" },
  { id: "de", native: "Deutsch", name: "German" },
  { id: "es", native: "Español", name: "Spanish" },
  { id: "fr", native: "Français", name: "French" },
  { id: "id", native: "Bahasa Indonesia", name: "Indonesian" },
  { id: "it", native: "Italiano", name: "Italian" },
  { id: "ja", native: "日本語", name: "Japanese" },
  { id: "ko", native: "한국어", name: "Korean" },
  { id: "nl", native: "Nederlands", name: "Dutch" },
  { id: "pl", native: "Polski", name: "Polish" },
  { id: "pt", native: "Português", name: "Portuguese" },
  { id: "tr", native: "Türkçe", name: "Turkish" },
  { id: "zh", native: "简体中文", name: "Chinese" },
] as const;

export type HallLang = (typeof HALL_LANGS)[number]["id"];

export function isHallLang(v: unknown): v is HallLang {
  return HALL_LANGS.some((l) => l.id === v);
}

type Copy = {
  talk: string;
  calls: string;
  learn: string;
  people: string;
  inbox: string;
  hello: string;
  sit: string;
  search: string;
  yours: string;
  also: string;
  card: string;
  language: string;
};

const EN: Copy = {
  talk: "Shop talk",
  calls: "Calls",
  learn: "Learn",
  people: "People",
  inbox: "Inbox",
  hello: "Hello",
  sit: "sit the work that belongs on your card.",
  search: "Search the hall, not the internet",
  yours: "Your card",
  also: "Also on the hall",
  card: "On the card",
  language: "Language",
};

const COPY: Record<HallLang, Copy> = {
  en: EN,
  de: {
    ...EN,
    talk: "Gespräch",
    calls: "Rufe",
    learn: "Lernen",
    people: "Leute",
    inbox: "Post",
    hello: "Hallo",
    sit: "setz die Arbeit, die auf deine Karte gehört.",
    search: "Die Halle suchen, nicht das Internet",
    yours: "Deine Karte",
    also: "Auch in der Halle",
    card: "Auf der Karte",
    language: "Sprache",
  },
  es: {
    ...EN,
    talk: "Charla",
    calls: "Llamados",
    learn: "Aprender",
    people: "Gente",
    inbox: "Bandeja",
    hello: "Hola",
    sit: "siéntate el trabajo que va en tu tarjeta.",
    search: "Busca en la sala, no en internet",
    yours: "Tu tarjeta",
    also: "También en la sala",
    card: "En la tarjeta",
    language: "Idioma",
  },
  fr: {
    ...EN,
    talk: "Parole",
    calls: "Appels",
    learn: "Apprendre",
    people: "Gens",
    inbox: "Boîte",
    hello: "Bonjour",
    sit: "assieds le travail qui va sur ta carte.",
    search: "Cherche dans la salle, pas sur internet",
    yours: "Ta carte",
    also: "Aussi dans la salle",
    card: "Sur la carte",
    language: "Langue",
  },
  id: {
    ...EN,
    talk: "Bicara",
    calls: "Panggilan",
    learn: "Belajar",
    people: "Orang",
    inbox: "Kotak",
    hello: "Halo",
    sit: "dudukkan kerja yang masuk kartu kamu.",
    search: "Cari di aula, bukan di internet",
    yours: "Kartu kamu",
    also: "Juga di aula",
    card: "Di kartu",
    language: "Bahasa",
  },
  it: {
    ...EN,
    talk: "Parlata",
    calls: "Chiamate",
    learn: "Impara",
    people: "Persone",
    inbox: "Posta",
    hello: "Ciao",
    sit: "metti il lavoro che sta sulla tua carta.",
    search: "Cerca nella sala, non in internet",
    yours: "La tua carta",
    also: "Anche in sala",
    card: "Sulla carta",
    language: "Lingua",
  },
  ja: {
    ...EN,
    talk: "現場の話",
    calls: "呼び出し",
    learn: "学ぶ",
    people: "人",
    inbox: "受信",
    hello: "こんにちは",
    sit: "カードに載る仕事を座って学べ。",
    search: "ホールを探す。ネットではない",
    yours: "あなたのカード",
    also: "ホールの他",
    card: "カード",
    language: "言語",
  },
  ko: {
    ...EN,
    talk: "현장 이야기",
    calls: "호출",
    learn: "배우기",
    people: "사람들",
    inbox: "받은함",
    hello: "안녕하세요",
    sit: "카드에 올릴 일을 앉아서 배우세요.",
    search: "홀에서 찾으세요. 인터넷이 아닙니다",
    yours: "내 카드",
    also: "홀의 다른 것",
    card: "카드",
    language: "언어",
  },
  nl: {
    ...EN,
    talk: "Praat",
    calls: "Oproepen",
    learn: "Leren",
    people: "Mensen",
    inbox: "Post",
    hello: "Hallo",
    sit: "zet het werk dat op je kaart hoort.",
    search: "Zoek in de hal, niet op internet",
    yours: "Jouw kaart",
    also: "Ook in de hal",
    card: "Op de kaart",
    language: "Taal",
  },
  pl: {
    ...EN,
    talk: "Rozmowa",
    calls: "Wezwania",
    learn: "Nauka",
    people: "Ludzie",
    inbox: "Skrzynka",
    hello: "Cześć",
    sit: "usiądź pracę, która należy do karty.",
    search: "Szukaj w hali, nie w internecie",
    yours: "Twoja karta",
    also: "Także w hali",
    card: "Na karcie",
    language: "Język",
  },
  pt: {
    ...EN,
    talk: "Conversa",
    calls: "Chamados",
    learn: "Aprender",
    people: "Gente",
    inbox: "Caixa",
    hello: "Olá",
    sit: "senta o trabalho que entra no teu cartão.",
    search: "Procura na sala, não na internet",
    yours: "O teu cartão",
    also: "Também na sala",
    card: "No cartão",
    language: "Idioma",
  },
  tr: {
    ...EN,
    talk: "Sohbet",
    calls: "Çağrılar",
    learn: "Öğren",
    people: "İnsanlar",
    inbox: "Gelen",
    hello: "Merhaba",
    sit: "kartına ait işi oturup öğren.",
    search: "Salonda ara, internette değil",
    yours: "Kartın",
    also: "Salonda başka",
    card: "Kartta",
    language: "Dil",
  },
  zh: {
    ...EN,
    talk: "现场谈",
    calls: "召唤",
    learn: "学习",
    people: "的人",
    inbox: "收件",
    hello: "你好",
    sit: "坐下来学该上卡的活。",
    search: "在厅里找，不在网上找",
    yours: "你的卡",
    also: "厅里的其他",
    card: "在卡上",
    language: "语言",
  },
};

export function hallCopy(lang: HallLang) {
  return COPY[lang] ?? EN;
}

const NAV_KEY = {
  "/": "talk",
  "/calls": "calls",
  "/learn": "learn",
  "/people": "people",
  "/messages": "inbox",
} as const;

export function navLabel(lang: HallLang, to: string, fallback: string) {
  const key = NAV_KEY[to as keyof typeof NAV_KEY];
  return key ? hallCopy(lang)[key] : fallback;
}
