import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type { SmtpSettings } from "./smtp";

export const dispatchSmtp = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (data: {
      to: string;
      subject: string;
      text: string;
      replyTo?: string;
      settings: SmtpSettings;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { sendSmtp } = await import("./smtp.server");
    return sendSmtp(data);
  });
