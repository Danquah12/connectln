export type SmtpTls = "starttls" | "ssl" | "none";

export type SmtpSettings = {
  host: string;
  port: number;
  tls: SmtpTls;
  user: string;
  pass: string;
  from: string;
  helo: string;
  requireAuth: boolean;
  provider: string;
};

export type SmtpPreset = {
  id: string;
  label: string;
  host: string;
  port: number;
  tls: SmtpTls;
  userHint: string;
  requireAuth: boolean;
};

export const RELAYS: SmtpPreset[] = [
  {
    id: "custom",
    label: "Your relay",
    host: "",
    port: 587,
    tls: "starttls",
    userHint: "Relay username",
    requireAuth: true,
  },
  {
    id: "sendgrid",
    label: "SendGrid",
    host: "smtp.sendgrid.net",
    port: 587,
    tls: "starttls",
    userHint: "apikey",
    requireAuth: true,
  },
  {
    id: "mailgun",
    label: "Mailgun",
    host: "smtp.mailgun.org",
    port: 587,
    tls: "starttls",
    userHint: "postmaster@your-domain",
    requireAuth: true,
  },
  {
    id: "ses",
    label: "Amazon SES",
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    tls: "starttls",
    userHint: "SES SMTP username",
    requireAuth: true,
  },
  {
    id: "postmark",
    label: "Postmark",
    host: "smtp.postmarkapp.com",
    port: 587,
    tls: "starttls",
    userHint: "Server API token",
    requireAuth: true,
  },
  {
    id: "internal",
    label: "IP-allowlisted relay",
    host: "",
    port: 25,
    tls: "none",
    userHint: "Leave blank if the relay trusts this hall",
    requireAuth: false,
  },
];

export const EMPTY_SMTP: SmtpSettings = {
  host: "",
  port: 587,
  tls: "starttls",
  user: "",
  pass: "",
  from: "ConnectLn hall <mail@hall.connectln>",
  helo: "hall.connectln",
  requireAuth: true,
  provider: "custom",
};

export function normalizeSmtp(raw: Partial<SmtpSettings> & { secure?: boolean }): SmtpSettings {
  const tls: SmtpTls =
    raw.tls ?? (raw.secure ? "ssl" : EMPTY_SMTP.tls);
  return {
    ...EMPTY_SMTP,
    ...raw,
    tls,
    port: Number(raw.port) || (tls === "ssl" ? 465 : EMPTY_SMTP.port),
    helo: (raw.helo ?? EMPTY_SMTP.helo).trim() || EMPTY_SMTP.helo,
    requireAuth: raw.requireAuth ?? true,
    provider: raw.provider ?? "custom",
  };
}

export function smtpReady(s: SmtpSettings) {
  const n = normalizeSmtp(s);
  if (!n.host.trim() || !n.from.trim() || !n.port) return false;
  if (n.requireAuth && (!n.user.trim() || !n.pass)) return false;
  return true;
}
