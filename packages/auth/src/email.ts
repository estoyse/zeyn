import { env } from "@zeyn/env/server";
import { Resend } from "resend";

const FROM = "Zeyn <noreply@zeyn.uz>";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const resend = new Resend(env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Failed to send email to ${to}: ${error.message}`);
  }

  return data;
}
