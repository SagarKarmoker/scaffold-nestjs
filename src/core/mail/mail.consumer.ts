import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { EmailTemplatesService } from './templates.service';

@Processor('email')
@Injectable()
export class EmailConsumer extends WorkerHost {
  private readonly logger = new Logger(EmailConsumer.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly expiryMinutes = 15;

  constructor(
    private readonly configService: ConfigService,
    private readonly templatesService: EmailTemplatesService,
  ) {
    super();
    this.fromEmail =
      this.configService.get<string>('SMTP_USER') || 'noreply@example.com';
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST') || 'smtp.example.com',
      port: this.configService.get<number>('MAIL_PORT') || 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'send-welcome-email':
        return this.sendWelcomeEmail(job.data.email, job.data.name);
      case 'send-verification-email':
        return this.sendVerificationEmail(
          job.data.email,
          job.data.name,
          job.data.code,
        );
      case 'send-password-reset-email':
        return this.sendPasswordResetEmail(
          job.data.email,
          job.data.token,
          job.data.name,
        );
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

  private async sendWelcomeEmail(email: string, name: string) {
    this.logger.log(`Sending welcome email to ${email} for ${name}`);

    const html = this.templatesService.renderWelcomeEmail({ name, email });

    await this.transporter.sendMail({
      from: this.fromEmail,
      to: email,
      subject: 'Welcome to MyApp! 🎉',
      html,
    });
    this.logger.log(`Welcome email sent to ${email}`);
  }

  private async sendVerificationEmail(
    email: string,
    name: string,
    code: string,
  ) {
    this.logger.log(`Sending verification email to ${email}`);

    const html = this.templatesService.renderVerificationEmail({
      email,
      name,
      code,
      expiryMinutes: 30,
    });

    await this.transporter.sendMail({
      from: this.fromEmail,
      to: email,
      subject: 'Verify Your Email Address',
      html,
    });
    this.logger.log(`Verification email sent to ${email}`);
  }

  private async sendPasswordResetEmail(
    email: string,
    token: string,
    name?: string,
  ) {
    this.logger.log(`Sending password reset email to ${email}`);

    const html = this.templatesService.renderPasswordResetEmail({
      email,
      code: token,
      name: name || 'User',
      expiryMinutes: this.expiryMinutes,
    });

    await this.transporter.sendMail({
      from: this.fromEmail,
      to: email,
      subject: 'Reset Your Password',
      html,
    });
    this.logger.log(`Password reset email sent to ${email}`);
  }
}
