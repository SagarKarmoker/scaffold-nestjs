import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectQueue('email')
    private readonly emailQueue: Queue,
  ) {}

  async sendWelcomeEmail(email: string, name: string) {
    try {
      await this.emailQueue.add('send-welcome-email', {
        email,
        name,
      });
    } catch (error) {
      this.logger.error('Error sending welcome email', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string, name?: string) {
    try {
      await this.emailQueue.add('send-password-reset-email', {
        email,
        token,
        name,
      });
    } catch (error) {
      this.logger.error('Error sending password reset email', error);
      throw error;
    }
  }
}
