import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as pug from 'pug';
import { convert } from 'html-to-text';

interface User {
  email: string;
}

export interface DeliverOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Render's free instance type blackholes outbound SMTP (ports 25/465/587), so
// production must deliver over Brevo's HTTP API on 443. Set BREVO_API_KEY
// (Brevo dashboard → Settings → SMTP & API → API Keys; starts with
// "xkeysib-" — NOT the SMTP key in MAIL_PASS). Without it, delivery falls
// back to plain SMTP via MAIL_HOST/MAIL_PORT, which only works where SMTP
// egress is allowed (e.g. local dev).
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export class EmailService {
  from: string;
  to: string;
  email: string;
  token: string;

  constructor(user: User, token: string) {
    this.from = `AutoPadi <${process.env.MAIL_EMAIL}>`;
    this.to = user.email;
    this.email = user.email;
    this.token = token;
  }

  static async deliver({ to, subject, html, text }: DeliverOptions) {
    const apiKey = process.env.BREVO_API_KEY;

    if (apiKey) {
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'AutoPadi', email: process.env.MAIL_EMAIL },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          ...(text ? { textContent: text } : {}),
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Brevo API ${response.status}: ${body}`);
      }
      return;
    }

    await nodemailer
      .createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: false,
        requireTLS: true,
        // Fail fast instead of nodemailer's 2-minute default — on hosts that
        // silently drop SMTP egress the connection never completes.
        connectionTimeout: 10_000,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      } as nodemailer.TransportOptions)
      .sendMail({
        from: `AutoPadi <${process.env.MAIL_EMAIL}>`,
        to,
        subject,
        html,
        text,
      });
  }

  async send(template: string, subject: string) {
    // 1. Render HTML based on a pug template
    const templatePath = path.join(process.cwd(), 'views', `${template}.pug`);

    const html = pug.renderFile(templatePath, {
      email: this.email,
      token: this.token,
      subject,
    });

    // 2. Deliver via Brevo API (or SMTP fallback)
    await EmailService.deliver({
      to: this.to,
      subject,
      html,
      text: convert(html),
    });
  }

  async sendWelcomeEmail() {
      await this.send('welcomeEmail', 'AutoPadi - Welcome to AutoPadi!');
  }

  async sendVerifyEmail() {
    await this.send('verifyEmail', 'AutoPadi - Verify Email Address');
  }

  async verifyEmailSuccessEmail() {
      await this.send('verifyEmailSuccess', 'AutoPadi - Email Verified Successfully');
  }

  async sendPasswordResetEmail() {
      await this.send('passwordReset', 'AutoPadi - Password Reset');
  }

  async sendPasswordResetSuccessEmail() {
      await this.send('passwordResetSuccess', 'AutoPadi - Password Reset Successfully');
  }
}

export default EmailService;
