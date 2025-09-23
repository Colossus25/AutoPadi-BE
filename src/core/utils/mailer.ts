import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as pug from 'pug';
import { convert } from 'html-to-text';

interface User {
  email: string;
}

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

  newTransport() {
    return nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    } as nodemailer.TransportOptions);
  }

  async send(template: string, subject: string) {
    // 1. Render HTML based on a pug template
    const templatePath = path.join(process.cwd(), 'views', `${template}.pug`);

    const html = pug.renderFile(templatePath, {
      email: this.email,
      token: this.token,
      subject,
    });

    // 2. Define email options
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };

    // 3. Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
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
