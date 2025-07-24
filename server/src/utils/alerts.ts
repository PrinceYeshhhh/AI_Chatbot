import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

let alertEmail: string | null = null;
let discordWebhookUrl: string | null = null;
let smtpConfig: any = null;

export function configureAlerts({ email, webhook, smtp }: { email?: string; webhook?: string; smtp?: any }) {
  if (email) alertEmail = email;
  if (webhook) discordWebhookUrl = webhook;
  if (smtp) smtpConfig = smtp;
}

export async function sendAlert(message: string) {
  // Console log always
  console.log('ALERT:', message);
  // Email alert
  if (alertEmail && smtpConfig) {
    try {
      const transporter = nodemailer.createTransport(smtpConfig);
      await transporter.sendMail({
        from: smtpConfig.auth.user,
        to: alertEmail,
        subject: 'AI Platform Alert',
        text: message,
      });
    } catch (e) {
      console.error('Email alert failed:', e);
    }
  }
  // Discord webhook alert
  if (discordWebhookUrl) {
    try {
      await fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });
    } catch (e) {
      console.error('Discord alert failed:', e);
    }
  }
} 