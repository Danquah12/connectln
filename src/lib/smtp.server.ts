import nodemailer from "nodemailer";
import { env } from "./env.server";
import { normalizeSmtp, smtpReady, type SmtpSettings } from "./smtp";

export function smtpFromEnv(): SmtpSettings {
  const port = Number(env("SMTP_PORT") ?? "587");
  const tlsEnv = (env("SMTP_TLS") ?? "").toLowerCase();
  const tls =
    tlsEnv === "ssl" || tlsEnv === "none" || tlsEnv === "starttls"
      ? tlsEnv
      : env("SMTP_SECURE") === "1" || port === 465
        ? "ssl"
        : "starttls";
  return normalizeSmtp({
    host: env("SMTP_HOST") ?? env("SMTP_RELAY") ?? "",
    port: Number.isFinite(port) ? port : 587,
    tls,
    user: env("SMTP_USER") ?? "",
    pass: env("SMTP_PASS") ?? "",
    from: env("SMTP_FROM") ?? "ConnectLn hall <mail@hall.connectln>",
    helo: env("SMTP_HELO") ?? "hall.connectln",
    requireAuth: env("SMTP_AUTH") !== "0",
    provider: "custom",
  });
}

export async function sendSmtp(input: {
  settings: SmtpSettings;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const settings = smtpReady(input.settings) ? normalizeSmtp(input.settings) : smtpFromEnv();
  if (!smtpReady(settings)) {
    return { ok: false, reason: "SMTP relay is not configured." };
  }
  const to = input.to.trim();
  if (!to.includes("@") || to.endsWith("@hall.connectln")) {
    return { ok: false, reason: "Need a real outside address. Hall mail already has the letter." };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: settings.host.trim(),
      port: settings.port,
      name: settings.helo,
      secure: settings.tls === "ssl",
      requireTLS: settings.tls === "starttls",
      ignoreTLS: settings.tls === "none",
      auth:
        settings.requireAuth && settings.user.trim()
          ? { user: settings.user.trim(), pass: settings.pass }
          : undefined,
    });
    await transporter.sendMail({
      from: settings.from.trim(),
      to,
      subject: input.subject,
      text: input.text,
      replyTo: input.replyTo,
      envelope: {
        from: settings.from.trim().replace(/^.*<([^>]+)>.*/, "$1"),
        to,
      },
    });
    return { ok: true };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Relay refused the message.";
    return { ok: false, reason };
  }
}
